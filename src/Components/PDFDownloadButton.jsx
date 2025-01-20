import React, { useState } from 'react';
import { Download, FileDown, Check } from 'lucide-react';
import jsPDF from 'jspdf';

const PDFDownloadButton = ({ fabricCanvas }) => {
  // State management for dialog visibility, file name input, and downloading status
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [fileName, setFileName] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  // Function to initiate download dialog
  const handleDownload = () => {
    setShowNameDialog(true);
  };

  // Function to generate and download a PDF
  const generatePDF = async () => {
    if (!fileName || !fabricCanvas) return;
    setIsDownloading(true);
    try {
      // Create a temporary canvas for rendering the fabric canvas content
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = fabricCanvas.getWidth();
      tempCanvas.height = fabricCanvas.getHeight();
      const tempContext = tempCanvas.getContext('2d');
  
      // Draw the fabric canvas background and content onto the temporary canvas
      tempContext.fillStyle = fabricCanvas.backgroundColor;
      tempContext.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      tempContext.drawImage(fabricCanvas.getElement(), 0, 0);
  
      // Calculate PDF dimensions (convert pixels to mm for better scaling)
      const pxToMm = 0.264583;
      const width = tempCanvas.width * pxToMm;
      const height = tempCanvas.height * pxToMm;
  
      // Create a PDF using jsPDF with mm units
      const pdf = new jsPDF({
        orientation: width > height ? 'l' : 'p',
        unit: 'mm',
        format: [width, height]
      });
  
      // Add the image with proper scaling
      pdf.addImage(
        tempCanvas.toDataURL('image/png'),
        'PNG',
        0,
        0,
        width,
        height
      );
  
      // Save the PDF with the user-specified file name
      pdf.save(`${fileName}.pdf`);
      
      await new Promise(resolve => setTimeout(resolve, 800));
      setShowNameDialog(false);
      setFileName('');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      {/* Button to open the download dialog */}
      <button
        onClick={handleDownload}
        className="group relative flex items-center gap-2 px-4 py-2 bg-transparent border-2 border-blue-500 rounded-lg hover:bg-blue-50 transition-all duration-300 ease-out"
        title="Download PDF"
      >
        <FileDown 
          className="w-5 h-5 text-blue-500 transition-all duration-300 group-hover:rotate-12" 
        />
        <span className="text-blue-500 font-medium">Export</span>
        <span className="absolute inset-0 bg-blue-50 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out -z-10 rounded-lg" />
      </button>

      {showNameDialog && (
        // Modal dialog for entering the file name
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div 
            className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
            onClick={() => !isDownloading && setShowNameDialog(false)}
          />
          <div 
            className="relative bg-white rounded-xl p-6 w-96 shadow-xl"
            style={{
              animation: 'modalFloat 0.3s ease-out forwards'
            }}
          >
            <style>
              {`
                @keyframes modalFloat {
                  0% { opacity: 0; transform: scale(0.95) translateY(10px); }
                  100% { opacity: 1; transform: scale(1) translateY(0); }
                }
              `}
            </style>
            
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-blue-50 rounded-lg">
                <Download className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Save as PDF</h3>
                <p className="text-sm text-gray-500">Enter a name for your design</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Input field for the file name */}
              <div className="relative">
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="File name"
                  disabled={isDownloading}
                  className={`
                    w-full px-4 py-3 bg-gray-50 border-2 rounded-lg
                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                    outline-none transition-all duration-200
                    ${isDownloading ? 'opacity-50 cursor-not-allowed' : ''}
                  `}  
                  autoFocus
                />
                <span className="absolute right-3 top-3 text-sm text-gray-400">.pdf</span>
              </div>

              {/* Buttons for canceling or confirming the download */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => !isDownloading && setShowNameDialog(false)}
                  disabled={isDownloading}
                  className="px-4 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={generatePDF}
                  disabled={!fileName || isDownloading}
                  className={`
                    relative px-4 py-2.5 rounded-lg font-medium
                    transition-all duration-300 min-w-[120px]
                    flex items-center justify-center gap-2
                    ${isDownloading 
                      ? 'bg-green-500 text-white cursor-not-allowed' 
                      : fileName 
                        ? 'bg-blue-500 text-white hover:bg-blue-600' 
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }
                  `}
                >
                  {isDownloading ? (
                    // Indicate downloading status
                    <>
                      <Check className="w-5 h-5 animate-bounce" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      Save PDF
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PDFDownloadButton;
