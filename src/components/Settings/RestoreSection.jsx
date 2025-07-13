import React, { useState } from 'react';
import Button from '../common/Button';
import Toast from '../common/Toast';
import ConfirmModal from '../common/ConfirmModal';

function RestoreSection() {
  const [restoreStatus, setRestoreStatus] = useState('');
  const [notification, setNotification] = useState('');
  const [confirm, setConfirm] = useState({ open: false, message: '', onConfirm: null });

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3000);
  };

  const handleRestore = async () => {
    setConfirm({
      open: true,
      message: 'การกู้คืนข้อมูลจะเขียนทับข้อมูลปัจจุบันทั้งหมด\nคุณแน่ใจหรือไม่?',
      onConfirm: async () => {
        setConfirm({ ...confirm, open: false });
        setRestoreStatus('กำลังกู้คืนข้อมูล...');
        try {
          const result = await window.api.restoreData();
          if (result.success) {
            setRestoreStatus(`กู้คืนข้อมูลสำเร็จ: ${result.filePath}\nกรุณารีสตาร์ทแอปพลิเคชัน`);
            showNotification('กู้คืนข้อมูลสำเร็จ กำลังรีโหลด...');
            setTimeout(() => {
              window.location.reload();
            }, 3000);
          } else if (result.canceled) {
            setRestoreStatus('ยกเลิกการกู้คืนข้อมูล');
            showNotification('ยกเลิกการกู้คืนข้อมูล');
          } else {
            setRestoreStatus(`เกิดข้อผิดพลาด: ${result.error}`);
            showNotification('เกิดข้อผิดพลาด: ' + result.error);
          }
        } catch (error) {
          setRestoreStatus(`เกิดข้อผิดพลาด: ${error.message}`);
          showNotification('เกิดข้อผิดพลาด: ' + error.message);
        }
      }
    });
  };

  return (
    <div style={{ marginBottom: 32 }}>
      <Toast message={notification} onClose={() => setNotification('')} />
      <ConfirmModal
        open={confirm.open}
        message={confirm.message}
        onConfirm={confirm.onConfirm}
        onCancel={() => setConfirm({ ...confirm, open: false })}
      />
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