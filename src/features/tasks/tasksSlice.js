import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

/**
 * Determine API URL based on environment
 * - In development: Uses proxy from package.json (localhost:5001)
 * - In production: Uses deployed backend URL
 */
const getApiBaseUrl = () => {
  // Check if we're in development mode
  if (process.env.NODE_ENV === 'development') {
    // Development: Use proxy from package.json (localhost:5001)
    return '/api'; // This will be proxied to http://localhost:5001
  }
  
  // Production: Use environment variable or hardcoded URL
  return process.env.REACT_APP_API_URL || 'https://voice-task-backend-xd9b.onrender.com/api';
};

const API_BASE_URL = getApiBaseUrl();

console.log('🔧 Environment:', process.env.NODE_ENV);
console.log('🔗 API Base URL:', API_BASE_URL);
console.log('📱 Frontend URL:', window.location.origin);

// Create axios instance with proper configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Increased timeout for production
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // Set to true if using cookies/auth
});

// Request interceptor for debugging and error handling
api.interceptors.request.use(
  (config) => {
    console.log(`📤 ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, config.data ? 'with data' : '');
    return config;
  },
  (error) => {
    console.error('📤 Request Error:', error);
    return Promise.reject({
      type: 'REQUEST_ERROR',
      message: 'Failed to send request',
      originalError: error.message
    });
  }
);

// Response interceptor for debugging and error handling
api.interceptors.response.use(
  (response) => {
    console.log(`📥 Response ${response.status}: ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('📥 Response Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      data: error.response?.data
    });
    
    // Enhanced error handling
    let errorMessage = 'An error occurred';
    let errorType = 'API_ERROR';
    
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          errorMessage = data.error || 'Bad request. Please check your input.';
          errorType = 'VALIDATION_ERROR';
          break;
        case 401:
          errorMessage = 'Authentication required';
          errorType = 'AUTH_ERROR';
          break;
        case 403:
          errorMessage = 'Access forbidden. Check CORS configuration.';
          errorType = 'CORS_ERROR';
          break;
        case 404:
          errorMessage = 'Resource not found';
          errorType = 'NOT_FOUND_ERROR';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          errorType = 'SERVER_ERROR';
          break;
        default:
          errorMessage = data.error || `Server error: ${status}`;
      }
    } else if (error.request) {
      // Request made but no response
      if (error.message.includes('Network Error')) {
        errorMessage = 'Network error. Check your connection or CORS settings.';
        errorType = 'NETWORK_ERROR';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout. The server is taking too long to respond.';
        errorType = 'TIMEOUT_ERROR';
      } else {
        errorMessage = 'No response from server. The backend might be down.';
        errorType = 'CONNECTION_ERROR';
      }
    }
    
    return Promise.reject({
      type: errorType,
      message: errorMessage,
      originalError: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
);

// Async thunks with improved error handling
export const fetchTasks = createAsyncThunk('tasks/fetchTasks', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/tasks');
    return response.data;
  } catch (error) {
    return rejectWithValue({
      message: error.message || 'Failed to fetch tasks',
      type: error.type || 'FETCH_ERROR'
    });
  }
});

export const createTask = createAsyncThunk('tasks/createTask', async (taskData, { rejectWithValue }) => {
  try {
    // Clean task data - ensure we're not sending undefined fields
    const cleanTaskData = {
      title: taskData.title?.trim() || '',
      description: taskData.description?.trim() || '',
      status: taskData.status || 'todo',
      priority: taskData.priority || 'medium',
      dueDate: taskData.dueDate || null
    };
    
    console.log('Creating task with data:', cleanTaskData);
    
    const response = await api.post('/tasks', cleanTaskData);
    return response.data;
  } catch (error) {
    console.error('Create task error:', error);
    return rejectWithValue({
      message: error.message || 'Failed to create task',
      type: error.type || 'CREATE_ERROR',
      validationErrors: error.data?.errors
    });
  }
});

export const updateTask = createAsyncThunk('tasks/updateTask', async ({ id, ...taskData }, { rejectWithValue }) => {
  try {
    const response = await api.put(`/tasks/${id}`, taskData);
    return response.data;
  } catch (error) {
    return rejectWithValue({
      message: error.message || 'Failed to update task',
      type: error.type || 'UPDATE_ERROR'
    });
  }
});

export const deleteTask = createAsyncThunk('tasks/deleteTask', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/tasks/${id}`);
    return id;
  } catch (error) {
    return rejectWithValue({
      message: error.message || 'Failed to delete task',
      type: error.type || 'DELETE_ERROR'
    });
  }
});

export const checkApiHealth = createAsyncThunk('tasks/healthCheck', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    return rejectWithValue({
      message: 'API is unreachable',
      type: 'HEALTH_CHECK_ERROR',
      originalError: error.message
    });
  }
});

const tasksSlice = createSlice({
  name: 'tasks',
  initialState: {
    tasks: [],
    loading: false,
    error: null,
    apiStatus: 'unknown', // 'unknown', 'healthy', 'unhealthy'
    lastUpdated: null
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setTasks: (state, action) => {
      state.tasks = action.payload;
      state.lastUpdated = new Date().toISOString();
    },
    resetApiStatus: (state) => {
      state.apiStatus = 'unknown';
    }
  },
  extraReducers: (builder) => {
    builder
      // Health check
      .addCase(checkApiHealth.pending, (state) => {
        state.apiStatus = 'checking';
      })
      .addCase(checkApiHealth.fulfilled, (state) => {
        state.apiStatus = 'healthy';
      })
      .addCase(checkApiHealth.rejected, (state, action) => {
        state.apiStatus = 'unhealthy';
        state.error = {
          message: action.payload?.message || 'API health check failed',
          type: action.payload?.type || 'HEALTH_ERROR'
        };
      })
      
      // Fetch tasks
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = Array.isArray(action.payload) ? action.payload : action.payload?.data || [];
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = {
          message: action.payload?.message || 'Failed to load tasks',
          type: action.payload?.type || 'FETCH_ERROR'
        };
      })
      
      // Create task
      .addCase(createTask.pending, (state) => {
        state.loading = true;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.loading = false;
        // Handle different response formats
        const newTask = action.payload?.data || action.payload;
        if (newTask) {
          state.tasks.unshift(newTask);
          state.lastUpdated = new Date().toISOString();
        }
      })
      .addCase(createTask.rejected, (state, action) => {
        state.loading = false;
        state.error = {
          message: action.payload?.message || 'Failed to create task',
          type: action.payload?.type || 'CREATE_ERROR',
          validationErrors: action.payload?.validationErrors
        };
      })
      
      // Update task
      .addCase(updateTask.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        state.loading = false;
        const updatedTask = action.payload?.data || action.payload;
        if (updatedTask) {
          const index = state.tasks.findIndex(task => task._id === updatedTask._id);
          if (index !== -1) {
            state.tasks[index] = updatedTask;
            state.lastUpdated = new Date().toISOString();
          }
        }
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.loading = false;
        state.error = {
          message: action.payload?.message || 'Failed to update task',
          type: action.payload?.type || 'UPDATE_ERROR'
        };
      })
      
      // Delete task
      .addCase(deleteTask.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = state.tasks.filter(task => task._id !== action.payload);
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.loading = false;
        state.error = {
          message: action.payload?.message || 'Failed to delete task',
          type: action.payload?.type || 'DELETE_ERROR'
        };
      });
  }
});

export const { clearError, setTasks, resetApiStatus } = tasksSlice.actions;
export default tasksSlice.reducer;

// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// import axios from 'axios';

// const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// // Async thunks
// export const fetchTasks = createAsyncThunk('tasks/fetchTasks', async () => {
//   const response = await axios.get(`${API_URL}/tasks`);
//   return response.data;
// });

// export const createTask = createAsyncThunk('tasks/createTask', async (taskData) => {
//   const response = await axios.post(`${API_URL}/tasks`, taskData);
//   return response.data;
// });

// export const updateTask = createAsyncThunk('tasks/updateTask', async ({ id, ...taskData }) => {
//   const response = await axios.put(`${API_URL}/tasks/${id}`, taskData);
//   return response.data;
// });

// export const deleteTask = createAsyncThunk('tasks/deleteTask', async (id) => {
//   await axios.delete(`${API_URL}/tasks/${id}`);
//   return id;
// });

// const tasksSlice = createSlice({
//   name: 'tasks',
//   initialState: {
//     tasks: [],
//     loading: false,
//     error: null
//   },
//   reducers: {},
//   extraReducers: (builder) => {
//     builder
//       // Fetch tasks
//       .addCase(fetchTasks.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(fetchTasks.fulfilled, (state, action) => {
//         state.loading = false;
//         state.tasks = action.payload;
//       })
//       .addCase(fetchTasks.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.error.message;
//       })
      
//       // Create task
//       .addCase(createTask.pending, (state) => {
//         state.loading = true;
//       })
//       .addCase(createTask.fulfilled, (state, action) => {
//         state.loading = false;
//         state.tasks.unshift(action.payload);
//       })
//       .addCase(createTask.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.error.message;
//       })
      
//       // Update task
//       .addCase(updateTask.pending, (state) => {
//         state.loading = true;
//       })
//       .addCase(updateTask.fulfilled, (state, action) => {
//         state.loading = false;
//         const index = state.tasks.findIndex(task => task._id === action.payload._id);
//         if (index !== -1) {
//           state.tasks[index] = action.payload;
//         }
//       })
//       .addCase(updateTask.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.error.message;
//       })
      
//       // Delete task
//       .addCase(deleteTask.pending, (state) => {
//         state.loading = true;
//       })
//       .addCase(deleteTask.fulfilled, (state, action) => {
//         state.loading = false;
//         state.tasks = state.tasks.filter(task => task._id !== action.payload);
//       })
//       .addCase(deleteTask.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.error.message;
//       });
//   }
// });

// export default tasksSlice.reducer;