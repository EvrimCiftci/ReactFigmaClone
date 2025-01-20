// socketService.js
class SocketService {
  constructor() {
    this.socket = null;
    this.messageHandlers = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 2000;
    this.connect();
  }

  connect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    // Determine WebSocket URL based on current environment
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = window.location.hostname === 'localhost' 
      ? 'ws://localhost:3001'
      : `${protocol}//${window.location.host}`;

    console.log(`Attempting to connect to WebSocket at ${wsUrl}... (Attempt ${this.reconnectAttempts + 1})`);
    
    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.addEventListener('open', () => {
        console.log('WebSocket connected successfully');
        this.reconnectAttempts = 0;
        
        // Reconnect any stored display
        const displayInfo = localStorage.getItem('displayInfo');
        if (displayInfo) {
          try {
            const { id } = JSON.parse(displayInfo);
            this.sendMessage('display-connect', { id });
          } catch (error) {
            console.error('Error parsing stored display info:', error);
          }
        }
      });

      this.socket.addEventListener('close', () => {
        console.log('WebSocket disconnected');
        this.reconnectAttempts++;
        setTimeout(() => this.connect(), this.reconnectDelay);
      });

      this.socket.addEventListener('error', (error) => {
        console.error('WebSocket error:', error);
      });

      this.socket.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received message:', data);
          const handlers = this.messageHandlers.get(data.type) || [];
          handlers.forEach(handler => handler(data));
        } catch (error) {
          console.error('Error processing message:', error);
        }
      });
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      this.reconnectAttempts++;
      setTimeout(() => this.connect(), this.reconnectDelay);
    }
  }

  generateRandomId() {
    return crypto.randomUUID();
  }

  addMessageHandler(type, callback) {
    if (typeof callback !== 'function') {
      throw new Error('Handler must be a function');
    }
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
    if (!type) {
      throw new Error('Message type is required');
    }

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
        console.warn('WebSocket not ready. Message queued for retry.');
        setTimeout(() => this.sendMessage(type, payload), 1000);
        return false;
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

const socketInstance = new SocketService();

export const socket = socketInstance.socket;
export const sendMessage = (type, payload) => socketInstance.sendMessage(type, payload);
export const addMessageHandler = (type, callback) => socketInstance.addMessageHandler(type, callback);
export const isConnected = () => socketInstance.isConnected();
export default socketInstance;