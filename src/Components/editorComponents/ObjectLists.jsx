import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // Importing animation libraries
import { Edit2, Check, X } from 'lucide-react'; // Importing icons

const ObjectLists = ({ objects, onObjectClick }) => {
  const [editingId, setEditingId] = useState(null); // State to track the object being edited
  const [editValue, setEditValue] = useState(''); // State to store the edited value

  // Function to start editing an object
  const handleStartEdit = (obj, e) => {
    e.stopPropagation(); // Prevent the parent click event from firing
    setEditingId(obj.id); // Set the ID of the object being edited
    setEditValue(obj.name || getObjectName(obj)); // Pre-fill the edit input with the current name
  };

  // Function to save changes to the object name
  const handleSaveEdit = (obj, e) => {
    e.stopPropagation(); // Prevent the parent click event from firing
    if (obj.set) { // If the object has a `set` method (likely Fabric.js object)
      obj.set('name', editValue); // Update the object's name
      if (obj.canvas) { // If the object belongs to a canvas
        obj.canvas.renderAll(); // Re-render the canvas to reflect changes
      }
    }
    setEditingId(null); // Clear the editing state
  };

  // Function to cancel the edit process
  const handleCancelEdit = (e) => {
    e.stopPropagation(); // Prevent the parent click event from firing
    setEditingId(null); // Clear the editing state
  };

  return (
    <motion.div 
      initial={{ y: 100 }} // Start animation with a 100px vertical offset
      animate={{ y: 0 }} // Move to its final position
      className="fixed bottom-0 right-0 w-64 bg-white border-t border-l border-gray-200 shadow-lg rounded-tl-lg"
    >
      <div className="p-3">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Objects</h3>
        <motion.div 
          className="max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
        >
          <ul className="space-y-1">
            <AnimatePresence>
              {objects.map((obj, index) => (
                <motion.li
                  key={obj.id || index} // Use object's ID or index as key
                  initial={{ opacity: 0, x: -20 }} // Start animation with an offset
                  animate={{ opacity: 1, x: 0 }} // Animate to the final position
                  exit={{ opacity: 0, x: 20 }} // Animate on exit
                  onClick={() => onObjectClick(obj)} // Handle object click
                  className="p-2 rounded cursor-pointer hover:bg-blue-50 transition-colors duration-150 flex items-center justify-between group"
                >
                  <div className="flex items-center space-x-2 min-w-0">
                    <motion.span 
                      whileHover={{ rotate: 360 }} // Rotate icon on hover
                      transition={{ duration: 0.5 }} // Set rotation duration
                      className="text-gray-500 group-hover:text-blue-500 flex-shrink-0"
                    >
                      {getObjectIcon(obj.type)} {/* Display object type icon */}
                    </motion.span>

                    {editingId === obj.id ? ( // If the object is being edited
                      <div className="flex items-center space-x-1 flex-1 min-w-0" onClick={e => e.stopPropagation()}>
                        <input
                          type="text" // Input field for editing the name
                          value={editValue} // Controlled value
                          onChange={e => setEditValue(e.target.value)} // Update value on change
                          className="w-full px-1 py-0.5 text-xs border rounded focus:outline-none focus:border-blue-500"
                          autoFocus // Automatically focus on the input
                        />
                        <button 
                          onClick={e => handleSaveEdit(obj, e)} // Save edits
                          className="p-0.5 hover:bg-green-100 rounded"
                        >
                          <Check size={12} className="text-green-600" /> {/* Save icon */}
                        </button>
                        <button 
                          onClick={handleCancelEdit} // Cancel editing
                          className="p-0.5 hover:bg-red-100 rounded"
                        >
                          <X size={12} className="text-red-600" /> {/* Cancel icon */}
                        </button>
                      </div>
                    ) : ( // If not editing
                      <div className="flex items-center space-x-1 flex-1 min-w-0">
                        <span className="text-xs text-gray-600 group-hover:text-gray-900 truncate">
                          {obj.name || getObjectName(obj)} {/* Display object name */}
                        </span>
                        <button 
                          onClick={e => handleStartEdit(obj, e)} // Start editing
                          className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-gray-100 rounded transition-opacity duration-200 flex-shrink-0"
                        >
                          <Edit2 size={12} className="text-gray-500" /> {/* Edit icon */}
                        </button>
                      </div>
                    )}
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </motion.div>
      </div>
    </motion.div>
  );
};

// Helper function to get object icons based on type
const getObjectIcon = (type) => {
  switch (type?.toLowerCase()) {
    case 'rect':
    case 'rectangle':
      return '⬜'; // Rectangle icon
    case 'circle':
      return '⭕'; // Circle icon
    case 'triangle':
      return '🔺'; // Triangle icon
    case 'text':
      return '📝'; // Text icon
    case 'star':
      return '⭐'; // Star icon
    case 'hexagon':
      return '⬢'; // Hexagon icon
    case 'image':
      return '🖼️'; // Image icon
    default:
      return '⚪'; // Default icon
  }
};

// Helper function to get object name
const getObjectName = (obj) => {
  if (obj.name) return obj.name; // Return name if available
  if (obj.type && obj.id) return `${obj.type} - ${obj.id}`; // Combine type and ID
  if (obj.type) return `${obj.type}`; // Return type
  return 'Unnamed Object'; // Default name
};

export default ObjectLists;
