import db from '../db.js';
// In a real app, you would use a library like 'axios' to make HTTP requests
// import axios from 'axios';

// --- SIMULATION MODE ---
const fetchSimulatedBookings = (channel) => {
  console.log(`[SIM] Fetching new bookings from ${channel}...`);
  const newBooking = {
    id: `sim-${Date.now()}`,
    guestName: `Simulated Guest (${channel})`,
    checkIn: '2024-10-01',
    checkOut: '2024-10-05',
    roomId: 1, // Assume room ID 1 exists for simulation
  };
  // Return one new booking randomly to simulate activity
  return Math.random() > 0.7 ? [newBooking] : [];
};

const pushSimulatedAvailability = (channel) => {
  console.log(`[SIM] Pushing availability updates to ${channel}...`);
  // In a real scenario, you'd send your calendar data. Here we just log.
  return { success: true, message: `Pushed availability to ${channel}` };
};

// --- REAL API MODE (STUBS) ---
const fetchBookingComBookings = async () => {
  const apiKey = process.env.BOOKING_COM_API_KEY;
  if (!apiKey) throw new Error("Booking.com API key is missing.");
  console.log("Fetching new bookings from Booking.com...");
  // const response = await axios.get('https://api.booking.com/v1/reservations', {
  //   headers: { 'Authorization': `Basic ${Buffer.from(apiKey + ':').toString('base64')}` }
  // });
  // return response.data; // Return and process real data
  throw new Error("Booking.com real API not implemented.");
};

const fetchAirbnbBookings = async () => {
  const token = process.env.AIRBNB_TOKEN;
  if (!token) throw new Error("Airbnb token is missing.");
  console.log("Fetching new bookings from Airbnb...");
  // const response = await axios.get('https://api.airbnb.com/v2/reservations', {
  //   headers: { 'X-Airbnb-OAuth-Token': token }
  // });
  // return response.data; // Return and process real data
  throw new Error("Airbnb real API not implemented.");
};

// --- MAIN SYNC LOGIC ---
export const runChannelSync = async () => {
  const isSimMode = process.env.SIM_MODE === 'true';
  console.log(`Starting channel sync in ${isSimMode ? 'Simulation' : 'Real'} mode.`);

  const channels = ['booking.com', 'airbnb'];

  for (const channel of channels) {
    try {
      let newBookings = [];
      if (isSimMode) {
        newBookings = fetchSimulatedBookings(channel);
        pushSimulatedAvailability(channel);
      } else {
        // Real mode logic
        if (channel === 'booking.com') newBookings = await fetchBookingComBookings();
        if (channel === 'airbnb') newBookings = await fetchAirbnbBookings();
        // Add push availability logic here too
      }

      // Process new bookings and add them to the database
      for (const booking of newBookings) {
        await db.query(
          'INSERT INTO Reservations (room_id, guest_name, check_in_date, check_out_date, channel) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING',
          [booking.roomId, booking.guestName, booking.checkIn, booking.checkOut, channel]
        );
        console.log(`Synced new booking for ${booking.guestName} from ${channel}.`);
      }

      await db.query(
        'INSERT INTO ChannelSyncs (channel_name, status, details) VALUES ($1, $2, $3)',
        [channel, 'success', `Synced ${newBookings.length} new bookings.`]
      );
    } catch (error) {
      console.error(`Error syncing with ${channel}:`, error.message);
      await db.query(
        'INSERT INTO ChannelSyncs (channel_name, status, details) VALUES ($1, $2, $3)',
        [channel, 'failed', error.message]
      );
    }
  }
};