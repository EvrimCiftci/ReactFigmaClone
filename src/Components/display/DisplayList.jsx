import React, { useState, useEffect } from 'react';
import { useStore } from "../../store/store.js";import { Monitor, Wifi, WifiOff } from 'lucide-react';
import { sendMessage } from '../../back-end/lib/socket.js';
// Component to display a list of displays and their statuses
const DisplayList = () => {
  // Get state from the store and manage local state for error handling
  const { displays, isConnected } = useStore();
  const [error, setError] = useState(null);
  const [displayKeys] = useState(new Map()); // Map to track unique keys for displays without IDs

  // Function to get a unique key for each display
  const getDisplayKey = (display) => {
    if (display.id) return display.id; // Use display ID if available
    if (!displayKeys.has(display)) {
      displayKeys.set(display, crypto.randomUUID()); // Generate a UUID for displays without an ID
    }
    return displayKeys.get(display);
  };

  // Fetch the initial list of displays when the component mounts
  useEffect(() => {
    sendMessage('get-displays'); // Send a message to retrieve displays
  }, []);

  // Function to toggle the status of a display (online/offline)
  const toggleDisplayStatus = async (displayId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/displays/${displayId}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      // Check if the request was successful
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Refresh the display list after toggling the status
      sendMessage('get-displays');
    } catch (err) {
      console.error('Error toggling display status:', err);
      setError('Failed to toggle display status'); // Set error message
    }
  };

  // Render error message if an error occurs
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
      {/* Fixed header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Local Displays</h2>
          </div>
          <div className="flex items-center gap-2">
            {/* Connection status indicator */}
            {isConnected ? (
              <span className="text-green-500 text-sm animate-pulse">Connected</span>
            ) : (
              <span className="text-red-500 text-sm">Disconnected</span>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Display a message if there are no displays available */}
        {!displays || displays.length === 0 ? (
          <div className="text-gray-500 text-center py-4">
            No displays available
          </div>
        ) : (
          // Render each display
          displays.map((display) => (
            <div
              key={getDisplayKey(display)} // Use unique key for each display
              className="group flex items-center justify-between p-4 border rounded-lg cursor-pointer
                       transition-all duration-200 ease-in-out
                       hover:border-blue-500 hover:shadow-md hover:-translate-y-0.5
                       bg-white hover:bg-blue-50"
              onClick={() => useStore.setState({ activeDisplay: display })} // Set active display on click
            >
              <div className="flex items-center gap-3">
                {/* Display status icon (online/offline) */}
                {display.status === 'online' ? (
                  <Wifi
                    className="w-4 h-4 text-green-500 cursor-pointer
                             transition-transform duration-200 ease-in-out
                             group-hover:scale-110"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering parent click event
                      toggleDisplayStatus(display.id); // Toggle display status
                    }}
                  />
                ) : (
                  <WifiOff
                    className="w-4 h-4 text-red-500 cursor-pointer
                             transition-transform duration-200 ease-in-out
                             group-hover:scale-110"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering parent click event
                      toggleDisplayStatus(display.id); // Toggle display status
                    }}
                  />
                )}
                <span className="font-medium group-hover:text-blue-600 transition-colors duration-200">
                  {display.name} {/* Display name */}
                </span>
              </div>
              <div className="flex items-center gap-4">
                {/* Last sync time */}
                <span className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors duration-200">
                  Last sync: {display.lastSync || 'Never'}
                </span>
                {/* Display status badge */}
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
