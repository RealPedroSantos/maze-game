import { ApiClient } from './ApiClient';

interface ScorePayload {
    name: string;
    levelReached: number;
    timestamp: number;
    retries: number;
}

const STORAGE_KEY = 'maze_syncQueue';

export class SyncQueue {
    private static instance: SyncQueue;
    private queue: ScorePayload[] = [];
    private isProcessing: boolean = false;
    private autoSyncInterval: any = null;

    private constructor() {
        this.loadFromStorage();
        // Attempt sync immediately on boot
        this.processQueue();
        // Setup retry interval every 10 seconds
        this.autoSyncInterval = setInterval(() => this.processQueue(), 10000);
    }

    public static getInstance(): SyncQueue {
        if (!SyncQueue.instance) {
            SyncQueue.instance = new SyncQueue();
        }
        return SyncQueue.instance;
    }

    public enqueueScore(name: string, levelReached: number) {
        // Only queue if it improves upon previously queued scores for the same user
        const existingIndex = this.queue.findIndex(item => item.name === name);
        if (existingIndex >= 0) {
            if (this.queue[existingIndex].levelReached < levelReached) {
                this.queue[existingIndex].levelReached = levelReached;
                this.queue[existingIndex].timestamp = Date.now();
                this.queue[existingIndex].retries = 0;
            }
        } else {
            this.queue.push({ name, levelReached, timestamp: Date.now(), retries: 0 });
        }

        this.saveToStorage();
        this.processQueue();
    }

    private async processQueue() {
        if (this.isProcessing || this.queue.length === 0) return;

        // Simple online navigator check
        if (!navigator.onLine) return;

        this.isProcessing = true;
        const remainingQueue: ScorePayload[] = [];

        for (const item of this.queue) {
            // Exponential backoff mock check (e.g. timeout based on retries)
            const success = await ApiClient.submitScore(item.name, item.levelReached);

            if (!success) {
                item.retries++;
                // If it fails more than 20 times (likely malformed or backend dead), we still keep it but maybe warn
                if (item.retries < 100) {
                    remainingQueue.push(item);
                }
            }
        }

        this.queue = remainingQueue;
        this.saveToStorage();
        this.isProcessing = false;
    }

    private saveToStorage() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
    }

    private loadFromStorage() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (data) {
                this.queue = JSON.parse(data);
            }
        } catch (e) {
            this.queue = [];
        }
    }

    public destroy() {
        if (this.autoSyncInterval) {
            clearInterval(this.autoSyncInterval);
        }
    }
}
