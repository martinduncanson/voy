import React, { useState, useEffect } from 'react';
import api from '../api';
import { AppBar, Toolbar, Typography, Container, Grid, Paper, Box, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

function DashboardPage() {
  const [properties, setProperties] = useState([]);
  const [reservations, setReservations] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const propRes = await api.get('/properties');
        setProperties(propRes.data);
        const resRes = await api.get('/reservations');
        setReservations(resRes.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      }
    };
    fetchData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const totalRevenue = reservations.reduce((acc, res) => acc + parseFloat(res.total_price || 0), 0);
  const occupancy = reservations.length > 0 ? (reservations.length / (properties.length * 30)) * 100 : 0; // Simplified occupancy

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            VoyAI Dashboard
          </Typography>
          <Button color="inherit" onClick={handleLogout}>Logout</Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          {/* Summary Cards */}
          <Grid item xs={12} md={4} lg={3}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
              <Typography component="h2" variant="h6" color="primary" gutterBottom>Total Properties</Typography>
              <Typography component="p" variant="h4">{properties.length}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4} lg={3}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
              <Typography component="h2" variant="h6" color="primary" gutterBottom>Total Reservations</Typography>
              <Typography component="p" variant="h4">{reservations.length}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4} lg={3}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
              <Typography component="h2" variant="h6" color="primary" gutterBottom>Total Revenue</Typography>
              <Typography component="p" variant="h4">${totalRevenue.toFixed(2)}</Typography>
            </Paper>
          </Grid>
          
          {/* Reservation List */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Recent Reservations</Typography>
              {reservations.slice(0, 5).map(res => (
                <Box key={res.id} sx={{ mb: 1, p: 1, border: '1px solid #ddd', borderRadius: 1 }}>
                  <Typography variant="body1">
                    <strong>{res.guest_name}</strong> @ {res.property_name} ({res.room_name})
                  </Typography>
                  <Typography variant="body2">
                    {res.check_in_date} to {res.check_out_date} - Status: {res.status} - Channel: {res.channel}
                  </Typography>
                </Box>
              ))}
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </>
  );
}

export default DashboardPage;