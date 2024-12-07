import express from 'express';
import dotenv from 'dotenv';
import logger from './logger';

dotenv.config();

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Middleware to log API requests and responses
app.use((req, res, next) => {
    const logData = {
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.originalUrl,
        headers: req.headers,
        query: req.query,
        body: req.body,
    };

    // Convert log data to JSON string for request
    const requestLogString = JSON.stringify(logData, null, 2);

    // Log the request data
    logger.info(`Request:\n${requestLogString}`);
    console.log(`Request:\n${requestLogString}`);

    // Capture response data
    const originalSend = res.send;
    res.send = function (body) {
        const responseLogData = {
            status: res.statusCode,
            responseBody: body,
        };

        // Convert log data to JSON string for response
        const responseLogString = JSON.stringify(responseLogData, null, 2);

        // Log the response data
        logger.info(`Response:\n${responseLogString}`);
        console.log(`Response:\n${responseLogString}`);

        // Call the original send function with the response body
        return originalSend.call(this, body);
    };

    next(); // Pass control to the next middleware/route handler
});

import authenticateRoutes from './routes/authenticate';
import resetRoutes from './routes/reset';
import packageRoutes from './routes/package';
import packagesRoutes from './routes/packages';
import tracksRoutes from './routes/tracks';

app.use('/authenticate', authenticateRoutes);
app.use('/reset', resetRoutes);
app.use('/package', packageRoutes);
app.use('/packages', packagesRoutes);
app.use('/tracks', tracksRoutes);

export default app;
