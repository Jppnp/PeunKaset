import React from 'react';

const UpdateNotification = ({ updateInfo, onUpdateStart, onDismiss }) => {
  if (!updateInfo) return null;

  const formatFileSize = (bytes) => {
    if (!bytes) return 'ไม่ทราบขนาด';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const parseReleaseNotes = (notes) => {
    if (!notes) return [];
    
    // Simple parsing for markdown-style release notes
    const lines = notes.split('\n').filter(line => line.trim());
    const features = [];
    const fixes = [];
    const others = [];

    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const content = trimmed.substring(2);
        if (content.toLowerCase().includes('fix') || content.toLowerCase().includes('แก้ไข')) {
          fixes.push(content);
        } else if (content.toLowerCase().includes('add') || content.toLowerCase().includes('เพิ่ม')) {
          features.push(content);
        } else {
          others.push(content);
        }
      } else if (trimmed && !trimmed.startsWith('#')) {
        others.push(trimmed);
      }
    });

    return { features, fixes, others };
  };

  const releaseNotes = parseReleaseNotes(updateInfo.releaseNotes);

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      width: '400px',
      backgroundColor: '#fff',
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      zIndex: 1000,
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#4CAF50',
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
            ↑
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
              อัปเดตใหม่พร้อมใช้งาน
            </h3>
            <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>
              เวอร์ชัน {updateInfo.latestVersion}
            </p>
          </div>
        </div>
        <button
          onClick={onDismiss}
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
      </div>

      {/* Content */}
      <div style={{ padding: '16px' }}>
        {/* Version Info */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginBottom: '8px',
            fontSize: '14px',
            color: '#666'
          }}>
            <span>เวอร์ชันปัจจุบัน: {updateInfo.currentVersion}</span>
            <span>ขนาดไฟล์: {formatFileSize(updateInfo.fileSize)}</span>
          </div>
          {updateInfo.publishedAt && (
            <div style={{ fontSize: '12px', color: '#888' }}>
              วันที่เผยแพร่: {formatDate(updateInfo.publishedAt)}
            </div>
          )}
        </div>

        {/* Release Notes */}
        {(releaseNotes.features.length > 0 || releaseNotes.fixes.length > 0 || releaseNotes.others.length > 0) && (
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ 
              margin: '0 0 12px 0', 
              fontSize: '14px', 
              fontWeight: 'bold',
              color: '#333'
            }}>
              รายละเอียดการอัปเดต:
            </h4>
            
            <div style={{ 
              maxHeight: '150px', 
              overflowY: 'auto',
              fontSize: '13px',
              lineHeight: '1.4'
            }}>
              {releaseNotes.features.length > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontWeight: 'bold', color: '#4CAF50', marginBottom: '4px' }}>
                    ✨ ฟีเจอร์ใหม่:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '16px' }}>
                    {releaseNotes.features.map((feature, index) => (
                      <li key={index} style={{ marginBottom: '2px' }}>{feature}</li>
                    ))}
                  </ul>
                </div>
              )}

              {releaseNotes.fixes.length > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontWeight: 'bold', color: '#FF9800', marginBottom: '4px' }}>
                    🔧 การแก้ไข:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '16px' }}>
                    {releaseNotes.fixes.map((fix, index) => (
                      <li key={index} style={{ marginBottom: '2px' }}>{fix}</li>
                    ))}
                  </ul>
                </div>
              )}

              {releaseNotes.others.length > 0 && (
                <div>
                  <div style={{ fontWeight: 'bold', color: '#2196F3', marginBottom: '4px' }}>
                    📝 อื่นๆ:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '16px' }}>
                    {releaseNotes.others.map((other, index) => (
                      <li key={index} style={{ marginBottom: '2px' }}>{other}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ 
          display: 'flex', 
          gap: '8px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onDismiss}
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
            ภายหลัง
          </button>
          <button
            onClick={onUpdateStart}
            style={{
              padding: '8px 16px',
              border: 'none',
              backgroundColor: '#4CAF50',
              color: 'white',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#45a049';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#4CAF50';
            }}
          >
            อัปเดตเลย
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateNotification;