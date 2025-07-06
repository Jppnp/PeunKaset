import React, { useState } from 'react';
import Button from '../common/Button';

function BackupSection() {
  const [backupStatus, setBackupStatus] = useState('');

  const handleBackup = async () => {
    setBackupStatus('กำลังสำรองข้อมูล...');
    try {
      const result = await window.api.backupData();
      if (result.success) {
        setBackupStatus(`สำรองข้อมูลสำเร็จ: ${result.filePath}`);
      } else if (result.canceled) {
        setBackupStatus('ยกเลิกการสำรองข้อมูล');
      } else {
        setBackupStatus(`เกิดข้อผิดพลาด: ${result.error}`);
      }
    } catch (error) {
      setBackupStatus(`เกิดข้อผิดพลาด: ${error.message}`);
    }
  };

  return (
    <div style={{ marginBottom: 32 }}>
      <h3>สำรองข้อมูล</h3>
      <p>สร้างไฟล์สำรองข้อมูลเพื่อป้องกันการสูญเสียข้อมูล</p>
      <Button 
        onClick={handleBackup}
        variant="secondary"
        style={{ 
          fontSize: 16, 
          padding: '10px 20px'
        }}
      >
        สำรองข้อมูล
      </Button>
      {backupStatus && (
        <div style={{ marginTop: 10, padding: 10, backgroundColor: '#f0f0f0', borderRadius: 4 }}>
          {backupStatus}
        </div>
      )}
    </div>
  );
}

export default BackupSection; 