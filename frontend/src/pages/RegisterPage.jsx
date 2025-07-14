import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Button, TextField, Container, Typography, Box, Link } from '@mui/material';

function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', { email, password });
      alert('Registration successful! Please log in.');
      navigate('/login');
    } catch (error) {
      console.error('Registration failed:', error);
      alert('Registration failed. The email may already be in use.');
    }
  };

  return (
    <Container maxWidth="xs">
      <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5">
          Register for VoyAI
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            label="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />
          <TextField
            margin="normal"
            required
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
            Register
          </Button>
          <Link href="/login" variant="body2">
            {"Already have an account? Sign In"}
          </Link>
        </Box>
      </Box>
    </Container>
  );
}

export default RegisterPage;