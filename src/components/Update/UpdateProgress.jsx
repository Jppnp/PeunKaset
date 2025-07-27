import React from 'react';

const UpdateProgress = ({ 
  progress, 
  isDownloading, 
  isInstalling, 
  isCompleted, 
  error, 
  onCancel, 
  onClose 
}) => {
  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatSpeed = (bytesPerSecond) => {
    if (!bytesPerSecond) return '0 B/s';
    return formatBytes(bytesPerSecond) + '/s';
  };

  const formatTime = (seconds) => {
    if (!seconds || seconds === Infinity) return 'กำลังคำนวณ...';
    if (seconds < 60) return `${Math.round(seconds)} วินาที`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes} นาที ${remainingSeconds} วินาที`;
  };

  const getProgressMessage = () => {
    if (error) return `เกิดข้อผิดพลาด: ${error}`;
    if (isCompleted) return 'อัปเดตเสร็จสมบูรณ์! กำลังเริ่มต้นใหม่...';
    if (progress?.message) return progress.message;
    if (isInstalling) return 'กำลังติดตั้งอัปเดต...';
    if (isDownloading) return 'กำลังดาวน์โหลดอัปเดต...';
    return 'กำลังเตรียมการอัปเดต...';
  };

  const getProgressPercentage = () => {
    if (error) return 0;
    if (isCompleted) return 100;
    return progress?.progress || 0;
  };

  const canCancel = () => {
    return !isCompleted && !error && (isDownloading || isInstalling);
  };

  const canClose = () => {
    return error || isCompleted || (!isDownloading && !isInstalling);
  };

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '450px',
      backgroundColor: '#fff',
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
      zIndex: 1001,
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: error ? '#f44336' : isCompleted ? '#4CAF50' : '#2196F3',
        color: 'white',
        padding: '16px',
        borderRadius: '8px 8px 0 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{
            width: '24px',
            height: '24px',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '12px',
            fontSize: '14px'
          }}>
            {error ? '!' : isCompleted ? '✓' : '↓'}
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
              {error ? 'เกิดข้อผิดพลาด' : isCompleted ? 'อัปเดตสำเร็จ' : 'กำลังอัปเดต'}
            </h3>
          </div>
        </div>
        {canClose() && (
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              opacity: 0.8
            }}
            onMouseOver={(e) => e.target.style.opacity = '1'}
            onMouseOut={(e) => e.target.style.opacity = '0.8'}
          >
            ×
          </button>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '24px' }}>
        {/* Progress Message */}
        <div style={{ 
          marginBottom: '16px',
          fontSize: '14px',
          color: error ? '#f44336' : '#333',
          textAlign: 'center'
        }}>
          {getProgressMessage()}
        </div>

        {/* Progress Bar */}
        {!error && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{
              width: '100%',
              height: '8px',
              backgroundColor: '#e0e0e0',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${getProgressPercentage()}%`,
                height: '100%',
                backgroundColor: isCompleted ? '#4CAF50' : '#2196F3',
                borderRadius: '4px',
                transition: 'width 0.3s ease'
              }} />
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '8px',
              fontSize: '12px',
              color: '#666'
            }}>
              <span>{Math.round(getProgressPercentage())}%</span>
              {progress?.totalBytes && (
                <span>
                  {formatBytes(progress.downloadedBytes || 0)} / {formatBytes(progress.totalBytes)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Download Details */}
        {isDownloading && progress && !error && (
          <div style={{
            backgroundColor: '#f5f5f5',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '16px',
            fontSize: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>ความเร็ว:</span>
              <span>{formatSpeed(progress.speed)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>เวลาที่เหลือ:</span>
              <span>{formatTime(progress.eta)}</span>
            </div>
          </div>
        )}

        {/* Installation Phases */}
        {isInstalling && progress && !error && (
          <div style={{
            backgroundColor: '#f5f5f5',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '16px',
            fontSize: '12px'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
              ขั้นตอนการติดตั้ง:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center',
                color: progress.phase === 'backup' ? '#2196F3' : '#999'
              }}>
                <span style={{ marginRight: '8px' }}>
                  {progress.phase === 'backup' ? '🔄' : '✓'}
                </span>
                สำรองข้อมูล
              </div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center',
                color: progress.phase === 'migrating' ? '#2196F3' : progress.phase === 'backup' ? '#999' : '#4CAF50'
              }}>
                <span style={{ marginRight: '8px' }}>
                  {progress.phase === 'migrating' ? '🔄' : progress.phase === 'backup' ? '⏳' : '✓'}
                </span>
                อัปเดตฐานข้อมูล
              </div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center',
                color: progress.phase === 'installing' ? '#2196F3' : ['backup', 'migrating'].includes(progress.phase) ? '#999' : '#4CAF50'
              }}>
                <span style={{ marginRight: '8px' }}>
                  {progress.phase === 'installing' ? '🔄' : ['backup', 'migrating'].includes(progress.phase) ? '⏳' : '✓'}
                </span>
                ติดตั้งไฟล์
              </div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center',
                color: progress.phase === 'cleanup' ? '#2196F3' : progress.phase === 'complete' ? '#4CAF50' : '#999'
              }}>
                <span style={{ marginRight: '8px' }}>
                  {progress.phase === 'cleanup' ? '🔄' : progress.phase === 'complete' ? '✓' : '⏳'}
                </span>
                ทำความสะอาด
              </div>
            </div>
          </div>
        )}

        {/* Error Details */}
        {error && (
          <div style={{
            backgroundColor: '#ffebee',
            border: '1px solid #ffcdd2',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '16px',
            fontSize: '12px',
            color: '#c62828'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
              รายละเอียดข้อผิดพลาด:
            </div>
            <div>{error}</div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ 
          display: 'flex', 
          gap: '8px',
          justifyContent: 'flex-end'
        }}>
          {canCancel() && (
            <button
              onClick={onCancel}
              style={{
                padding: '8px 16px',
                border: '1px solid #ddd',
                backgroundColor: '#f5f5f5',
                color: '#666',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#e0e0e0';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = '#f5f5f5';
              }}
            >
              ยกเลิก
            </button>
          )}
          
          {canClose() && (
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px',
                border: 'none',
                backgroundColor: error ? '#f44336' : '#4CAF50',
                color: 'white',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = error ? '#d32f2f' : '#45a049';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = error ? '#f44336' : '#4CAF50';
              }}
            >
              {error ? 'ปิด' : 'ตกลง'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpdateProgress;