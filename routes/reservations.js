import express from 'express';
import db from '../db.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Get all reservations (protected)
router.get('/', authMiddleware, async (req, res) => {
  try {
    // Fetches reservations for all properties owned by the user
    const result = await db.query(`
      SELECT r.*, rm.name as room_name, p.name as property_name
      FROM Reservations r
      JOIN Rooms rm ON r.room_id = rm.id
      JOIN Properties p ON rm.property_id = p.id
      WHERE p.owner_id = $1
      ORDER BY r.check_in_date DESC
    `, [req.user.id]);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching reservations' });
  }
});

// Create a new reservation (publicly accessible for booking engine)
router.post('/', async (req, res) => {
  const { room_id, guest_name, guest_email, check_in_date, check_out_date, channel = 'direct' } = req.body;

  try {
    // In a real app, you'd check for availability and calculate total_price here
    const roomResult = await db.query('SELECT base_rate FROM Rooms WHERE id = $1', [room_id]);
    if (roomResult.rows.length === 0) {
        return res.status(404).json({ message: 'Room not found' });
    }
    const baseRate = parseFloat(roomResult.rows[0].base_rate);
    const nights = (new Date(check_out_date) - new Date(check_in_date)) / (1000 * 60 * 60 * 24);
    const totalPrice = baseRate * nights;

    const newReservation = await db.query(
      'INSERT INTO Reservations (room_id, guest_name, guest_email, check_in_date, check_out_date, channel, total_price) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [room_id, guest_name, guest_email, check_in_date, check_out_date, channel, totalPrice]
    );

    // AI Enhancement: Auto-generate a housekeeping task post-checkout
    await db.query(
        'INSERT INTO HousekeepingTasks (room_id, task_description, due_date) VALUES ($1, $2, $3)',
        [room_id, `Clean room for guest ${guest_name}`, check_out_date]
    );

    res.status(201).json(newReservation.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating reservation' });
  }
});

export default router;