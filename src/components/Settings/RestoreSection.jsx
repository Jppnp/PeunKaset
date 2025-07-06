import React, { useState } from 'react';
import Button from '../common/Button';

function RestoreSection() {
  const [restoreStatus, setRestoreStatus] = useState('');

  const handleRestore = async () => {
    if (!window.confirm('การกู้คืนข้อมูลจะเขียนทับข้อมูลปัจจุบันทั้งหมด\nคุณแน่ใจหรือไม่?')) {
      return;
    }

    setRestoreStatus('กำลังกู้คืนข้อมูล...');
    try {
      const result = await window.api.restoreData();
      if (result.success) {
        setRestoreStatus(`กู้คืนข้อมูลสำเร็จ: ${result.filePath}\nกรุณารีสตาร์ทแอปพลิเคชัน`);
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else if (result.canceled) {
        setRestoreStatus('ยกเลิกการกู้คืนข้อมูล');
      } else {
        setRestoreStatus(`เกิดข้อผิดพลาด: ${result.error}`);
      }
    } catch (error) {
      setRestoreStatus(`เกิดข้อผิดพลาด: ${error.message}`);
    }
  };

  return (
    <div style={{ marginBottom: 32 }}>
      <h3>กู้คืนข้อมูล</h3>
      <p>กู้คืนข้อมูลจากไฟล์สำรอง (จะเขียนทับข้อมูลปัจจุบัน)</p>
      <Button 
        onClick={handleRestore}
        variant="warning"
        style={{ 
          fontSize: 16, 
          padding: '10px 20px'
        }}
      >
        กู้คืนข้อมูล
      </Button>
      {restoreStatus && (
        <div style={{ marginTop: 10, padding: 10, backgroundColor: '#f0f0f0', borderRadius: 4 }}>
          {restoreStatus}
        </div>
      )}
    </div>
  );
}

export default RestoreSection; 