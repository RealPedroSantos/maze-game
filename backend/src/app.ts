import fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { setupRoutes } from './routes.js';
import dotenv from 'dotenv';

dotenv.config();

export function buildApp(): FastifyInstance {
    const app = fastify({
        logger: process.env.NODE_ENV === 'test' ? false : {
            transport: {
                target: 'pino-pretty'
            }
        }
    });

    app.register(cors, {
        origin: '*',
    });

    app.register(rateLimit, {
        max: 100,
        timeWindow: '1 minute'
    });

    app.register(setupRoutes);

    return app;
}
