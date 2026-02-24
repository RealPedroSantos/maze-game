export interface LevelConfig {
    width: number;
    height: number;
    dilationIterations: number;
    erosionStart: boolean;
    coinCount: number;
    trapCount: number;
}

export function getDifficultyConfig(level: number): LevelConfig {
    const clampLevel = Math.max(1, Math.min(level, 50));

    let width = 11;
    let height = 11;

    // Smoother scaling: Start very small at L1, grow to medium at L10
    if (clampLevel <= 10) {
        width = 7 + Math.floor(clampLevel / 2) * 2; // Level 1 is 7x7. Level 10 is 15x15
        height = 7 + Math.floor((clampLevel + 1) / 2) * 2;
    } else if (clampLevel <= 30) {
        // Moderate growth: 15x15 to ~31x35
        width = 15 + Math.floor((clampLevel - 10) * 0.8);
        height = 15 + Math.floor((clampLevel - 10) * 1.0);
    } else {
        // Slow growth cap: max out at ~39x43 at level 50
        width = 31 + Math.floor((clampLevel - 30) * 0.4);
        height = 35 + Math.floor((clampLevel - 30) * 0.4);
    }

    // Odd dimensions requirement
    width = width % 2 === 0 ? width + 1 : width;
    height = height % 2 === 0 ? height + 1 : height;

    // Cap max size so levels never feel impossibly large
    width = Math.min(width, 41);
    height = Math.min(height, 45);

    let dilationIterations = 0;
    let erosionStart = false;
    let coinCount = 3;
    let trapCount = 0;

    // Level 1-5: Very easy — wide open rooms, lots of coins, no traps
    if (clampLevel <= 5) {
        dilationIterations = 4;
        coinCount = 5 + clampLevel;
        trapCount = 0;
    }
    // Level 6-10: Easy — still dilated, a few traps appear
    else if (clampLevel <= 10) {
        dilationIterations = 2;
        coinCount = 6;
        trapCount = Math.min(clampLevel - 5, 2);
    }
    // Level 11-20: Medium — some dilation remains to keep corridors passable
    else if (clampLevel <= 20) {
        dilationIterations = 1;
        coinCount = 4 + Math.floor((clampLevel - 10) / 3);
        trapCount = 2 + Math.floor((clampLevel - 10) / 4);
    }
    // Level 21-35: Hard — minimal dilation, more traps but still fair
    else if (clampLevel <= 35) {
        dilationIterations = 1; // Keep minimum 1 dilation so paths aren't 1-cell wide
        erosionStart = false;
        coinCount = 3 + Math.floor((clampLevel - 20) / 5);
        trapCount = 3 + Math.floor((clampLevel - 20) / 4);
    }
    // Level 36-50: Expert — tight but never impossible
    else {
        dilationIterations = 1; // Always keep at least 1 dilation
        erosionStart = true;
        coinCount = 2 + Math.floor((clampLevel - 35) / 5);
        trapCount = 4 + Math.floor((clampLevel - 35) / 4);
    }

    // Cap traps relative to available space so we never block the path
    const maxTraps = Math.floor((width * height) * 0.03); // Max 3% of cells
    trapCount = Math.min(trapCount, maxTraps);

    return {
        width,
        height,
        dilationIterations,
        erosionStart,
        coinCount,
        trapCount
    };
}
