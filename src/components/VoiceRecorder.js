import React, { useState, useEffect } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import {
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ScheduleIcon from '@mui/icons-material/Schedule';
import FlagIcon from '@mui/icons-material/Flag';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { createTask } from '../features/tasks/tasksSlice';

const VoiceRecorder = () => {
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [autoCreate, setAutoCreate] = useState(false);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  useEffect(() => {
    if (transcript && !listening) {
      handleParseTranscript(transcript);
    }
  }, [transcript, listening]);

  const handleStartRecording = () => {
    resetTranscript();
    setError('');
    setSuccess(false);
    setParsedData(null);
    setAutoCreate(false);
    
    // Show instructions first
    setInstructionsOpen(true);
  };

  const startActualRecording = () => {
    SpeechRecognition.startListening({ continuous: true });
    setInstructionsOpen(false);
    setOpen(true);
  };

  const handleStopRecording = () => {
    SpeechRecognition.stopListening();
  };

  const handleParseTranscript = async (text) => {
    if (!text.trim()) {
      setError('No speech detected. Please try again.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/voice/parse', { text });
      const parsedResult = {
        ...response.data,
        transcript: text
      };
      
      setParsedData(parsedResult);
      
      // Check if we should auto-create
      const lowerText = text.toLowerCase();
      if (lowerText.includes('create this') || 
          lowerText.includes('add this') || 
          lowerText.includes('save this') ||
          lowerText.endsWith('done') ||
          lowerText.includes('mark as done')) {
        
        // Auto-create the task
        await handleAutoCreateTask(parsedResult);
      }
      
    } catch (err) {
      setError('Failed to parse voice input. Please try again.');
      console.error('Parsing error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoCreateTask = async (parsedResult) => {
    try {
      setAutoCreate(true);
      
      // Prepare task data
      const taskData = {
        title: parsedResult.title,
        description: parsedResult.description,
        status: parsedResult.status,
        priority: parsedResult.priority,
        dueDate: parsedResult.dueDate
      };
      
      console.log('Auto-creating task:', taskData);
      
      // Dispatch the task creation
      await dispatch(createTask(taskData));
      
      setSuccess(true);
      
      // Close modal after 2 seconds
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
        setAutoCreate(false);
        setParsedData(null);
      }, 2000);
      
    } catch (err) {
      setError('Failed to create task automatically.');
      console.error('Auto-create error:', err);
    }
  };

  const handleManualCreate = async () => {
    if (!parsedData) return;
    
    await handleAutoCreateTask(parsedData);
  };

  const handleRetry = () => {
    resetTranscript();
    setParsedData(null);
    setError('');
    setSuccess(false);
    setAutoCreate(false);
    startActualRecording();
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'critical':
      case 'high':
        return <FlagIcon fontSize="small" />;
      default:
        return null;
    }
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'todo': return 'warning';
      case 'inprogress': return 'info';
      case 'done': return 'success';
      default: return 'default';
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

  if (!browserSupportsSpeechRecognition) {
    return (
      <Alert severity="warning" sx={{ position: 'fixed', bottom: 20, right: 20, maxWidth: 300 }}>
        Your browser doesn't support speech recognition.
      </Alert>
    );
  }

  return (
    <>
      {/* Microphone Button */}
      <Box sx={{ position: 'fixed', bottom: 30, right: 30, zIndex: 100 }}>
        <IconButton
          onClick={handleStartRecording}
          sx={{
            width: 60,
            height: 60,
            bgcolor: listening ? 'error.main' : 'primary.main',
            color: 'white',
            '&:hover': {
              bgcolor: listening ? 'error.dark' : 'primary.dark',
              transform: 'scale(1.1)'
            },
            transition: 'all 0.3s',
            boxShadow: 3
          }}
          aria-label="Start voice recording"
        >
          <MicIcon />
        </IconButton>
      </Box>

      {/* Instructions Modal */}
      <Dialog open={instructionsOpen} onClose={() => setInstructionsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>How to Use Voice Input</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Speak naturally to create tasks. Examples:
          </Typography>
          
          <List dense>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Create a high priority task to review PR by tomorrow"
                secondary="Title: Review PR, Priority: High, Due: Tomorrow"
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Remind me to send project proposal next Monday"
                secondary="Title: Send project proposal, Due: Next Monday"
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Critical bug fix needed today"
                secondary="Title: Bug fix, Priority: Critical, Due: Today"
              />
            </ListItem>
          </List>
          
          <Card variant="outlined" sx={{ mt: 2, bgcolor: 'primary.light' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Commands
              </Typography>
              <Typography variant="body2">
                Add "create this" or "add this" at the end to auto-create
              </Typography>
              <Typography variant="body2">
                Say "done" to mark as completed
              </Typography>
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Example: "Fix login page bug high priority create this"
              </Typography>
            </CardContent>
          </Card>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInstructionsOpen(false)}>Cancel</Button>
          <Button onClick={startActualRecording} variant="contained" startIcon={<MicIcon />}>
            Start Speaking
          </Button>
        </DialogActions>
      </Dialog>

      {/* Voice Recording Modal */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Voice Input
          {listening && (
            <CircularProgress size={20} sx={{ ml: 2 }} />
          )}
        </DialogTitle>
        <DialogContent>
          {success ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CheckCircleIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
              <Typography variant="h6" color="success.main" gutterBottom>
                Task Created Successfully!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Closing in 2 seconds...
              </Typography>
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          ) : listening ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress />
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Listening...
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Speak your task clearly
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
                Example: "Create high priority task to fix login page by tomorrow"
              </Typography>
              <Button 
                variant="outlined" 
                onClick={handleStopRecording}
                startIcon={<MicOffIcon />}
                sx={{ mt: 3 }}
              >
                Stop Recording
              </Button>
            </Box>
          ) : loading ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Processing your speech...
              </Typography>
            </Box>
          ) : parsedData ? (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                Task Preview
              </Typography>
              
              <Typography variant="caption" color="text.secondary">
                You said:
              </Typography>
              <Typography variant="body2" sx={{ mb: 3, p: 1.5, bgcolor: 'grey.50', borderRadius: 1, fontStyle: 'italic' }}>
                "{parsedData.transcript}"
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Title
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {parsedData.title}
                  </Typography>
                </Box>
                
                {parsedData.description && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Description
                    </Typography>
                    <Typography variant="body2">
                      {parsedData.description}
                    </Typography>
                  </Box>
                )}
                
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Priority
                    </Typography>
                    <Chip
                      size="small"
                      icon={getPriorityIcon(parsedData.priority)}
                      label={parsedData.priority}
                      color={getPriorityColor(parsedData.priority)}
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                  
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Status
                    </Typography>
                    <Chip
                      size="small"
                      label={getStatusLabel(parsedData.status)}
                      color={getStatusColor(parsedData.status)}
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                </Box>
                
                {parsedData.dueDate && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Due Date
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <ScheduleIcon fontSize="small" color="action" />
                      <Typography variant="body2">
                        {new Date(parsedData.dueDate).toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>
              
              {autoCreate && (
                <Box sx={{ textAlign: 'center', mt: 3 }}>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Creating task automatically...
                  </Typography>
                </Box>
              )}
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <MicIcon sx={{ fontSize: 60, color: 'action.disabled', mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Ready to record. Speak your task when ready.
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                The recording will stop automatically after a few seconds of silence
              </Typography>
            </Box>
          )}
        </DialogContent>
        
        {parsedData && !success && !autoCreate && (
          <DialogActions>
            <Button onClick={handleRetry}>Try Again</Button>
            <Button onClick={handleManualCreate} variant="contained">
              Create Task
            </Button>
          </DialogActions>
        )}
      </Dialog>
    </>
  );
};

export default VoiceRecorder;