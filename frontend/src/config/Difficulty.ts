export interface LevelConfig {
    width: number;
    height: number;
    dilationIterations: number;
    erosionStart: boolean;
}

export function getDifficultyConfig(level: number): LevelConfig {
    const clampLevel = Math.max(1, Math.min(level, 50));

    // Base 11x11, grows linearly until level 20, then harder
    let width = 11 + Math.floor(clampLevel * 1.5);
    let height = 11 + Math.floor(clampLevel * 2);

    // Odd dimensions requirement
    width = width % 2 === 0 ? width + 1 : width;
    height = height % 2 === 0 ? height + 1 : height;

    let dilationIterations = 0;
    let erosionStart = false;

    // Level 1-5: Easy, highly dilated
    if (clampLevel <= 5) {
        dilationIterations = 3;
    }
    // Level 6-20: Medium, somewhat dilated to reduce choke points
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
