import React from 'react';
import BackupSection from './BackupSection';
import RestoreSection from './RestoreSection';
import UpdateSection from './UpdateSection';

function Settings() {
  return (
    <div style={{ padding: 24 }}>
      <h2>การตั้งค่าและสำรองข้อมูล</h2>
      <BackupSection />
      <RestoreSection />
      <UpdateSection />
    </div>
  );
}

export default Settings;