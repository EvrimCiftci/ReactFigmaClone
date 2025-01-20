  import React, { useEffect, useRef, useState } from 'react';
  import { fabric } from 'fabric';
  import ShapeToolbar from './editorComponents/ShapeToolbar';
  import PropertiesPanel from './editorComponents/PropertiesPanel';
  import ObjectLists from './editorComponents/ObjectLists';
  import SyncButton from './SyncButton';
  import PDFDownloadButton from './PDFDownloadButton';

  // Custom IFrame class implementation
  fabric.IFrame = fabric.util.createClass(fabric.Rect, {
    type: 'iframe',
    initialize: function(options) {
      options || (options = {});
      this.callSuper('initialize', options);
      this.set('src', options.src || '');
      this.set('iframeElement', null);
    },

    toObject: function() {
      return fabric.util.object.extend(this.callSuper('toObject'), {
        src: this.get('src')
      });
    },

    _render: function(ctx) {
      this.callSuper('_render', ctx);
      if (!this.iframeElement) {
        const iframe = document.createElement('iframe');
        iframe.src = this.src;
        iframe.style.position = 'absolute';
        iframe.style.width = `${this.width * this.scaleX}px`;
        iframe.style.height = `${this.height * this.scaleY}px`;
        iframe.style.border = 'none';
        iframe.style.pointerEvents = 'none';
        iframe.style.transformOrigin = 'top left';
        this.canvas.wrapperEl.appendChild(iframe);
        this.iframeElement = iframe;
      }
      this.updateIFramePosition();
    },

    updateIFramePosition: function() {
      if (this.iframeElement) {
        const zoom = this.canvas.getZoom();
        const bound = this.getBoundingRect();
        const left = bound.left;
        const top = bound.top;
        
        this.iframeElement.style.left = `${left}px`;
        this.iframeElement.style.top = `${top}px`;
        this.iframeElement.style.width = `${this.width * this.scaleX * zoom}px`;
        this.iframeElement.style.height = `${this.height * this.scaleY * zoom}px`;
        this.iframeElement.style.transform = `rotate(${this.angle}deg)`;
        
        const objectIndex = this.canvas.getObjects().indexOf(this);
        this.iframeElement.style.zIndex = objectIndex + 1;
        
        this.iframeElement.style.pointerEvents = this.selected ? 'auto' : 'none';
      }
    }
  });

  export default function CanvasEditor() {
    const canvasRef = useRef(null);
    const fabricCanvasRef = useRef(null);
    const [selectedObject, setSelectedObject] = useState(null);
    const [updateTrigger, setUpdateTrigger] = useState(0);
    const [zIndexUpdate, setZIndexUpdate] = useState(0);
    const [currentDisplayId, setCurrentDisplayId] = useState(null);
    const [canvasContent, setCanvasContent] = useState(null);
    const [objects, setObjects] = useState([]);
    const [shapeCounters, setShapeCounters] = useState({
      circle: 1,
      rectangle: 1,
      triangle: 1,
      text: 1,
      star: 1,
      hexagon: 1,
      image: 1,
      iframe: 1,
      line: 1,
    });

    useEffect(() => {
      const displayInfo = localStorage.getItem('displayInfo');
      if (displayInfo) {
        const { id } = JSON.parse(displayInfo);
        setCurrentDisplayId(id);
      }
    }, []);

    const updateCanvasContent = () => {
      if (!fabricCanvasRef.current) return;
      const json = fabricCanvasRef.current.toJSON([
        'id',
        'name',
        'src',
        'selectable',
        'hasControls'
      ]);
      setCanvasContent(json);
    };

    useEffect(() => {
      if (!canvasRef.current || fabricCanvasRef.current) return;
      
      fabricCanvasRef.current = new fabric.Canvas(canvasRef.current, {
        width: window.innerWidth - 320,
        height: window.innerHeight - 100,
        backgroundColor: '#ffffff',
        selection: true
      });

      const canvas = fabricCanvasRef.current;

      canvas.on('object:modified', () => {
        updateCanvasContent();
        setUpdateTrigger(prev => prev + 1);
        canvas.getObjects().forEach(obj => {
          if (obj.type === 'iframe') {
            obj.updateIFramePosition();
          }
        });
      });

      canvas.on({
        'object:moving': (e) => {
          if (e.target.type === 'iframe') {
            e.target.updateIFramePosition();
          }
        },
        'object:scaling': (e) => {
          if (e.target.type === 'iframe') {
            e.target.updateIFramePosition();
          }
        },
        'object:rotating': (e) => {
          if (e.target.type === 'iframe') {
            e.target.updateIFramePosition();
          }
        },
        'selection:created': (e) => {
          setSelectedObject(e.selected[0]);
          if (e.selected[0].type === 'iframe') {
            e.selected[0].updateIFramePosition();
          }
        },
        'selection:updated': (e) => {
          setSelectedObject(e.selected[0]);
          if (e.selected[0].type === 'iframe') {
            e.selected[0].updateIFramePosition();
          }
        },
        'selection:cleared': () => {
          if (selectedObject && selectedObject.type === 'iframe') {
            selectedObject.updateIFramePosition();
          }
          setSelectedObject(null);
        }
      });

      const handleResize = () => {
        canvas.setDimensions({
          width: window.innerWidth - 320,
          height: window.innerHeight - 100
        });
        canvas.renderAll();
        canvas.getObjects().forEach(obj => {
          if (obj.type === 'iframe') {
            obj.updateIFramePosition();
          }
        });
      };

      window.addEventListener('resize', handleResize);

      return () => {
        canvas.getObjects().forEach(obj => {
          if (obj.type === 'iframe' && obj.iframeElement) {
            obj.iframeElement.remove();
          }
        });
        canvas.dispose();
        fabricCanvasRef.current = null;
        window.removeEventListener('resize', handleResize);
      };
    }, []);

    const createStarPath = (points, outer, inner) => {
      let path = 'M ';
      for (let i = 0; i < points * 2; i++) {
        const radius = i % 2 === 0 ? outer : inner;
        const angle = (i * Math.PI) / points - Math.PI / 2;
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);
        path += `${x},${y} ${i === 0 ? 'L' : ''} `;
      }
      return path + 'Z';
    };

    const createHexagonPath = (size) => {
      const points = [];
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        const x = size * Math.cos(angle);
        const y = size * Math.sin(angle);
        points.push(`${x},${y}`);
      }
      return `M ${points.join(' L ')} Z`;
    };

    const handleAddShape = (type, imageSrc = null) => {
      if (!fabricCanvasRef.current) return;
      
      const shapeName = `${type} - ${shapeCounters[type]}`;
      const objectId = `${type}-${shapeCounters[type]}`;
      let fabricObject;
      
      const commonProps = {
        left: 100,
        top: 100,
        fill: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
        stroke: '#000000',
        strokeWidth: 2,
        selectable: true,
        hasControls: true,
        id: objectId,
        name: shapeName,
      };

      switch (type) {
        case 'line':
          fabricObject = new fabric.Line([50, 50, 200, 50], {
            ...commonProps,
            fill: 'black',
            stroke: 'black',
            strokeWidth: 2,
          });
          break;
        case 'iframe':
          const iframeUrl = prompt('Enter iframe URL:', 'https://example.com');
          if (iframeUrl) {
            fabricObject = new fabric.IFrame({
              ...commonProps,
              width: 300,
              height: 200,
              src: iframeUrl,
              fill: 'transparent',
            });
          }
          break;
        case 'rectangle':
          fabricObject = new fabric.Rect({
            ...commonProps,
            width: 100,
            height: 100,
          });
          break;
        case 'circle':
          fabricObject = new fabric.Circle({
            ...commonProps,
            radius: 50,
          });
          break;
        case 'triangle':
          fabricObject = new fabric.Triangle({
            ...commonProps,
            width: 100,
            height: 100,
          });
          break;
        case 'text':
          fabricObject = new fabric.IText('Edit me', {
            ...commonProps,
            fontSize: 24,
          });
          break;
        case 'star':
          const path = createStarPath(5, 50, 25);
          fabricObject = new fabric.Path(path, {
            ...commonProps,
          });
          break;
        case 'hexagon':
          fabricObject = new fabric.Path(createHexagonPath(50), {
            ...commonProps,
          });
          break;
        case 'image':
          if (imageSrc) {
            fabric.Image.fromURL(imageSrc, (img) => {
              img.set({
                ...commonProps,
                scaleX: 0.5,
                scaleY: 0.5,
              });
              fabricCanvasRef.current.add(img);
              fabricCanvasRef.current.setActiveObject(img);
              setSelectedObject(img);
              setObjects((prevObjects) => [...prevObjects, img]);
              updateCanvasContent();
              fabricCanvasRef.current.renderAll();
            });
            return;
          }
          break;
      }

      if (fabricObject) {
        fabricCanvasRef.current.add(fabricObject);
        fabricCanvasRef.current.setActiveObject(fabricObject);
        setSelectedObject(fabricObject);
        setObjects((prevObjects) => [...prevObjects, fabricObject]);
        fabricCanvasRef.current.renderAll();
        updateCanvasContent();
        setShapeCounters(prev => ({
          ...prev,
          [type]: prev[type] + 1
        }));
      }
    };

    const handlePropertyUpdate = (updates) => {
      if (!selectedObject || !fabricCanvasRef.current) return;
      
      selectedObject.set(updates);
      if (selectedObject.type === 'iframe') {
        selectedObject.updateIFramePosition();
      }
      selectedObject.setCoords();
      fabricCanvasRef.current.renderAll();
      updateCanvasContent();
      setUpdateTrigger(prev => prev + 1);
    };

    const handleDelete = () => {
      if (!selectedObject || !fabricCanvasRef.current) return;
      
      if (selectedObject.type === 'iframe' && selectedObject.iframeElement) {
        selectedObject.iframeElement.remove();
      }
      fabricCanvasRef.current.remove(selectedObject);
      setSelectedObject(null);
      setObjects(prevObjects => prevObjects.filter(obj => obj !== selectedObject));
      updateCanvasContent();
      fabricCanvasRef.current.renderAll();
    };

    const handleClone = () => {
      if (!selectedObject || !fabricCanvasRef.current) return;
      
      selectedObject.clone((cloned) => {
        cloned.set({
          left: selectedObject.left + 20,
          top: selectedObject.top + 20,
          name: `${selectedObject.name} (Copy)`,
        });
        fabricCanvasRef.current.add(cloned);
        fabricCanvasRef.current.setActiveObject(cloned);
        setSelectedObject(cloned);
        setObjects(prevObjects => [...prevObjects, cloned]);
        updateCanvasContent();
        fabricCanvasRef.current.renderAll();
      });
    };

    const handleBringForward = () => {
      if (!selectedObject || !fabricCanvasRef.current) return;
      
      fabricCanvasRef.current.bringForward(selectedObject);
      if (selectedObject.type === 'iframe') {
        fabricCanvasRef.current.getObjects().forEach(obj => {
          if (obj.type === 'iframe') {
            obj.updateIFramePosition();
          }
        });
      }
      fabricCanvasRef.current.requestRenderAll();
      updateCanvasContent();
      setUpdateTrigger(prev => prev + 1);
      setZIndexUpdate(prev => prev + 1);
    };

    const handleSendBackward = () => {
      if (!selectedObject || !fabricCanvasRef.current) return;
      
      fabricCanvasRef.current.sendBackwards(selectedObject);
      if (selectedObject.type === 'iframe') {
        fabricCanvasRef.current.getObjects().forEach(obj => {
          if (obj.type === 'iframe') {
            obj.updateIFramePosition();
          }
        });
      }
      fabricCanvasRef.current.requestRenderAll();
      updateCanvasContent();
      setUpdateTrigger(prev => prev + 1);
      setZIndexUpdate(prev => prev + 1);
    };

    const handleObjectClick = (object) => {
      if (!fabricCanvasRef.current) return;
      
      fabricCanvasRef.current.setActiveObject(object);
      setSelectedObject(object);
      fabricCanvasRef.current.renderAll();
    };

    return (
      <div className="flex flex-col h-full">
        <div className="w-full flex flex-row justify-between border-b border-gray-200">
          <ShapeToolbar onAddShape={handleAddShape} />
          <SyncButton 
            displayId={currentDisplayId} 
            content={canvasContent}
            onSync={() => updateCanvasContent()}
          />
          <PDFDownloadButton fabricCanvas={fabricCanvasRef.current} />
        </div>
        <div className="flex-1 relative h-full overflow-hidden">
          <canvas ref={canvasRef} className="touch-none" />
          
          {selectedObject && (
            <div className="absolute left-4 top-4 bg-white border border-gray-200 rounded-md shadow-sm p-2 z-[1000]">
              <span className="text-sm font-medium text-gray-700">
                {selectedObject.name}
              </span>
            </div>
          )}
          
          {selectedObject && (
            <div className="fixed right-4 top-20 z-[1000] w-80">
            <PropertiesPanel
              key={`${updateTrigger}-${zIndexUpdate}`} 
              element={selectedObject}  
              onUpdate={handlePropertyUpdate}
              onDelete={handleDelete}
              onClone={handleClone}
              onBringForward={handleBringForward}
              onSendBackward={handleSendBackward}
            />
          </div>
        )}
      </div>
      <ObjectLists objects={objects} onObjectClick={handleObjectClick} />
    </div>
  );
  }