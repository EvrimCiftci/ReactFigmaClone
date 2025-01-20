import React, { useState } from 'react';
import { LuFrame } from "react-icons/lu";
import { Type, Square, Circle, Triangle, Star, Hexagon, Upload, Minus } from 'lucide-react';

// Main ShapeToolbar component
export default function ShapeToolbar({ onAddShape }) {
  // State to track which button is currently hovered
  const [hoveredButton, setHoveredButton] = useState(null);

  // List of available shapes and their associated icons and labels
  const shapes = [
    { type: 'text', icon: Type, label: 'Text' },
    { type: 'rectangle', icon: Square, label: 'Rectangle' },
    { type: 'circle', icon: Circle, label: 'Circle' },
    { type: 'triangle', icon: Triangle, label: 'Triangle' },
    { type: 'star', icon: Star, label: 'Star' },
    { type: 'hexagon', icon: Hexagon, label: 'Hexagon' },
    { type: 'iframe', icon: LuFrame, label: 'Iframe' },
    { type: 'line', icon: Minus, label: 'Line' },
  ];

  // Function to handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0]; // Get the selected file
    if (file) {
      const reader = new FileReader();
      // Once the file is read, pass the image data to the parent component
      reader.onloadend = () => {
        onAddShape('image', reader.result);
      };
      reader.readAsDataURL(file); // Convert the file to a base64 string
    }
  };

  return (
    <div className="p-3 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50">
      {/* Toolbar container with a horizontal layout */}
      <div className="flex flex-row gap-1">
        {/* Map through shapes and render a button for each */}
        {shapes.map(({ type, icon: Icon, label }) => (
          <button
            key={type} // Unique key for each button
            onClick={() => onAddShape(type)} // Trigger shape addition
            onMouseEnter={() => setHoveredButton(type)} // Highlight button on hover
            onMouseLeave={() => setHoveredButton(null)} // Reset hover state on leave
            className="group relative p-2.5 rounded-lg transition-all duration-300 ease-in-out
              active:scale-95 hover:bg-blue-50 hover:shadow-sm"
            title={label} // Tooltip for accessibility
          >
            {/* Render shape icon */}
            <Icon
              size={22}
              className={`transition-all duration-300
                ${hoveredButton === type ? 'text-blue-600 scale-110' : 'text-gray-600'}
                group-hover:rotate-6`}
            />
            {/* Hover tooltip for button label */}
            <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900/90 text-white text-xs
              rounded-md opacity-0 group-hover:opacity-100
              transition-opacity duration-200 whitespace-nowrap z-50
              backdrop-blur-sm shadow-lg
              translate-y-0 group-hover:-translate-y-1">
              {label}
            </span>
          </button>
        ))}
        
        {/* Hidden input for image upload */}
        <input
          type="file"
          accept="image/*" // Accept only image files
          onChange={handleImageUpload} // Handle file selection
          className="hidden" // Hide the default input UI
          id="imageUpload" // Link label to this input
        />
        {/* Custom label styled as a button for image upload */}
        <label
          htmlFor="imageUpload" // Trigger input on click
          onMouseEnter={() => setHoveredButton('upload')} // Highlight button on hover
          onMouseLeave={() => setHoveredButton(null)} // Reset hover state on leave
          className="group relative p-2.5 rounded-lg hover:bg-purple-50
            transition-all duration-300 ease-in-out cursor-pointer
            active:scale-95 active:bg-purple-100"
          title="Upload Image" // Tooltip for accessibility
        >
          {/* Upload icon */}
          <Upload
            size={22}
            className={`transition-all duration-300
              ${hoveredButton === 'upload' ? 'text-purple-600 scale-110' : 'text-gray-600'}
              group-hover:rotate-6`}
          />
          {/* Hover tooltip for image upload */}
          <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900/90 text-white text-xs
            rounded-md opacity-0 group-hover:opacity-100
            transition-opacity duration-200 whitespace-nowrap z-50
            backdrop-blur-sm shadow-lg
            translate-y-0 group-hover:-translate-y-1">
            Upload Image
          </span>
        </label>
      </div>
    </div>
  );
}
