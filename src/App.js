import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Snackbar, Alert } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { hideNotification } from './features/notifications/notificationsSlice';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import TaskList from './pages/TaskList';
import ApiStatus from './components/ApiStatus';

const theme = createTheme({
  palette: {
    primary: {
      main: '#3f51b5',
    },
    secondary: {
      main: '#f50057',
    },
  },
  components: {
    MuiModal: {
      defaultProps: {
        disablePortal: true,
      },
    },
  },
});

function Notification() {
  const dispatch = useDispatch();
  const { message, type, open } = useSelector((state) => state.notifications);

  const handleClose = () => {
    dispatch(hideNotification());
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={3000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert onClose={handleClose} severity={type} sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  );
}

function App() {
  useEffect(() => {
    // Fix for aria-hidden warning
    const root = document.getElementById('root');
    if (root) {
      root.removeAttribute('aria-hidden');
    }
    
    // Log environment for debugging
    console.log('Environment:', process.env.NODE_ENV);
    console.log('API URL:', process.env.REACT_APP_API_URL);
    console.log('App Name:', process.env.REACT_APP_NAME);
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ApiStatus />
      <Router future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/list" element={<TaskList />} />
          </Routes>
        </Layout>
      </Router>
      <Notification />
    </ThemeProvider>
  );
}

export default App;