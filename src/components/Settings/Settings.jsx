import React from 'react';
import BackupSection from './BackupSection';
import RestoreSection from './RestoreSection';

function Settings() {
  return (
    <div style={{ padding: 24 }}>
      <h2>การตั้งค่าและสำรองข้อมูล</h2>
      <BackupSection />
      <RestoreSection />
    </div>
  );
}

export default Settings; 