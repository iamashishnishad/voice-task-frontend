import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  IconButton,
  Alert
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DatePicker from '@mui/lab/DatePicker';
import TimePicker from '@mui/lab/TimePicker';
import LocalizationProvider from '@mui/lab/LocalizationProvider';
import AdapterDateFns from '@mui/lab/AdapterDateFns';
import { useDispatch } from 'react-redux';
import { createTask, updateTask } from '../features/tasks/tasksSlice';
import axios from 'axios';

const TaskForm = ({ open, onClose, mode = 'create', taskId, initialData }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
const [formData, setFormData] = useState({
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  dueDate: null,
  dueTime: null
});

useEffect(() => {
  if (initialData) {
    let dueDate = null;
    let dueTime = null;
    
    if (initialData.dueDate) {
      const date = new Date(initialData.dueDate);
      dueDate = date;
      dueTime = date;
    }
    
    setFormData({
      title: initialData.title || '',
      description: initialData.description || '',
      status: initialData.status || 'todo',
      priority: initialData.priority || 'medium',
      dueDate: dueDate,
      dueTime: dueTime
    });
  } else if (mode === 'create') {
    setFormData({
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      dueDate: null,
      dueTime: null
    });
  }
}, [initialData, mode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({
      ...prev,
      dueDate: date
    }));
  };

  const handleTimeChange = (time) => {
    setFormData(prev => ({
      ...prev,
      dueTime: time
    }));
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
    // Combine date and time
    let finalDueDate = null;
    if (formData.dueDate) {
      const date = new Date(formData.dueDate);
      
      // If time is provided, set hours/minutes
      if (formData.dueTime) {
        const time = new Date(formData.dueTime);
        date.setHours(time.getHours(), time.getMinutes(), 0, 0);
      } else {
        // Default to end of day if only date is provided
        date.setHours(23, 59, 0, 0);
      }
      
      finalDueDate = date.toISOString();
    }

    const taskData = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      status: formData.status,
      priority: formData.priority
    };

    // Only add dueDate if it exists
    if (finalDueDate) {
      taskData.dueDate = finalDueDate;
    }

    console.log('Submitting task data:', taskData);

    if (mode === 'create') {
      await dispatch(createTask(taskData));
    } else {
      await dispatch(updateTask({ id: taskId, ...taskData }));
    }

    onClose();
  } catch (err) {
    console.error('Task save error:', err);
    const errorMessage = err.response?.data?.errors?.[0]?.msg || 
                        err.response?.data?.error || 
                        'Failed to save task. Please check the data and try again.';
    setError(errorMessage);
  } finally {
    setLoading(false);
  }
};

  const statusOptions = [
    { value: 'todo', label: 'To Do' },
    { value: 'inprogress', label: 'In Progress' },
    { value: 'done', label: 'Done' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' }
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ m: 0, p: 2 }}>
        {mode === 'create' ? 'Create New Task' : 'Edit Task'}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <TextField
            autoFocus
            margin="dense"
            name="title"
            label="Title"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.title}
            onChange={handleChange}
            required
            disabled={loading}
          />
          
          <TextField
            margin="dense"
            name="description"
            label="Description"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={formData.description}
            onChange={handleChange}
            disabled={loading}
          />
          
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <TextField
              select
              name="status"
              label="Status"
              value={formData.status}
              onChange={handleChange}
              fullWidth
              disabled={loading}
            >
              {statusOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            
            <TextField
              select
              name="priority"
              label="Priority"
              value={formData.priority}
              onChange={handleChange}
              fullWidth
              disabled={loading}
            >
              {priorityOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Box>
          
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <DatePicker
                label="Due Date"
                value={formData.dueDate}
                onChange={handleDateChange}
                renderInput={(params) => <TextField {...params} fullWidth />}
                disabled={loading}
              />
              
              <TimePicker
                label="Due Time"
                value={formData.dueTime}
                onChange={handleTimeChange}
                renderInput={(params) => <TextField {...params} fullWidth />}
                disabled={loading}
              />
            </Box>
          </LocalizationProvider>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !formData.title.trim()}
          >
            {loading ? 'Saving...' : mode === 'create' ? 'Create Task' : 'Update Task'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default TaskForm;