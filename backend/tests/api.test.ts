import test, { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import { buildApp } from '../src/app.js';
import { pool } from '../src/db.js';

// Mock the pool.query
mock.method(pool, 'query', async () => []);

describe('API Routes', () => {
    const app = buildApp();

    it('GET /health returns ok', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/health'
        });
        assert.strictEqual(response.statusCode, 200);
        assert.strictEqual(JSON.parse(response.payload).status, 'ok');
    });

    it('POST /api/score validates invalid name', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/api/score',
            payload: {
                name: 'a', // Too short
                levelReached: 10
            }
        });
        assert.strictEqual(response.statusCode, 400);
    });

    it('POST /api/score validates level out of bounds', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/api/score',
            payload: {
                name: 'player1',
                levelReached: 51 // Too high
            }
        });
        assert.strictEqual(response.statusCode, 400);
    });

    it('POST /api/score saves correct score and crowns if level >= 50', async () => {
        const queryMock = pool.query as ReturnType<typeof mock.method>;
        queryMock.mock.mockImplementationOnce(async () => {
            return { rows: [{ name: 'player1', best_level: 50, crowned: true }] };
        });

        const response = await app.inject({
            method: 'POST',
            url: '/api/score',
            payload: {
                name: 'player1',
                levelReached: 50
            }
        });

        assert.strictEqual(response.statusCode, 200);
        const data = JSON.parse(response.payload);
        assert.strictEqual(data.crowned, true);

        assert.strictEqual(queryMock.mock.callCount() >= 1, true);
        const callArgs = queryMock.mock.calls[queryMock.mock.callCount() - 1].arguments;
        assert.strictEqual(callArgs[1][2], true); // isCrowned sequence should be true
    });
});
