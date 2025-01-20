import React, { useState, useEffect } from 'react';
import { X, ChevronUp, ChevronDown, Copy, Trash, Settings } from 'lucide-react';

const PropertiesPanel = ({
  element,       // The current element whose properties are being displayed
  onUpdate,      // Function to update the properties of the element
  onDelete,      // Function to delete the element
  onClone,       // Function to clone the element
  onBringForward, // Function to bring the element forward in the canvas stack
  onSendBackward, // Function to send the element backward in the canvas stack
  onClose        // Function to close the properties panel
}) => {
  // State to track the border width of the element
  const [borderWidth, setBorderWidth] = useState(element?.strokeWidth || 0);
  // State to handle the closing animation of the panel
  const [isExiting, setIsExiting] = useState(false);

  // List of font families for font customization
  const fontFamilies = [
    'Arial',
    'Times New Roman',
    'Helvetica',
    'Georgia',
    'Courier New',
    'Verdana',
    'Impact',
    'Comic Sans MS',
    'Trebuchet MS',
    'Arial Black',
    'Palatino',
    'Garamond',
    'Bookman',
    'Tahoma',
  ];

  // Sync the border width when the element's `strokeWidth` changes
  useEffect(() => {
    setBorderWidth(element?.strokeWidth || 0);
  }, [element?.strokeWidth]);

  // If no element is selected, don't render the panel
  if (!element) return null;

  // Handle the closing animation and execute the `onClose` callback
  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
      setIsExiting(false);
    }, 500);
  };

  // Handle changes to the border width input and update the element's properties
  const handleBorderWidthChange = (e) => {
    const value = parseInt(e.target.value) || 0;
    setBorderWidth(value);
    onUpdate({ strokeWidth: value });
  };

  return (
    <div 
      className={`
        fixed top-4 right-4 w-80 z-50
        transition-all duration-500 ease-in-out
        ${isExiting ? 'opacity-0 translate-x-full rotate-6' : 'opacity-100'}
      `}
    >
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden
                    hover:shadow-2xl transition-shadow duration-300">
        {/* Header section */}
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              {/* Animated settings icon */}
              <Settings className="w-5 h-5 text-blue-500 animate-spin-slow" />
              Properties
            </h3>
            <div className="flex items-center gap-2">
              {/* Delete button */}
              <button
                onClick={onDelete}
                className="p-1.5 hover:bg-red-50 rounded-full transition-colors
                         hover:rotate-12 transform duration-200"
                title="Delete"
              >
                <Trash className="w-4 h-4 text-red-500" />
              </button>
              {/* Close button */}
              <button
                onClick={handleClose}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors
                         hover:-rotate-12 transform duration-200"
                title="Close"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Main content section */}
        <div className="p-4 space-y-4">
          {/* If the element is text, show text-specific controls */}
          {element.type === 'i-text' && (
            <div className="space-y-4">
              {/* Text input field */}
              <div className="transform transition-all duration-200 hover:scale-[1.02]">
                <label className="block text-sm font-medium text-gray-700 mb-1">Text</label>
                <input
                  type="text"
                  value={element.text || ''}
                  onChange={(e) => onUpdate({ text: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md 
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           transition-all duration-200 hover:border-blue-300"
                />
              </div>

              {/* Font family dropdown */}
              <div className="transform transition-all duration-200 hover:scale-[1.02]">
                <label className="block text-sm font-medium text-gray-700 mb-1">Font Family</label>
                <select
                  value={element.fontFamily || 'Arial'}
                  onChange={(e) => onUpdate({ fontFamily: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md 
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           transition-all duration-200 hover:border-blue-300"
                >
                  {fontFamilies.map((font) => (
                    <option key={font} value={font} style={{ fontFamily: font }}>
                      {font}
                    </option>
                  ))}
                </select>
              </div>

              {/* Font size input */}
              <div className="transform transition-all duration-200 hover:scale-[1.02]">
                <label className="block text-sm font-medium text-gray-700 mb-1">Font Size</label>
                <input
                  type="number"
                  value={element.fontSize || 24}
                  onChange={(e) => onUpdate({ fontSize: parseInt(e.target.value) || 24 })}
                  min="8"
                  max="72"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md 
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           transition-all duration-200 hover:border-blue-300"
                />
              </div>
            </div>
          )}

          {/* Controls for fill and border colors */}
          <div className="space-y-4">
            <div className="transform transition-all duration-200 hover:scale-[1.02]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Fill Color</label>
              <input
                type="color"
                value={element.fill || '#000000'}
                onChange={(e) => onUpdate({ fill: e.target.value })}
                className="w-full h-10 rounded-md cursor-pointer border border-gray-300
                         transition-all duration-200 hover:border-blue-300"
              />
            </div>

            <div className="transform transition-all duration-200 hover:scale-[1.02]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Border Color</label>
              <input
                type="color"
                value={element.stroke || '#000000'}
                onChange={(e) => onUpdate({ stroke: e.target.value })}
                className="w-full h-10 rounded-md cursor-pointer border border-gray-300
                         transition-all duration-200 hover:border-blue-300"
              />
            </div>

            <div className="transform transition-all duration-200 hover:scale-[1.02]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Border Width</label>
              <input
                type="number"
                value={borderWidth}
                onChange={handleBorderWidthChange}
                min="0"
                max="20"
                className="w-full px-3 py-2 border border-gray-300 rounded-md 
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         transition-all duration-200 hover:border-blue-300"
              />
            </div>
          </div>

          {/* Action buttons for element manipulation */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            <button
              onClick={onBringForward}
              className="flex items-center justify-center gap-1 px-3 py-2 
                       bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-md 
                       transition-all duration-200 hover:scale-105"
            >
              <ChevronUp className="w-4 h-4" />
              <span className="text-sm">Forward</span>
            </button>
            <button
              onClick={onSendBackward}
              className="flex items-center justify-center gap-1 px-3 py-2 
                       bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-md 
                       transition-all duration-200 hover:scale-105"
            >
              <ChevronDown className="w-4 h-4" />
              <span className="text-sm">Back</span>
            </button>
            <button
              onClick={onClone}
              className="flex items-center justify-center gap-1 px-3 py-2 
                       bg-blue-500 hover:bg-blue-600 text-white rounded-md 
                       transition-all duration-200 hover:scale-105"
            >
              <Copy className="w-4 h-4" />
              <span className="text-sm">Clone</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertiesPanel;
