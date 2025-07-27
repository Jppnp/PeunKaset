import React, { useState, useEffect } from 'react';
import Button from '../common/Button';

const UpdateSection = () => {
  const [updateStatus, setUpdateStatus] = useState({
    currentVersion: '1.0.0',
    checking: false,
    available: false,
    updateInfo: null,
    error: null
  });

  const [config, setConfig] = useState({
    autoCheck: true,
    autoDownload: false,
    autoInstall: false,
    allowPrerelease: false
  });

  const [githubToken, setGithubToken] = useState('');
  const [tokenStatus, setTokenStatus] = useState({ valid: null, checking: false });
  const [showTokenInput, setShowTokenInput] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // Load current status and config
      const [status, currentConfig] = await Promise.all([
        window.api.updateApi.getUpdateStatus(),
        window.api.updateApi.getConfig()
      ]);

      setUpdateStatus(prev => ({
        ...prev,
        currentVersion: status.currentVersion,
        available: status.updateInfo?.available || false,
        updateInfo: status.updateInfo
      }));

      setConfig(currentConfig);
    } catch (error) {
      console.error('Failed to load update data:', error);
    }
  };

  const handleCheckForUpdates = async () => {
    setUpdateStatus(prev => ({ ...prev, checking: true, error: null }));
    
    try {
      const updateInfo = await window.api.updateApi.checkForUpdates();
      setUpdateStatus(prev => ({
        ...prev,
        checking: false,
        available: updateInfo.available,
        updateInfo
      }));
    } catch (error) {
      setUpdateStatus(prev => ({
        ...prev,
        checking: false,
        error: error.message
      }));
    }
  };

  const handleConfigChange = async (key, value) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    
    try {
      await window.api.updateApi.setConfig(newConfig);
    } catch {
      console.error('Failed to save config');
      // Revert on error
      setConfig(config);
    }
  };

  const handleTokenValidation = async () => {
    if (!githubToken.trim()) {
      setTokenStatus({ valid: false, checking: false });
      return;
    }

    setTokenStatus({ valid: null, checking: true });
    
    try {
      const result = await window.api.updateApi.validateGitHubToken(githubToken);
      setTokenStatus({ valid: result.valid, checking: false });
      
      if (result.valid) {
        await window.api.updateApi.setGitHubToken(githubToken);
      }
    } catch {
      setTokenStatus({ valid: false, checking: false });
    }
  };

  const handleTestConnection = async () => {
    try {
      const result = await window.api.updateApi.checkGitHubConnection();
      if (result.connected) {
        alert(`เชื่อมต่อ GitHub สำเร็จ!\nRate Limit: ${result.rateLimit.remaining}/${result.rateLimit.limit}`);
      } else {
        alert(`ไม่สามารถเชื่อมต่อ GitHub ได้: ${result.error}`);
      }
    } catch (error) {
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
    }
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

  return (
    <div style={{ marginTop: '24px' }}>
      <h3 style={{ marginBottom: '16px', color: '#333' }}>การอัปเดตแอปพลิเคชัน</h3>
      
      {/* Current Version & Check */}
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '16px',
        borderRadius: '8px',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <div style={{ fontSize: '14px', color: '#666' }}>เวอร์ชันปัจจุบัน</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
              v{updateStatus.currentVersion}
            </div>
          </div>
          <Button
            onClick={handleCheckForUpdates}
            disabled={updateStatus.checking}
            style={{ minWidth: '120px' }}
          >
            {updateStatus.checking ? 'กำลังตรวจสอบ...' : 'ตรวจสอบอัปเดต'}
          </Button>
        </div>

        {updateStatus.available && updateStatus.updateInfo && (
          <div style={{
            backgroundColor: '#e8f5e8',
            border: '1px solid #4CAF50',
            padding: '12px',
            borderRadius: '4px',
            marginTop: '12px'
          }}>
            <div style={{ fontWeight: 'bold', color: '#2e7d32', marginBottom: '4px' }}>
              🎉 มีอัปเดตใหม่พร้อมใช้งาน!
            </div>
            <div style={{ fontSize: '14px', color: '#333' }}>
              เวอร์ชัน {updateStatus.updateInfo.latestVersion}
            </div>
            {updateStatus.updateInfo.publishedAt && (
              <div style={{ fontSize: '12px', color: '#666' }}>
                วันที่เผยแพร่: {formatDate(updateStatus.updateInfo.publishedAt)}
              </div>
            )}
          </div>
        )}

        {updateStatus.error && (
          <div style={{
            backgroundColor: '#ffebee',
            border: '1px solid #f44336',
            padding: '12px',
            borderRadius: '4px',
            marginTop: '12px',
            color: '#c62828',
            fontSize: '14px'
          }}>
            เกิดข้อผิดพลาด: {updateStatus.error}
          </div>
        )}
      </div>

      {/* Update Configuration */}
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '16px',
        borderRadius: '8px',
        marginBottom: '16px'
      }}>
        <h4 style={{ margin: '0 0 12px 0', color: '#333' }}>การตั้งค่าการอัปเดต</h4>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
            <input
              type="checkbox"
              checked={config.autoCheck}
              onChange={(e) => handleConfigChange('autoCheck', e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            ตรวจสอบอัปเดตอัตโนมัติ
          </label>
          
          <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
            <input
              type="checkbox"
              checked={config.autoDownload}
              onChange={(e) => handleConfigChange('autoDownload', e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            ดาวน์โหลดอัปเดตอัตโนมัติ
          </label>
          
          <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
            <input
              type="checkbox"
              checked={config.autoInstall}
              onChange={(e) => handleConfigChange('autoInstall', e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            ติดตั้งอัปเดตอัตโนมัติ
          </label>
          
          <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
            <input
              type="checkbox"
              checked={config.allowPrerelease}
              onChange={(e) => handleConfigChange('allowPrerelease', e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            รับอัปเดตเวอร์ชันทดสอบ (Pre-release)
          </label>
        </div>
      </div>

      {/* GitHub Token Configuration */}
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '16px',
        borderRadius: '8px',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h4 style={{ margin: 0, color: '#333' }}>การตั้งค่า GitHub Token</h4>
          <Button
            onClick={() => setShowTokenInput(!showTokenInput)}
            style={{ fontSize: '12px', padding: '4px 8px' }}
          >
            {showTokenInput ? 'ซ่อน' : 'ตั้งค่า'}
          </Button>
        </div>
        
        <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
          จำเป็นสำหรับการเข้าถึง Private Repository
        </div>

        {showTokenInput && (
          <div style={{ marginTop: '12px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                type="password"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                style={{
                  flex: 1,
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
              <Button
                onClick={handleTokenValidation}
                disabled={tokenStatus.checking}
                style={{ minWidth: '80px' }}
              >
                {tokenStatus.checking ? 'ตรวจสอบ...' : 'ตรวจสอบ'}
              </Button>
            </div>
            
            {tokenStatus.valid !== null && (
              <div style={{
                padding: '8px',
                borderRadius: '4px',
                fontSize: '12px',
                backgroundColor: tokenStatus.valid ? '#e8f5e8' : '#ffebee',
                color: tokenStatus.valid ? '#2e7d32' : '#c62828',
                border: `1px solid ${tokenStatus.valid ? '#4CAF50' : '#f44336'}`
              }}>
                {tokenStatus.valid ? '✓ Token ถูกต้องและใช้งานได้' : '✗ Token ไม่ถูกต้องหรือไม่มีสิทธิ์เข้าถึง'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Database & System Info */}
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '16px',
        borderRadius: '8px'
      }}>
        <h4 style={{ margin: '0 0 12px 0', color: '#333' }}>ข้อมูลระบบ</h4>
        
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button
            onClick={handleTestConnection}
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            ทดสอบการเชื่อมต่อ GitHub
          </Button>
          
          <Button
            onClick={async () => {
              try {
                const result = await window.api.updateApi.validateDatabase();
                alert(result.valid ? 'ฐานข้อมูลปกติ' : `ฐานข้อมูลมีปัญหา: ${result.error || 'ไม่ทราบสาเหตุ'}`);
              } catch (error) {
                alert(`เกิดข้อผิดพลาด: ${error.message}`);
              }
            }}
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            ตรวจสอบฐานข้อมูล
          </Button>
          
          <Button
            onClick={async () => {
              try {
                const result = await window.api.updateApi.createDatabaseBackup();
                alert(`สำรองข้อมูลสำเร็จ: ${result.backupPath}`);
              } catch (error) {
                alert(`เกิดข้อผิดพลาด: ${error.message}`);
              }
            }}
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            สำรองฐานข้อมูล
          </Button>
          
          <Button
            onClick={async () => {
              try {
                const version = await window.api.updateApi.getCurrentSchemaVersion();
                alert(`เวอร์ชันฐานข้อมูล: ${version}`);
              } catch (error) {
                alert(`เกิดข้อผิดพลาด: ${error.message}`);
              }
            }}
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            เวอร์ชันฐานข้อมูล
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UpdateSection;