import express from 'express';
import db from '../db.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(authMiddleware);

// AI Feature: Smart Pricing Suggestion
router.get('/smart-pricing/:roomId', async (req, res) => {
    const { roomId } = req.params;
    try {
        const roomResult = await db.query('SELECT base_rate FROM Rooms WHERE id = $1', [roomId]);
        if (roomResult.rows.length === 0) {
            return res.status(404).json({ message: 'Room not found' });
        }
        const baseRate = parseFloat(roomResult.rows[0].base_rate);

        // Simple rule-based logic to simulate AI pricing
        // In a real app, this would use an ML model with market data, seasonality, etc.
        const occupancy = Math.random(); // Simulate occupancy check
        let suggestion = baseRate;
        let reason = "Standard rate.";

        if (occupancy < 0.3) {
            suggestion = baseRate * 0.85; // 15% discount for low occupancy
            reason = "Low occupancy detected. Suggesting a 15% discount to attract bookings.";
        } else if (occupancy > 0.8) {
            suggestion = baseRate * 1.20; // 20% increase for high demand
            reason = "High demand detected. Suggesting a 20% price increase to maximize revenue.";
        }

        res.json({
            baseRate: baseRate.toFixed(2),
            suggestedRate: suggestion.toFixed(2),
            reason: reason
        });

    } catch (error) {
        res.status(500).json({ message: 'Error generating price suggestion' });
    }
});

// AI Feature: Automated Guest Communication Generation
router.post('/generate-message', (req, res) => {
    const { template, guestName, checkIn, wifiCode = "VoyAI-Guest" } = req.body;

    let message = "";
    const greetings = ["Hi", "Hello", "Dear"];
    const closings = ["Best regards", "Sincerely", "Cheers"];
    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
    const randomClosing = closings[Math.floor(Math.random() * closings.length)];

    switch (template) {
        case 'welcome':
            message = `${randomGreeting} ${guestName},\n\nWelcome to our property! Your check-in is scheduled for ${checkIn}. The WiFi password is: ${wifiCode}.\n\nLet us know if you need anything.\n\n${randomClosing},\nVoyAI Management`;
            break;
        case 'reminder':
            message = `${randomGreeting} ${guestName},\n\nThis is a friendly reminder about your upcoming stay. We look forward to welcoming you!\n\n${randomClosing},\nVoyAI Management`;
            break;
        default:
            return res.status(400).json({ message: 'Invalid template type' });
    }

    res.json({ message });
});

export default router;