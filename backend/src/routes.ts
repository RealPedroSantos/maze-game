import type { FastifyInstance } from 'fastify';
import { pool } from './db';

const scoreSchema = {
    body: {
        type: 'object',
        required: ['name', 'levelReached'],
        properties: {
            name: { type: 'string', minLength: 3, maxLength: 20, pattern: '^[a-zA-Z0-9_ ]+$' },
            levelReached: { type: 'integer', minimum: 1, maximum: 50 },
        }
    }
};

export async function setupRoutes(fastify: FastifyInstance) {

    fastify.get('/health', async (request, reply) => {
        return { status: 'ok', time: new Date().toISOString() };
    });

    fastify.get('/api/leaderboard', async (request, reply) => {
        const { limit = 50 } = request.query as any;

        try {
            const result = await pool.query(
                `SELECT name, best_level, crowned, updated_at 
         FROM players 
         ORDER BY crowned DESC, best_level DESC, updated_at ASC 
         LIMIT $1`,
                [Math.min(limit, 100)]
            );

            return result.rows;
        } catch (err) {
            fastify.log.error(err);
            return reply.status(500).send({ error: 'Database error' });
        }
    });

    fastify.post('/api/score', { schema: scoreSchema }, async (request, reply) => {
        const { name, levelReached } = request.body as { name: string, levelReached: number };
        const normalizedName = name.replace(/\s+/g, ' ').trim();

        const isCrowned = levelReached >= 50;

        try {
            const query = `
        INSERT INTO players (name, best_level, crowned, updated_at, created_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        ON CONFLICT (name) DO UPDATE 
        SET 
          best_level = GREATEST(players.best_level, EXCLUDED.best_level),
          crowned = players.crowned OR EXCLUDED.crowned,
          updated_at = NOW()
        RETURNING name, best_level, crowned, updated_at
      `;

            const result = await pool.query(query, [normalizedName, levelReached, isCrowned]);
            return result.rows[0];
        } catch (err) {
            fastify.log.error(err);
            return reply.status(500).send({ error: 'Failed to update score' });
        }
    });
}
