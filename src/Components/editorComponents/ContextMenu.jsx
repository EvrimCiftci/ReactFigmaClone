// ContextMenu Component
export default function ContextMenu({ x, y, onClone, onDelete }) {
  // Reference to the context menu element
  const menuRef = useRef(null);

  // State to track adjusted position of the context menu
  const [adjustedPosition, setAdjustedPosition] = useState({ x, y });

  useEffect(() => {
    if (menuRef.current) {
      // Get the bounding rectangle of the context menu
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth; // Width of the viewport
      const viewportHeight = window.innerHeight; // Height of the viewport

      let adjustedX = x; // Initial horizontal position
      let adjustedY = y; // Initial vertical position

      // Adjust horizontal position if the menu would overflow the viewport
      if (x + rect.width > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 10; // Shift to fit within viewport
      }

      // Adjust vertical position if the menu would overflow the viewport
      if (y + rect.height > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 10; // Shift to fit within viewport
      }

      // Update the position state with adjusted values
      setAdjustedPosition({ x: adjustedX, y: adjustedY });
    }
  }, [x, y]); // Recalculate adjustments whenever x or y changes

  return (
    <div
      ref={menuRef} // Attach the reference to the menu container
      className="fixed bg-white shadow-lg rounded-lg border p-2 z-50" // Style the menu
      style={{
        left: `${adjustedPosition.x}px`, // Adjusted horizontal position
        top: `${adjustedPosition.y}px`, // Adjusted vertical position
        transform: 'translate(0, 0)' // Prevent unintended transforms
      }}
    >
      {/* Clone Button */}
      <button
        onClick={onClone} // Trigger clone action
        className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 w-full rounded"
      >
        <Copy size={16} /> {/* Icon for Clone */}
        Clone {/* Label for Clone */}
      </button>

      {/* Delete Button */}
      <button
        onClick={onDelete} // Trigger delete action
        className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 w-full rounded text-red-500"
      >
        <Trash2 size={16} /> {/* Icon for Delete */}
        Delete {/* Label for Delete */}
      </button>
    </div>
  );
}
