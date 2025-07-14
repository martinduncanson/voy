const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { Parser } = require('json2csv');
const jsPDF = require('jspdf');

const prisma = new PrismaClient();
const router = express.Router();

router.get('/occupancy', async (req, res) => {
  const reservations = await prisma.reservation.findMany();
  // Calculate occupancy
  const occupancy = reservations.length / 100; // Dummy
  res.json({ occupancy });
});

router.get('/export/csv', async (req, res) => {
  const reservations = await prisma.reservation.findMany();
  const parser = new Parser();
  const csv = parser.parse(reservations);
  res.header('Content-Type', 'text/csv');
  res.attachment('reservations.csv');
  res.send(csv);
});

router.get('/export/pdf', async (req, res) => {
  const doc = new jsPDF();
  doc.text('Reservations Report', 10, 10);
  // Add data...
  res.header('Content-Type', 'application/pdf');
  res.attachment('report.pdf');
  res.send(doc.output());
});

module.exports = router;