const express = require('express');
const tf = require('@tensorflow/tfjs');
const nodemailer = require('nodemailer');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const router = express.Router();

const transporter = nodemailer.createTransport({
  service: 'gmail', // Stub; use env for real
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

// Smart Pricing with TF.js
router.post('/smart-pricing', async (req, res) => {
  const { occupancy, seasonality } = req.body;
  // Simple model example
  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 1, inputShape: [2] }));
  model.compile({ loss: 'meanSquaredError', optimizer: 'sgd' });
  // Train on dummy data (in prod, load pre-trained)
  const xs = tf.tensor2d([[0.5, 1], [0.8, 0.5]], [2, 2]);
  const ys = tf.tensor2d([0.9, 1.1], [2, 1]);
  await model.fit(xs, ys, { epochs: 10 });
  const prediction = model.predict(tf.tensor2d([[occupancy, seasonality]], [1, 2]));
  const suggestedRate = (await prediction.data())[0] * req.body.baseRate;
  res.json({ suggestedRate });
});

// Auto-Comms
router.post('/auto-comm', async (req, res) => {
  const { guestEmail, type } = req.body;
  let message = '';
  if (type === 'welcome') message = `Welcome ${req.body.guestName}! Check-in at 3 PM.`;
  // NLP-like randomization
  const phrases = ['Enjoy your stay!', 'Let us know if you need anything.'];
  message += ' ' + phrases[Math.floor(Math.random() * phrases.length)];
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: guestEmail,
    subject: 'VoyAI Update',
    text: message,
  });
  res.json({ sent: true });
});

// Housekeeping (called from reservations)
router.post('/housekeeping', async (req, res) => {
  // Generate task
  const task = { roomId: req.body.roomId, type: 'cleaning', due: new Date() };
  // Save to DB or notify
  res.json(task);
});

module.exports = router;