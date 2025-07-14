import express from 'express';
import { PrismaClient } from '@prisma/client';
import authMiddleware from '../middleware/authMiddleware.js';

const prisma = new PrismaClient();
const router = express.Router();

router.use(authMiddleware);

// Get properties
router.get('/', async (req, res) => {
  try {
    const properties = await prisma.property.findMany({ where: { ownerId: req.user.id } });
    res.json(properties);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching properties' });
  }
});

// Create property
router.post('/', async (req, res) => {
  const { name, address } = req.body;
  try {
    const newProperty = await prisma.property.create({ data: { name, address, ownerId: req.user.id } });
    res.status(201).json(newProperty);
  } catch (error) {
    res.status(500).json({ message: 'Error creating property' });
  }
});

// Update property
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, address } = req.body;
  try {
    const updated = await prisma.property.update({
      where: { id: parseInt(id), ownerId: req.user.id },
      data: { name, address },
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Error updating' });
  }
});

// Delete property
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.property.delete({ where: { id: parseInt(id), ownerId: req.user.id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error deleting' });
  }
});

// Rooms CRUD similar, updated to Prisma...

export default router;