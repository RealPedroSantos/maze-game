import { buildApp } from './app.js';

const server = buildApp();

const start = async () => {
    try {
        const port = parseInt(process.env.PORT || '3000', 10);
        const host = process.env.HOST || '0.0.0.0';

        await server.listen({ port, host });

        server.log.info(`Server running at http://${host}:${port}`);
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start();
