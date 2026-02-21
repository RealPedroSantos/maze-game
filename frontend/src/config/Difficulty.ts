export interface LevelConfig {
    width: number;
    height: number;
    dilationIterations: number;
    erosionStart: boolean;
}

export function getDifficultyConfig(level: number): LevelConfig {
    const clampLevel = Math.max(1, Math.min(level, 50));

    let width = 11;
    let height = 11;

    // Smoother scaling: Start very small at L1, grow to medium at L10
    if (clampLevel <= 10) {
        width = 7 + Math.floor(clampLevel / 2) * 2; // Level 1 is 7x7. Level 10 is 15x15
        height = 7 + Math.floor((clampLevel + 1) / 2) * 2; // Slight rectangular growth
    } else {
        // Base 15x15 sizes and above growing linearly
        width = 15 + Math.floor((clampLevel - 10) * 1.5);
        height = 15 + Math.floor((clampLevel - 10) * 2);
    }

    // Odd dimensions requirement
    width = width % 2 === 0 ? width + 1 : width;
    height = height % 2 === 0 ? height + 1 : height;

    let dilationIterations = 0;
    let erosionStart = false;

    // Level 1-10: Easy, highly dilated rooms (wide paths)
    if (clampLevel <= 10) {
        // More dilation at lower levels to guarantee large inner squares
        dilationIterations = clampLevel <= 5 ? 4 : 2;
    }
    // Level 11-20: Medium, somewhat dilated to reduce choke points
    else if (clampLevel <= 20) {
        dilationIterations = 1;
    }
    // Level 21-50: Hard, zero dilation, start eroding walls for trick paths
    else {
        dilationIterations = 0;
        erosionStart = true;
    }

    return {
        width,
        height,
        dilationIterations,
        erosionStart
    };
}
