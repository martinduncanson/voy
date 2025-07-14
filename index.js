import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';

import authRoutes from './routes/auth.js';
import propertyRoutes from './routes/properties.js';
import reservationRoutes from './routes/reservations.js';
import aiRoutes from './routes/ai.js';
import { runChannelSync } from './services/channelService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/ai', aiRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.send('VoyAI Backend is running!');
});

// Cron job for channel synchronization (every 5 minutes)
// This demonstrates automated background tasks.
cron.schedule('*/5 * * * *', () => {
  console.log('Running scheduled channel synchronization...');
  runChannelSync().catch(err => console.error('Scheduled sync failed:', err));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Simulation Mode: ${process.env.SIM_MODE === 'true'}`);
});
