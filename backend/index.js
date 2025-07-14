const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const winston = require('winston');
const { PrismaClient } = require('@prisma/client');
const http = require('http');
const socketIo = require('socket.io');
const cron = require('node-cron');

const authRoutes = require('./routes/auth');
const propertiesRoutes = require('./routes/properties');
const reservationsRoutes = require('./routes/reservations');
const aiRoutes = require('./routes/ai');
const reportsRoutes = require('./routes/reports');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*' } });

const prisma = new PrismaClient();

const rateLimiter = new RateLimiterMemory({
  points: 10,
  duration: 1,
});

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  rateLimiter.consume(req.ip)
    .then(() => next())
    .catch(() => res.status(429).send('Too Many Requests'));
});

app.use('/api/auth', authRoutes);
app.use('/api/properties', propertiesRoutes);
app.use('/api/reservations', reservationsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/reports', reportsRoutes);

io.on('connection', (socket) => {
  logger.info('User connected');
  socket.on('disconnect', () => logger.info('User disconnected'));
});

// Cron for channel sync (emit updates via socket)
cron.schedule('*/5 * * * *', async () => {
  // Sync logic...
  io.emit('syncUpdate', { message: 'Channels synced' });
});

server.listen(5000, () => logger.info('Server running on port 5000'));