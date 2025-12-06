import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Use environment variable for API URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Async thunks
export const fetchTasks = createAsyncThunk('tasks/fetchTasks', async () => {
  const response = await api.get('/tasks');
  return response.data;
});

export const createTask = createAsyncThunk('tasks/createTask', async (taskData) => {
  const response = await api.post('/tasks', taskData);
  return response.data;
});

export const updateTask = createAsyncThunk('tasks/updateTask', async ({ id, ...taskData }) => {
  const response = await api.put(`/tasks/${id}`, taskData);
  return response.data;
});

export const deleteTask = createAsyncThunk('tasks/deleteTask', async (id) => {
  await api.delete(`/tasks/${id}`);
  return id;
});

// Health check
export const checkApiHealth = createAsyncThunk('tasks/healthCheck', async () => {
  const response = await api.get('/health');
  return response.data;
});

const tasksSlice = createSlice({
  name: 'tasks',
  initialState: {
    tasks: [],
    loading: false,
    error: null,
    apiStatus: 'unknown'
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Health check
      .addCase(checkApiHealth.fulfilled, (state) => {
        state.apiStatus = 'healthy';
      })
      .addCase(checkApiHealth.rejected, (state) => {
        state.apiStatus = 'unhealthy';
      })
      
      // Fetch tasks
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = action.payload;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      
      // Create task
      .addCase(createTask.pending, (state) => {
        state.loading = true;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks.unshift(action.payload);
      })
      .addCase(createTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      
      // Update task
      .addCase(updateTask.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.tasks.findIndex(task => task._id === action.payload._id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      
      // Delete task
      .addCase(deleteTask.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = state.tasks.filter(task => task._id !== action.payload);
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  }
});

export const { clearError } = tasksSlice.actions;
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