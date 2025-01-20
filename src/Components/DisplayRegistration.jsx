import React, { useState, useEffect } from 'react'; // Import React and hooks
import { useNavigate } from 'react-router-dom'; // For navigation between pages
import { socket, sendMessage } from '../back-end/lib/socket'; // Import WebSocket instance and utility
import { Loader2 } from 'lucide-react'; // Import a loading spinner icon
import { motion } from 'framer-motion'; // Import animation utilities from Framer Motion

const DisplayRegistration = () => {
  // State variables for managing input, registration status, errors, and navigation
  const [displayName, setDisplayName] = useState(''); 
  const [registrationCode, setRegistrationCode] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let timeoutId; // Timer ID for registration timeout
    let navigationTimeout; // Timer ID for delayed navigation

    // Event handler for WebSocket messages
    const handleMessage = (event) => {
      try {
        const response = JSON.parse(event.data); // Parse the incoming WebSocket message
        
        switch (response.type) {
          case 'registration-complete': // Handle successful registration
            if (timeoutId) clearTimeout(timeoutId);
            
            // Save display details to localStorage
            const displayInfo = {
              id: response.display.id,
              name: response.display.name,
              registrationCode: response.display.registrationCode
            };
            localStorage.setItem('displayInfo', JSON.stringify(displayInfo));
            setRegistrationCode(response.display.registrationCode); // Update state with registration code
            setIsRegistering(false);
            
            // Delay navigation to allow for success animation
            navigationTimeout = setTimeout(() => {
              navigate('/editor'); // Redirect to the editor page
            }, 1000);
            break;
            
          case 'registration-error': // Handle registration failure
            if (timeoutId) clearTimeout(timeoutId);
            setError(response.message || 'Registration failed'); // Display error message
            setIsRegistering(false);
            break;
            
          default: // Handle unexpected message types
            console.log('Unhandled message type:', response.type);
        }
      } catch (error) {
        console.error('🚨 Registration error:', error); // Log parsing errors
        setError('Error processing server response'); // Update state with generic error
        setIsRegistering(false);
      }
    };

    // Add WebSocket event listener for messages
    socket.addEventListener('message', handleMessage);

    if (socket.readyState !== WebSocket.OPEN) {
      setError('WebSocket connection not established'); // Show error if socket is not open
    }

    return () => {
      // Cleanup event listeners and timeouts on component unmount
      socket.removeEventListener('message', handleMessage);
      if (timeoutId) clearTimeout(timeoutId);
      if (navigationTimeout) clearTimeout(navigationTimeout);
    };
  }, [navigate]); // Dependency array includes navigate to handle rerenders

  // Form submission handler for registration
  const handleRegister = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior
    
    if (!displayName.trim()) { // Validate input
      setError('Display name is required');
      return;
    }

    setIsRegistering(true); // Set registration in progress
    setError(''); // Clear any existing error messages

    try {
      if (socket.readyState !== WebSocket.OPEN) { // Ensure WebSocket is connected
        throw new Error('WebSocket connection not established');
      }

      // Send registration request via WebSocket
      sendMessage('register-display', { 
        name: displayName,
        timestamp: Date.now()
      });
      
      const timeoutId = setTimeout(() => {
        setError('Registration timeout - please try again'); // Show error if request times out
        setIsRegistering(false);
      }, 5000);

    } catch (error) {
      console.error('Registration error:', error); // Log errors
      setError(error.message || 'Failed to register display'); // Show error to user
      setIsRegistering(false);
    }
  };

  return (
    <motion.div
      // Container with fade-in animation
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8"
    >
      <motion.div 
        // Form container with slide-up animation
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg"
      >
        <motion.div
          // Header with slight animation delay
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Register New Display
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter a name for your display to get started
          </p>
        </motion.div>
        
        <motion.form 
          // Registration form with animations
          className="mt-8 space-y-6" 
          onSubmit={handleRegister}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="rounded-md -space-y-px">
            <div className="mb-4">
              <label htmlFor="display-name" className="block text-sm font-medium text-gray-700 mb-1">
                Display Name
              </label>
              <input
                id="display-name"
                name="display-name"
                type="text"
                required
                className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ease-in-out"
                placeholder="Enter display name"
                value={displayName} // Controlled input bound to state
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={isRegistering} // Disable input while registering
              />
            </div>
          </div>
          
          {error && (
            // Show error message if an error occurs
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg"
            >
              {error}
            </motion.div>
          )}
          
          <motion.div
            // Button with hover/tap effects
            whileHover={{ scale: isRegistering ? 1 : 1.02 }}
            whileTap={{ scale: isRegistering ? 1 : 0.98 }}
          >
            <button
              type="submit"
              disabled={isRegistering} // Disable button while registering
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ease-in-out"
            >
              {isRegistering ? (
                // Show loader while registering
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Register Display'
              )}
            </button>
          </motion.div>
        </motion.form>
        
        {registrationCode && (
          // Show registration code on successful registration
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 text-center bg-green-50 p-4 rounded-lg"
          >
            <p className="text-sm text-gray-600">Your registration code:</p>
            <p className="text-xl font-bold text-indigo-600 mt-1">{registrationCode}</p>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default DisplayRegistration;
