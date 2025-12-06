import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Grid, Box, Typography, TextField, MenuItem, CircularProgress } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import Column from '../components/Column';
import { fetchTasks } from '../features/tasks/tasksSlice';

const Dashboard = () => {
  const dispatch = useDispatch();
  const { tasks, loading, error } = useSelector((state) => state.tasks);
  const [filters, setFilters] = useState({
    search: '',
    priority: '',
    status: ''
  });

  useEffect(() => {
    dispatch(fetchTasks());
  }, [dispatch]);

  const filteredTasks = tasks.filter(task => {
    if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.priority && task.priority !== filters.priority) {
      return false;
    }
    if (filters.status && task.status !== filters.status) {
      return false;
    }
    return true;
  });

  const columns = [
    { status: 'todo', title: 'To Do', color: 'warning', tasks: filteredTasks.filter(t => t.status === 'todo') },
    { status: 'inprogress', title: 'In Progress', color: 'info', tasks: filteredTasks.filter(t => t.status === 'inprogress') },
    { status: 'done', title: 'Done', color: 'success', tasks: filteredTasks.filter(t => t.status === 'done') }
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">Error loading tasks: {error}</Typography>
      </Box>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Task Board
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search tasks..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            size="small"
            sx={{ minWidth: 200 }}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />
            }}
          />
          
          <TextField
            select
            label="Priority"
            value={filters.priority}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
            size="small"
            sx={{ minWidth: 120 }}
            InputProps={{
              startAdornment: <FilterListIcon sx={{ mr: 1, color: 'action.active' }} />
            }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="low">Low</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="high">High</MenuItem>
            <MenuItem value="critical">Critical</MenuItem>
          </TextField>
          
          <TextField
            select
            label="Status"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            size="small"
            sx={{ minWidth: 120 }}
            InputProps={{
              startAdornment: <FilterListIcon sx={{ mr: 1, color: 'action.active' }} />
            }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="todo">To Do</MenuItem>
            <MenuItem value="inprogress">In Progress</MenuItem>
            <MenuItem value="done">Done</MenuItem>
          </TextField>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {columns.map(column => (
          <Grid item xs={12} md={4} key={column.status}>
            <Column {...column} />
          </Grid>
        ))}
      </Grid>
    </DndProvider>
  );
};

export default Dashboard;