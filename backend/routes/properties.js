import express from 'express';
import db from '../db.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// All property routes are protected
router.use(authMiddleware);

// Get all properties for the logged-in user
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM Properties WHERE owner_id = $1', [req.user.id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching properties' });
  }
});

// Create a new property
router.post('/', async (req, res) => {
  const { name, address } = req.body;
  try {
    const newProperty = await db.query(
      'INSERT INTO Properties (name, address, owner_id) VALUES ($1, $2, $3) RETURNING *',
      [name, address, req.user.id]
    );
    res.status(201).json(newProperty.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error creating property' });
  }
});

// Get rooms for a specific property
router.get('/:propertyId/rooms', async (req, res) => {
    const { propertyId } = req.params;
    try {
        const result = await db.query('SELECT * FROM Rooms WHERE property_id = $1', [propertyId]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching rooms' });
    }
});

// Add a room to a property
router.post('/:propertyId/rooms', async (req, res) => {
    const { propertyId } = req.params;
    const { name, type, capacity, base_rate, amenities } = req.body;
    try {
        const newRoom = await db.query(
            'INSERT INTO Rooms (property_id, name, type, capacity, base_rate, amenities) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [propertyId, name, type, capacity, base_rate, amenities]
        );
        res.status(201).json(newRoom.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error adding room' });
    }
});

export default router;