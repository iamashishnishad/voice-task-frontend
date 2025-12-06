import React from 'react';
import { useDrop } from 'react-dnd';
import { Box, Typography } from '@mui/material';
import TaskItem from './TaskItem';
import { useDispatch } from 'react-redux';
import { updateTask } from '../features/tasks/tasksSlice';

const Column = ({ status, tasks, title, color }) => {
  const dispatch = useDispatch();

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'task',
    drop: (item) => handleDrop(item),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  const handleDrop = (item) => {
    if (item.status !== status) {
      dispatch(updateTask({ id: item.id, status }));
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'todo': return 'To Do';
      case 'inprogress': return 'In Progress';
      case 'done': return 'Done';
      default: return status;
    }
  };

  return (
    <Box
      ref={drop}
      sx={{
        bgcolor: 'grey.50',
        borderRadius: 2,
        p: 2,
        minHeight: 500,
        border: isOver ? '2px dashed' : '2px solid transparent',
        borderColor: isOver ? 'primary.main' : 'transparent'
      }}
    >
      <Typography
        variant="h6"
        sx={{
          mb: 2,
          pb: 1,
          borderBottom: 2,
          borderColor: `${color}.main`,
          color: `${color}.main`,
          fontWeight: 600
        }}
      >
        {getStatusLabel(status)} ({tasks.length})
      </Typography>
      
      <Box>
        {tasks.map(task => (
          <TaskItem
            key={task._id}
            task={task}
            onDelete={(id) => {
              // Delete logic will be handled in parent
              console.log('Delete task:', id);
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

export default Column;