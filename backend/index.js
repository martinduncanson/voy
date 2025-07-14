import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import winston from 'winston';
import { PrismaClient } from '@prisma/client';
import http from 'http';
import https from 'https'; // For HTTPS in prod
import { Server } from 'socket.io';
import cron from 'node-cron';
import fs from 'fs'; // For HTTPS keys

import authRoutes from './routes/auth.js';
import propertiesRoutes from './routes/properties.js';
import reservationsRoutes from './routes/reservations.js';
import aiRoutes from './routes/ai.js';
import reportsRoutes from './routes/reports.js';
import { syncChannels } from './services/channelService.js';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

const app = express();
const prisma = new PrismaClient();

const rateLimiter = new RateLimiterMemory({ points: 10, duration: 1 });

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  rateLimiter.consume(req.ip).then(() => next()).catch(() => res.status(429).send('Too Many Requests'));
});

app.use('/api/auth', authRoutes);
app.use('/api/properties', propertiesRoutes);
app.use('/api/reservations', reservationsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/reports', reportsRoutes);

// Server setup (HTTPS for prod, HTTP for dev)
let server;
if (process.env.NODE_ENV === 'production') {
  const privateKey = fs.readFileSync('privkey.pem', 'utf8');
  const certificate = fs.readFileSync('cert.pem', 'utf8');
  const credentials = { key: privateKey, cert: certificate };
  server = https.createServer(credentials, app);
} else {
  server = http.createServer(app);
}

const io = new Server(server, { cors: { origin: '*' } });

io.on('connection', (socket) => {
  logger.info('User connected');
  socket.on('disconnect', () => logger.info('User disconnected'));
});

// Cron for channel sync
cron.schedule('*/5 * * * *', async () => {
  await syncChannels();
  io.emit('syncUpdate', { message: 'Channels synced' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => logger.info(`Server running on port ${PORT}`));