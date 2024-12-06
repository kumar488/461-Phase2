import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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
