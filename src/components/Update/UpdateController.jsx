import React, { useState, useEffect } from 'react';
import UpdateNotification from './UpdateNotification';
import UpdateProgress from './UpdateProgress';

const UpdateController = () => {
  const [updateState, setUpdateState] = useState({
    available: false,
    downloading: false,
    installing: false,
    completed: false,
    error: null,
    updateInfo: null,
    progress: null
  });

  const [showNotification, setShowNotification] = useState(false);
  const [showProgress, setShowProgress] = useState(false);

  useEffect(() => {
    // Set up event listeners
    const setupListeners = () => {
      // Update available
      window.api.updateApi.onUpdateAvailable((updateInfo) => {
        setUpdateState(prev => ({
          ...prev,
          available: true,
          updateInfo,
          error: null
        }));
        setShowNotification(true);
      });

      // Download progress
      window.api.updateApi.onDownloadProgress((progress) => {
        setUpdateState(prev => ({
          ...prev,
          downloading: true,
          progress
        }));
        setShowProgress(true);
      });

      // Download complete
      window.api.updateApi.onDownloadComplete(() => {
        setUpdateState(prev => ({
          ...prev,
          downloading: false
        }));
      });

      // Install progress
      window.api.updateApi.onInstallProgress((progress) => {
        setUpdateState(prev => ({
          ...prev,
          installing: true,
          progress
        }));
        setShowProgress(true);
      });

      // Update complete
      window.api.updateApi.onUpdateComplete(() => {
        setUpdateState(prev => ({
          ...prev,
          completed: true,
          installing: false,
          progress: { ...prev.progress, progress: 100, message: 'อัปเดตเสร็จสมบูรณ์' }
        }));
        
        // Hide progress after a delay
        setTimeout(() => {
          setShowProgress(false);
          setUpdateState(prev => ({
            ...prev,
            completed: false,
            available: false,
            updateInfo: null
          }));
        }, 3000);
      });

      // Update error
      window.api.updateApi.onUpdateError((error) => {
        setUpdateState(prev => ({
          ...prev,
          error: error.error,
          downloading: false,
          installing: false
        }));
        setShowProgress(false);
      });

      // Update cancelled
      window.api.updateApi.onUpdateCancelled(() => {
        setUpdateState(prev => ({
          ...prev,
          downloading: false,
          installing: false,
          error: null
        }));
        setShowProgress(false);
        setShowNotification(false);
      });

      // State changed
      window.api.updateApi.onStateChanged((stateInfo) => {
        console.log('Update state changed:', stateInfo);
      });
    };

    setupListeners();

    // Check for updates on mount
    checkForUpdates();

    // Cleanup listeners on unmount
    return () => {
      window.api.updateApi.removeAllListeners();
    };
  }, []);

  const checkForUpdates = async () => {
    try {
      await window.api.updateApi.checkForUpdates();
    } catch (error) {
      console.error('Failed to check for updates:', error);
    }
  };

  const handleUpdateStart = async () => {
    try {
      setShowNotification(false);
      setShowProgress(true);
      setUpdateState(prev => ({
        ...prev,
        downloading: true,
        error: null
      }));

      await window.api.updateApi.downloadAndInstall();
    } catch (error) {
      console.error('Update failed:', error);
      setUpdateState(prev => ({
        ...prev,
        error: error.message,
        downloading: false,
        installing: false
      }));
    }
  };

  const handleUpdateCancel = async () => {
    try {
      await window.api.updateApi.cancelUpdate();
      setShowProgress(false);
      setShowNotification(false);
    } catch (error) {
      console.error('Failed to cancel update:', error);
    }
  };

  const handleNotificationDismiss = () => {
    setShowNotification(false);
  };

  const handleProgressClose = () => {
    if (!updateState.downloading && !updateState.installing) {
      setShowProgress(false);
    }
  };

  return (
    <>
      {showNotification && updateState.available && (
        <UpdateNotification
          updateInfo={updateState.updateInfo}
          onUpdateStart={handleUpdateStart}
          onDismiss={handleNotificationDismiss}
        />
      )}
      
      {showProgress && (updateState.downloading || updateState.installing || updateState.completed) && (
        <UpdateProgress
          progress={updateState.progress}
          isDownloading={updateState.downloading}
          isInstalling={updateState.installing}
          isCompleted={updateState.completed}
          error={updateState.error}
          onCancel={handleUpdateCancel}
          onClose={handleProgressClose}
        />
      )}
    </>
  );
};

export default UpdateController;