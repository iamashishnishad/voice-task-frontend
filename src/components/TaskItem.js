import React, { useState } from 'react';
import { useDrag } from 'react-dnd';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import FlagIcon from '@mui/icons-material/Flag';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { format } from 'date-fns';
import TaskForm from './TaskForm';

const TaskItem = ({ task, onDelete }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'task',
    item: { id: task._id, status: task.status },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    setEditOpen(true);
    handleMenuClose();
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      onDelete(task._id);
    }
    handleMenuClose();
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'error';
      case 'critical': return 'secondary';
      default: return 'default';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'critical': return <FlagIcon fontSize="small" />;
      case 'high': return <FlagIcon fontSize="small" />;
      default: return null;
    }
  };

  return (
    <>
      <Card
        ref={drag}
        sx={{
          mb: 2,
          opacity: isDragging ? 0.5 : 1,
          cursor: 'move',
          '&:hover': {
            boxShadow: 3,
            transform: 'translateY(-2px)'
          },
          transition: 'all 0.2s'
        }}
      >
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Typography variant="h6" sx={{ mb: 1, fontSize: '1rem' }}>
              {task.title}
            </Typography>
            <IconButton
              size="small"
              onClick={handleMenuOpen}
              aria-label="task menu"
            >
              <MoreVertIcon />
            </IconButton>
          </Box>
          
          {task.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {task.description}
            </Typography>
          )}
          
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <Chip
              size="small"
              icon={getPriorityIcon(task.priority)}
              label={task.priority}
              color={getPriorityColor(task.priority)}
              variant="outlined"
            />
            
            {task.dueDate && (
              <Chip
                size="small"
                icon={<ScheduleIcon fontSize="small" />}
                label={format(new Date(task.dueDate), 'MMM d, h:mm a')}
                variant="outlined"
                color={new Date(task.dueDate) < new Date() ? 'error' : 'default'}
              />
            )}
          </Box>
        </CardContent>
      </Card>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>Edit</MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          Delete
        </MenuItem>
      </Menu>

      <TaskForm
        open={editOpen}
        onClose={() => setEditOpen(false)}
        mode="edit"
        taskId={task._id}
        initialData={task}
      />
    </>
  );
};

export default TaskItem;