const API_BASE_URL = window.location.origin.includes('localhost') && window.location.port === '5173'
    ? 'http://localhost:3000/api' // local dev
    : `${window.location.origin}/api`; // docker / production

export interface LeaderboardEntry {
    name: string;
    best_level: number;
    crowned: boolean;
    updated_at: string;
}

export class ApiClient {
    public static async fetchLeaderboard(limit: number = 50): Promise<LeaderboardEntry[]> {
        try {
            const response = await fetch(`${API_BASE_URL}/leaderboard?limit=${limit}`);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Failed to fetch leaderboard:', error);
            return [];
        }
    }

    public static async submitScore(name: string, levelReached: number): Promise<boolean> {
        try {
            const response = await fetch(`${API_BASE_URL}/score`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, levelReached }),
            });
            return response.ok;
        } catch (error) {
            console.error('Failed to submit score synchronously:', error);
            return false;
        }
    }
}
