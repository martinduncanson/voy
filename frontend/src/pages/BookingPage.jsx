import React, { useState, useEffect } from 'react';
import api from '../api';
import { Button, TextField, Container, Typography, Box, Select, MenuItem, FormControl, InputLabel } from '@mui/material';

function BookingPage() {
  const [properties, setProperties] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [formData, setFormData] = useState({
    guest_name: '',
    guest_email: '',
    check_in_date: '',
    check_out_date: '',
  });

  useEffect(() => {
    // This is a simplified version. A real booking engine would fetch all properties/rooms
    // without authentication. For this MVP, we'll assume a simplified flow.
    const fetchProperties = async () => {
      try {
        // This endpoint is protected, so this will only work if an admin is logged in.
        // A real public booking page would need a public endpoint to list properties/rooms.
        const res = await api.get('/properties');
        setProperties(res.data);
      } catch (error) {
        console.error("Could not fetch properties. This page requires a public endpoint in a real app.", error);
      }
    };
    fetchProperties();
  }, []);

  const handlePropertyChange = async (propertyId) => {
    setSelectedProperty(propertyId);
    setSelectedRoom('');
    if (propertyId) {
      const res = await api.get(`/properties/${propertyId}/rooms`);
      setRooms(res.data);
    } else {
      setRooms([]);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRoom) {
      alert('Please select a room.');
      return;
    }
    try {
      const payload = { ...formData, room_id: selectedRoom };
      await api.post('/reservations', payload);
      alert('Booking successful!');
      // Reset form
      setFormData({ guest_name: '', guest_email: '', check_in_date: '', check_out_date: '' });
      setSelectedRoom('');
    } catch (error) {
      console.error('Booking failed:', error);
      alert('Booking failed. Please try again.');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h4">
          Book a Room
        </Typography>
        <Typography variant="caption">
          (Note: This MVP requires an admin to be logged in to fetch properties)
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Property</InputLabel>
            <Select value={selectedProperty} onChange={(e) => handlePropertyChange(e.target.value)}>
              <MenuItem value=""><em>Select a Property</em></MenuItem>
              {properties.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal" disabled={!selectedProperty}>
            <InputLabel>Room</InputLabel>
            <Select value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)}>
              <MenuItem value=""><em>Select a Room</em></MenuItem>
              {rooms.map(r => <MenuItem key={r.id} value={r.id}>{r.name} - ${r.base_rate}/night</MenuItem>)}
            </Select>
          </FormControl>

          <TextField margin="normal" required fullWidth label="Full Name" name="guest_name" value={formData.guest_name} onChange={handleChange} />
          <TextField margin="normal" required fullWidth label="Email" name="guest_email" type="email" value={formData.guest_email} onChange={handleChange} />
          <TextField margin="normal" required fullWidth label="Check-in Date" name="check_in_date" type="date" InputLabelProps={{ shrink: true }} value={formData.check_in_date} onChange={handleChange} />
          <TextField margin="normal" required fullWidth label="Check-out Date" name="check_out_date" type="date" InputLabelProps={{ shrink: true }} value={formData.check_out_date} onChange={handleChange} />

          <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
            Book Now
          </Button>
        </Box>
      </Box>
    </Container>
  );
}

export default BookingPage;