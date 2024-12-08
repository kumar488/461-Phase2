import app from './app';
import logger from './logger';
import { createDatabase } from './packages/packagedb';

const PORT = process.env.PORT || 3000;

// Initialize database
const initializeDatabase = async () => {
    try {
        logger.info('Initializing database...');
        await createDatabase();
        logger.info('Database initialized successfully.');
    } catch (error) {
        logger.error('Failed to initialize the database:', error);
        process.exit(1); // Exit if database initialization fails
    }
};

// Start the server
const startServer = async () => {
    await initializeDatabase(); // Ensure database is initialized before starting the server

    app.listen(PORT, () => {
        logger.info(`Server running on http://localhost:${PORT}`);
        console.log(`Server running on http://localhost:${PORT}`);
    });
};

startServer();