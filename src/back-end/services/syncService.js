import { socket } from '../lib/socket';

class SyncService {
  constructor() {
    this.syncQueue = new Map();
    this.isSyncing = false;
    this.isOnline = navigator.onLine;
    this.pendingChanges = new Map();
    
    // Setup online/offline listeners
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
  }

  // Handle going online
  handleOnline = async () => {
    this.isOnline = true;
    console.log('Back online, processing pending changes');
    await this.processPendingChanges();
  }

  // Handle going offline
  handleOffline = () => {
    this.isOnline = false;
    console.log('Gone offline, changes will be queued');
  }

  // Save content to IndexedDB
  async saveToIndexedDB(displayId, content) {
    const db = await this.getIndexedDB();
    const transaction = db.transaction(['content'], 'readwrite');
    const store = transaction.objectStore('content');
    
    await store.put({
      displayId,
      content,
      timestamp: Date.now(),
      synced: false
    });
  }

  // Get content from IndexedDB
  async getFromIndexedDB(displayId) {
    const db = await this.getIndexedDB();
    const transaction = db.transaction(['content'], 'readonly');
    const store = transaction.objectStore('content');
    
    return await store.get(displayId);
  }

  // Initialize IndexedDB
  getIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('displayContent', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('content')) {
          db.createObjectStore('content', { keyPath: 'displayId' });
        }
      };
    });
  }

  // Queue content for sync
  async queueContent(displayId, content) {
    // Save to IndexedDB first
    await this.saveToIndexedDB(displayId, content);
    
    if (this.isOnline) {
      await this.syncContent(displayId, content);
    } else {
      // Add to pending changes if offline
      this.pendingChanges.set(displayId, content);
      console.log(`Content queued for display ${displayId} (offline)`);
    }
  }

  // Process all pending changes
  async processPendingChanges() {
    if (!this.isOnline) return;

    const db = await this.getIndexedDB();
    const transaction = db.transaction(['content'], 'readonly');
    const store = transaction.objectStore('content');
    const request = store.getAll();

    request.onsuccess = async () => {
      const unsyncedContent = request.result.filter(item => !item.synced);
      
      for (const item of unsyncedContent) {
        try {
          await this.syncContent(item.displayId, item.content);
          // Mark as synced in IndexedDB
          const updateTx = db.transaction(['content'], 'readwrite');
          const updateStore = updateTx.objectStore('content');
          item.synced = true;
          await updateStore.put(item);
        } catch (error) {
          console.error(`Failed to sync content for display ${item.displayId}:`, error);
        }
      }
    };
  }

  // Sync content with server
  async syncContent(displayId, content) {
    return new Promise((resolve, reject) => {
      if (!this.isOnline) {
        reject(new Error('Offline'));
        return;
      }

      socket.emit('content-update', {
        type: 'content-update',
        displayId,
        content,
        timestamp: Date.now()
      });

      const timeout = setTimeout(() => {
        socket.off('sync-complete');
        reject(new Error('Sync timeout'));
      }, 5000);

      socket.once('sync-complete', (response) => {
        clearTimeout(timeout);
        if (response.displayId === displayId) {
          resolve(response);
        } else {
          reject(new Error('Invalid response'));
        }
      });
    });
  }

  // Get latest content for a display
  async getContent(displayId) {
    try {
      // Try to get from server first if online
      if (this.isOnline) {
        const response = await fetch(`http://localhost:3001/api/displays/${displayId}/content`);
        if (response.ok) {
          const content = await response.json();
          // Update local cache
          await this.saveToIndexedDB(displayId, content);
          return content;
        }
      }
      
      // Fall back to IndexedDB if offline or server request failed
      const localContent = await this.getFromIndexedDB(displayId);
      return localContent?.content;
    } catch (error) {
      console.error('Error getting content:', error);
      return null;
    }
  }
}

export const enhancedSyncService = new SyncService();