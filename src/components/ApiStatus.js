import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { checkApiHealth } from '../features/tasks/tasksSlice';
import { Alert, Box, CircularProgress } from '@mui/material';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';

const ApiStatus = () => {
  const dispatch = useDispatch();
  const { apiStatus } = useSelector((state) => state.tasks);

  useEffect(() => {
    // Check API health on mount
    dispatch(checkApiHealth());
    
    // Check every 30 seconds
    const interval = setInterval(() => {
      dispatch(checkApiHealth());
    }, 30000);
    
    return () => clearInterval(interval);
  }, [dispatch]);

  if (apiStatus === 'unhealthy') {
    return (
      <Alert 
        severity="warning" 
        icon={<WifiOffIcon />}
        sx={{ 
          position: 'fixed', 
          top: 70, 
          right: 20, 
          zIndex: 9999,
          maxWidth: 300 
        }}
      >
        Cannot connect to server. Please check your connection.
      </Alert>
    );
  }

  if (apiStatus === 'unknown') {
    return (
      <Box sx={{ 
        position: 'fixed', 
        top: 70, 
        right: 20, 
        zIndex: 9999 
      }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return null;
};

export default ApiStatus;