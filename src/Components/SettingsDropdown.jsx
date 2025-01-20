import React, { useState } from 'react';
import { Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/store'; // Assuming this is the correct path

const SettingsDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const setIsConnected = useStore((state) => state.setIsConnected); // Add this if you need to reset connection state

  const handleLogout = () => {
    // Clear localStorage
    localStorage.clear(); // Clear all storage instead of just displayInfo
    
    // Reset any relevant state
    setIsConnected(false); // Reset connection state if needed
    
    // Close dropdown
    setIsOpen(false);
    
    // Force navigation and refresh
    navigate('/', { replace: true });
    window.location.reload(); // Force a full page refresh
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Settings className="w-5 h-5" />
      </button>
      
      {/* Overlay to close dropdown when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Dropdown Menu */}
      <div
        className={`
          absolute right-0 mt-2 w-48 rounded-md shadow-lg
          transform origin-top-right transition-all duration-200 ease-in-out z-20
          ${isOpen 
            ? 'opacity-100 scale-100 translate-y-0' 
            : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}
          bg-white ring-1 ring-black ring-opacity-5
        `}
      >
        <div className="py-1">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsDropdown;