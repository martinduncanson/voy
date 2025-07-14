const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/authMiddleware');

const prisma = new PrismaClient();
const router = express.Router();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const reservations = await prisma.reservation.findMany({
    skip: (page - 1) * limit,
    take: parseInt(limit),
  });
  res.json(reservations);
});

router.post('/', async (req, res) => {
  const reservation = await prisma.reservation.create({ data: req.body });
  // Auto-housekeeping: Create task if checkout
  if (req.body.status === 'checked_out') {
    // Logic to generate cleaning task (e.g., log or DB entry)
  }
  res.json(reservation);
});

// Add edit/cancel similarly with Prisma

module.exports = router;