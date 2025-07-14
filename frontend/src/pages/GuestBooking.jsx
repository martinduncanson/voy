import React, { useState } from 'react';
import { useQuery } from 'react-query';
import api from '../api';
import { useTranslation } from 'react-i18next';
import DatePicker from 'react-datepicker'; // Add dep
import 'react-datepicker/dist/react-datepicker.css';

function GuestBooking() {
  const { t } = useTranslation();
  const [checkIn, setCheckIn] = useState(new Date());
  const [checkOut, setCheckOut] = useState(new Date());

  const { data: availability } = useQuery(['availability', checkIn, checkOut], () =>
    api.get('/api/reservations/availability', { params: { checkIn, checkOut } })
  );

  const handleBook = async () => {
    // POST to reservations
    await api.post('/api/reservations', { checkIn, checkOut });
  };

  return (
    <div>
      <h1>{t('welcome')} to Booking</h1>
      <DatePicker selected={checkIn} onChange={setCheckIn} />
      <DatePicker selected={checkOut} onChange={setCheckOut} />
      <button onClick={handleBook}>Book</button>
      {availability && <ul>{availability.map(room => <li key={room.id}>{room.name}</li>)}</ul>}
    </div>
  );
}

export default GuestBooking;