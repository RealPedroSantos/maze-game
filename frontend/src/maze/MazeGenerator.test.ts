import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MazeGenerator } from './MazeGenerator.js';

describe('MazeGenerator', () => {
    it('should generate a maze of the correct dimensions', () => {
        const maze = new MazeGenerator(10, 10, 'seed123');
        maze.generate();

        assert.equal(maze.grid.length, 11);
        assert.equal(maze.grid[0].length, 11);
    });

    it('should be deterministic given the same seed', () => {
        const maze1 = new MazeGenerator(15, 15, 'fixed-seed-abc');
        maze1.generate();

        const maze2 = new MazeGenerator(15, 15, 'fixed-seed-abc');
        maze2.generate();

        assert.deepEqual(maze1.grid, maze2.grid);
        assert.deepEqual(maze1.startPos, maze2.startPos);
        assert.deepEqual(maze1.exitPos, maze2.exitPos);
    });

    it('should generate different mazes for different seeds', () => {
        const maze1 = new MazeGenerator(15, 15, 'seed-A');
        maze1.generate();

        const maze2 = new MazeGenerator(15, 15, 'seed-B');
        maze2.generate();

        assert.notDeepEqual(maze1.grid, maze2.grid);
    });
});
