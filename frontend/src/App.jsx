import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from 'react-query';
import { I18nextProvider } from 'react-i18next';
import io from 'socket.io-client';
import store from './store';
import i18n from './i18n';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import GuestBooking from './pages/GuestBooking';

const socket = io('http://localhost:5000');

const queryClient = new QueryClient();

function App() {
  React.useEffect(() => {
    socket.on('syncUpdate', (data) => console.log('Sync:', data));
    return () => socket.off('syncUpdate');
  }, []);

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/booking" element={<GuestBooking />} /> {/* Public */}
            </Routes>
          </Router>
        </I18nextProvider>
      </QueryClientProvider>
    </Provider>
  );
}

export default App;