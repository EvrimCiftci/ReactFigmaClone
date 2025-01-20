import React, { useState, useEffect } from 'react';
import { enhancedSyncService } from '../back-end/services/syncService';
import { RiLoader3Fill} from "react-icons/ri";  
import { CiWifiOff } from "react-icons/ci";
import {FaCircleXmark} from "react-icons/fa6";
import {FaRegCheckCircle} from "react-icons/fa";


const SyncButton = ({ displayId, content }) => {
  const [syncStatus, setSyncStatus] = useState('idle');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSync = async () => {
    if (!displayId || !content) return;
    
    setSyncStatus('syncing');
    try {
      await enhancedSyncService.queueContent(displayId, content);
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 2000);
    } catch (error) {
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 2000);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleSync}
        disabled={syncStatus === 'syncing'}
        className={`flex items-center gap-2 px-4 py-2 rounded-md ${
          !isOnline ? 'bg-gray-300' : 'bg-blue-500 hover:bg-blue-600'
        } text-white transition-colors`}
      >
        {syncStatus === 'syncing' && (
          <RiLoader3Fill className="h-4 w-4 animate-spin"  />
        )}
        {syncStatus === 'success' && (
          <FaRegCheckCircle className="h-4 w-4 text-green-500"/>
        )}
        {syncStatus === 'error' && (
          <FaCircleXmark className="h-4 w-4 text-red-500" />
        )}
        {syncStatus === 'syncing' ? 'Syncing...' : 'Sync Content'}
      </button>
      
      {!isOnline && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <CiWifiOff className="h-4 w-4"/>
          <span>Offline Mode</span>
        </div>
      )}
    </div>
  );
};

export default SyncButton;