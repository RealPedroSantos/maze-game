export class GameData {
    private static instance: GameData;

    public playerName: string = '';
    public bestLevel: number = 0;
    public currentLevel: number = 1;
    public runId: string = '';
    public runStartTime: number = 0;

    private constructor() {
        // Load from local storage if exists
        const storedName = localStorage.getItem('maze_playerName');
        const storedBest = localStorage.getItem('maze_bestLevel');
        if (storedName) this.playerName = storedName;
        if (storedBest) {
            this.bestLevel = parseInt(storedBest, 10);
            this.currentLevel = Math.max(1, this.bestLevel);
        }
    }

    public static getInstance(): GameData {
        if (!GameData.instance) {
            GameData.instance = new GameData();
        }
        return GameData.instance;
    }

    public setPlayerName(name: string) {
        if (this.playerName !== name) {
            this.playerName = name;
            this.bestLevel = 0;
            this.currentLevel = 1;
            localStorage.setItem('maze_playerName', name);
            localStorage.setItem('maze_bestLevel', '0');
        }
    }

    public updateBestLevel(level: number) {
        if (level > this.bestLevel) {
            this.bestLevel = level;
            localStorage.setItem('maze_bestLevel', level.toString());
        }
    }
}
