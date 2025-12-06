import { createSlice } from '@reduxjs/toolkit';

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: {
    message: null,
    type: null, // 'success', 'error', 'info'
    open: false
  },
  reducers: {
    showNotification: (state, action) => {
      state.message = action.payload.message;
      state.type = action.payload.type;
      state.open = true;
    },
    hideNotification: (state) => {
      state.open = false;
    }
  }
});

export const { showNotification, hideNotification } = notificationsSlice.actions;
export default notificationsSlice.reducer;