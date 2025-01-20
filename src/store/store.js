import { create } from 'zustand';
import { socket, sendMessage, addMessageHandler } from '../socket';

const useStore = create((set, get) => ({
  isConnected: false,
  displayInfo: JSON.parse(localStorage.getItem('displayInfo') || 'null'),
  displays: [],
  activeDisplay: null,
  error: null,

  setIsConnected: (status) => set({ isConnected: status }),
  
  initializeSocket: () => {
    // Set up message handlers
    const handlers = [
      addMessageHandler('display-list', (data) => {
        set({ displays: data.displays });
      }),
      
      addMessageHandler('display-status', (data) => {
        set(state => ({
          displays: state.displays.map(display =>
            display.id === data.displayId
              ? { ...display, status: data.status }
              : display
          )
        }));
      }),
      
      addMessageHandler('error', (data) => {
        set({ error: data.message });
      }),
      
      addMessageHandler('registration-complete', (data) => {
        const displayInfo = {
          id: data.display.id,
          name: data.display.name,
          registrationCode: data.display.registrationCode
        };
        localStorage.setItem('displayInfo', JSON.stringify(displayInfo));
        set({ displayInfo });
      })
    ];

    // Clean up handlers on store cleanup
    return () => handlers.forEach(cleanup => cleanup());
  },

  registerDisplay: (displayName) => {
    return new Promise((resolve, reject) => {
      const cleanup = addMessageHandler('registration-complete', (data) => {
        cleanup(); // Remove this handler
        resolve(data.display);
      });

      const errorCleanup = addMessageHandler('registration-error', (data) => {
        errorCleanup(); // Remove this handler
        reject(new Error(data.message));
      });

      if (!sendMessage('register-display', { name: displayName })) {
        reject(new Error('Failed to send registration message'));
      }
    });
  },

  disconnectDisplay: () => {
    const displayInfo = get().displayInfo;
    if (displayInfo) {
      sendMessage('display-disconnect', { id: displayInfo.id });
    }
    localStorage.removeItem('displayInfo');
    set({ displayInfo: null, activeDisplay: null });
    window.location.href = '/';
  }
}));

export  { useStore };