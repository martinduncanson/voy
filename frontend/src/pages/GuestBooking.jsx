import React, { useState } from 'react';
import { useQuery, useMutation } from 'react-query';
import { useTranslation } from 'react-i18next';
import api from '../api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Button, TextField, List, ListItem } from '@mui/material';

function GuestBooking() {
  const { t } = useTranslation();
  const [checkIn, setCheckIn] = useState(new Date());
  const [checkOut, setCheckOut] = useState(new Date());
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(null);

  const { data: availability } = useQuery(['availability', checkIn.toISOString(), checkOut.toISOString()], () =>
    api.get('/api/reservations/availability', { params: { checkIn: checkIn.toISOString(), checkOut: checkOut.toISOString() } })
  );

  const mutation = useMutation((data) => api.post('/api/reservations', data));

  const handleBook = () => {
    if (!selectedRoom) return alert(t('selectRoom'));
    mutation.mutate({ roomId: selectedRoom, guestName, guestEmail, checkIn: checkIn.toISOString(), checkOut: checkOut.toISOString(), channel: 'direct' });
  };

  return (
    <div>
      <h1>{t('bookingTitle')}</h1>
      <DatePicker selected={checkIn} onChange={setCheckIn} placeholderText={t('checkIn')} />
      <DatePicker selected={checkOut} onChange={setCheckOut} placeholderText={t('checkOut')} />
      <TextField label={t('guestName')} value={guestName} onChange={(e) => setGuestName(e.target.value)} />
      <TextField label={t('guestEmail')} value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} />
      <List>
        {availability?.map(room => (
          <ListItem key={room.id} onClick={() => setSelectedRoom(room.id)} button>
            {room.name} - {room.baseRate}
          </ListItem>
        ))}
      </List>
      <Button onClick={handleBook}>{t('book')}</Button>
    </div>
  );
}

export default GuestBooking;