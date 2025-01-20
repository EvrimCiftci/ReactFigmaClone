import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import CanvasEditor from './Components/CanvasEditor.jsx';
import DisplayList from './Components/display/DisplayList';
import DisplayRegistration from './Components/DisplayRegistration.jsx';
import { useStore } from './store/store';
import { Pencil } from 'lucide-react';
import SettingsDropdown from './Components/SettingsDropdown.jsx';

// Create a protected route component
const ProtectedRoute = ({ children }) => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check authentication on mount
    const displayInfo = localStorage.getItem('displayInfo');
    if (!displayInfo) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  return children;
};

const MainLayout = () => {
  const isConnected = useStore((state) => state.isConnected);
  const setIsConnected = useStore((state) => state.setIsConnected);

  useEffect(() => {
    const checkConnection = () => {
      const socket = new WebSocket('ws://localhost:3001');
      
      socket.onopen = () => {
        setIsConnected(true);
      };
      
      socket.onclose = () => {
        setIsConnected(false);
        setTimeout(checkConnection, 2000);
      };
      
      return () => {
        socket.close();
      };
    };
    
    checkConnection();
  }, [setIsConnected]);

  return (
    <div className="h-screen w-full bg-gray-50 overflow-hidden">
      <header className="bg-white border-b">
        <div className="max-w-full mx-auto">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Pencil className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                  React Design Editor
                </h1>
                <p className="text-sm text-gray-600">
                  Crafted by Evrim
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-50 rounded-full">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-green-500' : 'bg-red-500'
                  } animate-pulse`}
                />
                <span className="text-sm font-medium text-gray-700">
                  {isConnected ? 'Connected' : 'Reconnecting...'}
                </span>
              </div>
              <SettingsDropdown />
            </div>
          </div>
        </div>
      </header>
      <div className="flex h-[calc(100vh-4rem)]">
        <div className="w-full bg-gray-100 h-62 border-r shadow-sm">
          <CanvasEditor />
        </div>
        <div className="flex-1 p-6">
          {/* Canvas content */}
        </div>
        <div className="w-80 bg-white border-l shadow-sm">
          <DisplayList />
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={<DisplayRegistration />}
        />
        <Route
          path="/editor"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        />
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </Router>
  );
}

export default App;