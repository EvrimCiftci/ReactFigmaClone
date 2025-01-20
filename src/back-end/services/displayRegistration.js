// services/displayRegistration.js
import { nanoid } from 'nanoid';
import { socket, emitDisplayRegistration } from '../../lib/socket';
import { useStore } from '../../store/store';

class DisplayRegistration {
  // Generate registration code
  generateCode() {
    return nanoid(6).toUpperCase();
  }

  // Register new display
  async registerDisplay(displayName) {
    const code = this.generateCode();
    
    return new Promise((resolve, reject) => {
      // Emit registration request
      emitDisplayRegistration({
        code,
        displayName,
        timestamp: Date.now()
      });

      // Listen for registration confirmation
      socket.once('registration-complete', (response) => {
        if (response.code === code) {
          // Update store with new display
          const { setDisplays, displays } = useStore.getState();
          setDisplays([...displays, {
            id: response.displayId,
            name: displayName,
            status: 'online',
            lastSync: new Date().toLocaleString()
          }]);
          resolve(response);
        }
      });

      // Handle timeout
      setTimeout(() => {
        reject(new Error('Registration timeout'));
      }, 5000);
    });
  }

  // Verify registration code
  async verifyCode(code) {
    return new Promise((resolve, reject) => {
      socket.emit('verify-code', code);
      
      socket.once('verification-result', (result) => {
        if (result.valid) {
          resolve(result);
        } else {
          reject(new Error('Invalid code'));
        }
      });
    });
  }
}

export const displayRegistration = new DisplayRegistration();