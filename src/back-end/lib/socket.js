const WS_URL = 'ws://localhost:3001';

class SocketService {
  constructor() {
    this.socket = null;
    this.messageHandlers = new Map();
    this.connect();
  }

  connect() {
    console.log('Attempting to connect to WebSocket...');
    this.socket = new WebSocket(WS_URL);

    this.socket.addEventListener('open', () => {
      console.log('WebSocket connected. Ready state:', this.socket.readyState);
      // Reconnect any stored display
      const displayInfo = localStorage.getItem('displayInfo');
      if (displayInfo) {
        const { id } = JSON.parse(displayInfo);
        this.sendMessage('display-connect', { id });
      }
    });

    this.socket.addEventListener('close', () => {
      console.log('WebSocket disconnected. Attempting to reconnect in 2 seconds...');
      setTimeout(() => this.connect(), 2000);
    });

    this.socket.addEventListener('error', (error) => {
      console.error('WebSocket encountered an error:', error);
    });

    this.socket.addEventListener('message', (event) => {
      console.log('WebSocket message received:', event.data);
      try {
        const data = JSON.parse(event.data);
        const handlers = this.messageHandlers.get(data.type) || [];
        handlers.forEach(handler => handler(data));
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });
  }

  generateRandomId() {
    return crypto.randomUUID();
  }

  addMessageHandler(type, callback) {
    const handlers = this.messageHandlers.get(type) || [];
    handlers.push(callback);
    this.messageHandlers.set(type, handlers);
    return () => this.removeMessageHandler(type, callback);
  }

  removeMessageHandler(type, callback) {
    const handlers = this.messageHandlers.get(type) || [];
    this.messageHandlers.set(type, handlers.filter(h => h !== callback));
  }

  sendMessage(type, payload = {}) {
    try {
      if (this.socket?.readyState === WebSocket.OPEN) {
        const message = {
          type,
          ...payload,
          timestamp: Date.now()
        };

        if (type === 'register-display' && !payload.id) {
          message.id = this.generateRandomId();
        }

        console.log('Sending message:', message);
        this.socket.send(JSON.stringify(message));
        return true;
      } else {
        throw new Error('WebSocket connection not established');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }

  isConnected() {
    return this.socket?.readyState === WebSocket.OPEN;
  }
}

// Create a single instance
const socketInstance = new SocketService();

// Export individual methods and the socket instance
export const socket = socketInstance.socket;
export const sendMessage = (type, payload) => socketInstance.sendMessage(type, payload);
export const addMessageHandler = (type, callback) => socketInstance.addMessageHandler(type, callback);
export const isConnected = () => socketInstance.isConnected();

// Export the instance as default
export default socketInstance;