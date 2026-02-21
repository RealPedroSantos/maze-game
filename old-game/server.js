const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files
app.use(express.static(path.join(__dirname, '.')));

// Game State
// rooms[roomCode] = { players: [socketId1, socketId2], board: [], currentTurn: 'green', scores: {green:0, yellow:0} }
const rooms = {};

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Create Room
    socket.on('createRoom', () => {
        const roomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
        rooms[roomCode] = {
            players: [socket.id],
            board: null, // Host will send the board
            ready: false
        };
        socket.join(roomCode);
        // Map socket to room?
        socket.roomCode = roomCode;
        socket.playerColor = 'green';
        socket.emit('roomCreated', { roomCode, player: 'green' });
    });

    // Join Room
    socket.on('joinRoom', (roomCode) => {
        const room = rooms[roomCode];
        if (room && room.players.length < 2) {
            room.players.push(socket.id);
            socket.join(roomCode);
            socket.roomCode = roomCode;
            socket.playerColor = 'yellow';

            room.ready = true;

            // Notify Host to start game (send board)
            io.to(room.players[0]).emit('playerJoined');
            socket.emit('roomJoined', { roomCode, player: 'yellow' });
        } else {
            socket.emit('error', 'Room not found or full');
        }
    });

    // Start Game (Host sends board)
    socket.on('startGame', (boardData) => {
        const room = rooms[socket.roomCode];
        if (room) {
            room.board = boardData;
            // Broadcast start to all in room
            io.to(socket.roomCode).emit('gameStart', boardData);
        }
    });

    // Player Move
    socket.on('makeMove', (data) => {
        // data = { index, cardType }
        const room = rooms[socket.roomCode];
        if (room) {
            // Relay move to everyone in room (including sender, or exclude?)
            // Usually exclude sender if they updated optimistically, but easier to just broadcast to others
            socket.to(socket.roomCode).emit('remoteMove', {
                index: data.index,
                cardType: data.cardType, // Security: Better if server held this, but for LAN this is fine
                player: socket.playerColor
            });
        }
    });

    // Restart Game
    socket.on('restartGame', () => {
        const room = rooms[socket.roomCode];
        if (room) {
            io.to(socket.roomCode).emit('gameRestartReq');
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // Handle disconnect logic (end game, notify other)
        if (socket.roomCode && rooms[socket.roomCode]) {
            io.to(socket.roomCode).emit('playerLeft');
            delete rooms[socket.roomCode];
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
