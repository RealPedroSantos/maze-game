import { SeededRandom } from './Random';

export enum CellType {
    WALL = 1,
    PATH = 0,
    START = 2,
    EXIT = 3,
    COIN = 4,
    TRAP = 5
}

export interface GridPos {
    x: number;
    y: number;
}

export class MazeGenerator {
    private width: number;
    private height: number;
    public grid: number[][]; // 0 = path, 1 = wall
    private rng: SeededRandom;

    public startPos: GridPos = { x: 1, y: 1 };
    public exitPos: GridPos = { x: 1, y: 1 };
    public coinPositions: GridPos[] = [];
    public trapPositions: GridPos[] = [];

    constructor(width: number, height: number, seed: string) {
        // Ensure odd dimensions for the standard maze topology
        this.width = width % 2 === 0 ? width + 1 : width;
        this.height = height % 2 === 0 ? height + 1 : height;

        this.rng = new SeededRandom(seed);

        // Initialize everything as WALL
        this.grid = Array(this.height).fill(0).map(() => Array(this.width).fill(CellType.WALL));
    }

    public generate(): number[][] {
        this.recursiveBacktracker(1, 1);

        // Mark Start and End points
        this.startPos = { x: 1, y: 1 };
        this.grid[this.startPos.y][this.startPos.x] = CellType.START;

        // Find furthest point for exit
        this.calculateExit();

        return this.grid;
    }

    /**
     * Places coins and traps on PATH cells, avoiding a safe zone around START.
     */
    public placeItems(coinCount: number, trapCount: number) {
        // Collect all PATH cells that are not too close to start
        const candidates: GridPos[] = [];
        const safeRadius = 3; // Manhattan distance from start to keep clear

        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                if (this.grid[y][x] === CellType.PATH) {
                    const distFromStart = Math.abs(x - this.startPos.x) + Math.abs(y - this.startPos.y);
                    if (distFromStart > safeRadius) {
                        candidates.push({ x, y });
                    }
                }
            }
        }

        // Shuffle candidates deterministically
        for (let i = candidates.length - 1; i > 0; i--) {
            const j = Math.floor(this.rng.next() * (i + 1));
            [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
        }

        // Place coins first
        const actualCoins = Math.min(coinCount, candidates.length);
        for (let i = 0; i < actualCoins; i++) {
            const pos = candidates[i];
            this.grid[pos.y][pos.x] = CellType.COIN;
            this.coinPositions.push(pos);
        }

        // Place traps from remaining candidates
        const remaining = candidates.slice(actualCoins);
        const actualTraps = Math.min(trapCount, remaining.length);
        for (let i = 0; i < actualTraps; i++) {
            const pos = remaining[i];
            this.grid[pos.y][pos.x] = CellType.TRAP;
            this.trapPositions.push(pos);
        }
    }

    private recursiveBacktracker(startX: number, startY: number) {
        const stack: { x: number, y: number }[] = [{ x: startX, y: startY }];
        this.grid[startY][startX] = CellType.PATH;

        while (stack.length > 0) {
            const current = stack[stack.length - 1];
            const neighbors = this.getUnvisitedNeighbors(current.x, current.y);

            if (neighbors.length === 0) {
                stack.pop();
            } else {
                // Pick random neighbor
                const next = this.rng.pick(neighbors);

                // Carve wall between current and next
                this.grid[next.wallY][next.wallX] = CellType.PATH;

                // Mark next as visited path
                this.grid[next.y][next.x] = CellType.PATH;

                stack.push({ x: next.x, y: next.y });
            }
        }
    }

    private getUnvisitedNeighbors(x: number, y: number) {
        const directions = [
            { dx: 0, dy: -2, wx: 0, wy: -1 }, // North
            { dx: 2, dy: 0, wx: 1, wy: 0 },   // East
            { dx: 0, dy: 2, wx: 0, wy: 1 },   // South
            { dx: -2, dy: 0, wx: -1, wy: 0 }  // West
        ];

        const unvisited = [];
        for (let dir of directions) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;

            // Check boundaries
            if (nx > 0 && nx < this.width - 1 && ny > 0 && ny < this.height - 1) {
                // If it's still a WALL, it is unvisited
                if (this.grid[ny][nx] === CellType.WALL) {
                    unvisited.push({
                        x: nx,
                        y: ny,
                        wallX: x + dir.wx,
                        wallY: y + dir.wy
                    });
                }
            }
        }

        return unvisited;
    }

    /**
     * Applies a morphological dilation to paths to create open rooms/corridors
     * Mostly for early levels.
     */
    public dilatePaths(iterations: number = 1) {
        for (let i = 0; i < iterations; i++) {
            let newGrid = this.grid.map(row => [...row]);
            for (let y = 1; y < this.height - 1; y++) {
                for (let x = 1; x < this.width - 1; x++) {
                    if (this.grid[y][x] === CellType.PATH) {
                        // Random chance to carve adjacent walls to broaden path, preserving the outer boundary
                        if (y + 1 < this.height - 1 && this.grid[y + 1][x] === CellType.WALL && this.rng.next() > 0.6) newGrid[y + 1][x] = CellType.PATH;
                        if (x + 1 < this.width - 1 && this.grid[y][x + 1] === CellType.WALL && this.rng.next() > 0.6) newGrid[y][x + 1] = CellType.PATH;
                    }
                }
            }
            this.grid = newGrid;
        }
    }

    private calculateExit() {
        // Find all possible path cells
        const validPaths: GridPos[] = [];
        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                if (this.grid[y][x] === CellType.PATH) {
                    validPaths.push({ x, y });
                }
            }
        }

        // Sort by Manhattan distance from start (1,1)
        validPaths.sort((a, b) => {
            const distA = Math.abs(a.x - 1) + Math.abs(a.y - 1);
            const distB = Math.abs(b.x - 1) + Math.abs(b.y - 1);
            return distB - distA; // Descending (furthest first)
        });

        // Take the top 10% furthest points (minimum 1 to ensure it works on tiny maps)
        const candidatesCount = Math.max(1, Math.floor(validPaths.length * 0.10));
        const candidates = validPaths.slice(0, candidatesCount);

        // Pick one randomly from the furthest candidates
        const chosen = this.rng.pick(candidates) || candidates[0];

        this.exitPos = { x: chosen.x, y: chosen.y };
        this.grid[chosen.y][chosen.x] = CellType.EXIT;
    }
}
