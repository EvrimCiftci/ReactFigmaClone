import React, { useState, useEffect } from 'react';
import { useStore } from "../../store/store.js";
import { Monitor, Wifi, WifiOff } from 'lucide-react';
import { sendMessage } from '../../socket.js';

// Get base API URL based on environment
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001' 
  : `${window.location.origin}`;

const DisplayList = () => {
  const { displays, isConnected } = useStore();
  const [error, setError] = useState(null);
  const [displayKeys] = useState(new Map());

  // Function to get a unique key for each display
  const getDisplayKey = (display) => {
    if (display.id) return display.id;
    if (!displayKeys.has(display)) {
      displayKeys.set(display, crypto.randomUUID());
    }
    return displayKeys.get(display);
  };

  // Fetch initial list of displays
  useEffect(() => {
    const fetchDisplays = () => {
      try {
        sendMessage('get-displays');
      } catch (err) {
        console.error('Error fetching displays:', err);
        setError('Failed to fetch displays');
      }
    };

    fetchDisplays();

    // Set up periodic refresh
    const refreshInterval = setInterval(fetchDisplays, 30000); // Refresh every 30 seconds

    return () => clearInterval(refreshInterval);
  }, []);

  // Function to toggle display status
  const toggleDisplayStatus = async (displayId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/displays/${displayId}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Refresh display list after toggling
      sendMessage('get-displays');
    } catch (err) {
      console.error('Error toggling display status:', err);
      setError('Failed to toggle display status');
      
      // Clear error after 3 seconds
      setTimeout(() => setError(null), 3000);
    }
  };

  // Handle connection status changes
  useEffect(() => {
    if (!isConnected) {
      console.log('WebSocket disconnected. Displays may be outdated.');
    }
  }, [isConnected]);

  // Render error message if there's an error
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-red-500 text-center py-4">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg h-[600px] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Local Displays</h2>
          </div>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <span className="text-green-500 text-sm animate-pulse">Connected</span>
            ) : (
              <span className="text-red-500 text-sm">Disconnected</span>
            )}
          </div>
        </div>
      </div>

      {/* Display List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {!displays || displays.length === 0 ? (
          <div className="text-gray-500 text-center py-4">
            {isConnected ? 'No displays available' : 'Connecting to server...'}
          </div>
        ) : (
          displays.map((display) => (
            <div
              key={getDisplayKey(display)}
              className="group flex items-center justify-between p-4 border rounded-lg cursor-pointer
                       transition-all duration-200 ease-in-out
                       hover:border-blue-500 hover:shadow-md hover:-translate-y-0.5
                       bg-white hover:bg-blue-50"
              onClick={() => useStore.setState({ activeDisplay: display })}
            >
              <div className="flex items-center gap-3">
                {display.status === 'online' ? (
                  <Wifi
                    className="w-4 h-4 text-green-500 cursor-pointer
                             transition-transform duration-200 ease-in-out
                             group-hover:scale-110"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleDisplayStatus(display.id);
                    }}
                  />
                ) : (
                  <WifiOff
                    className="w-4 h-4 text-red-500 cursor-pointer
                             transition-transform duration-200 ease-in-out
                             group-hover:scale-110"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleDisplayStatus(display.id);
                    }}
                  />
                )}
                <span className="font-medium group-hover:text-blue-600 transition-colors duration-200">
                  {display.name}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors duration-200">
                  Last sync: {new Date(display.lastSync).toLocaleString() || 'Never'}
                </span>
                <span
                  className={`px-2 py-1 rounded text-sm transition-colors duration-200
                    ${display.status === 'online'
                      ? 'bg-green-500 group-hover:bg-green-600 text-white'
                      : 'bg-red-500 group-hover:bg-red-600 text-white'
                    }`}
                >
                  {display.status || 'offline'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DisplayList;