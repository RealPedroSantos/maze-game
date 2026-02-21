import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import { setupRoutes } from '../src/routes.js';

describe('Player API Endpoints', () => {
    let app: FastifyInstance;

    before(async () => {
        app = Fastify();
        await app.register(setupRoutes);
        await app.ready();
    });

    after(async () => {
        await app.close();
    });

    it('GET /health should return status ok', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/health'
        });

        assert.equal(response.statusCode, 200);
        const body = response.json();
        assert.equal(body.status, 'ok');
        assert.ok(body.time);
    });

    it('POST /api/score should return 400 for invalid body', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/api/score',
            payload: { name: 'Player' } // missing levelReached
        });

        assert.equal(response.statusCode, 400); // Bad Request
    });
});
