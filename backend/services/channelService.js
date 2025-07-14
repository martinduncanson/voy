const axios = require('axios');
const cron = require('node-cron');

const simMode = process.env.SIM_MODE === 'true';

const bookingApi = axios.create({
  baseURL: 'https://api.booking.com/v1',
  headers: { Authorization: `Bearer ${process.env.BOOKING_API_KEY}` },
});

const airbnbApi = axios.create({
  baseURL: 'https://api.airbnb.com/v2',
  headers: { Authorization: `Bearer ${process.env.AIRBNB_TOKEN}` },
});

async function syncChannels() {
  if (simMode) {
    // Mock data
    return { bookings: [{ id: 'mock1', date: new Date() }] };
  } else {
    try {
      const bookingRes = await bookingApi.get('/reservations'); // See docs: https://developers.booking.com/connectivity/docs
      const airbnbRes = await airbnbApi.get('/reservations'); // See docs: https://wpsocialninja.com/airbnb-api/
      // Process and save to DB via Prisma
      return { success: true, data: [...bookingRes.data, ...airbnbRes.data] };
    } catch (error) {
      console.error('Sync error:', error);
      throw error;
    }
  }
}

// Cron setup in index.js calls this

module.exports = { syncChannels };