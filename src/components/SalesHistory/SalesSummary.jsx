import React from 'react';
import Button from '../common/Button';
import { formatCurrency } from '../common/Button';

function SalesSummary({ sales, onRefresh, loading }) {
  const totalRevenue = sales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);

  return (
    <div style={{ marginBottom: 24, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
      <h3>สรุปยอดรวม</h3>
      <p>จำนวนการขายทั้งหมด: {sales.length} รายการ</p>
      <p>ยอดขายรวม: {formatCurrency(totalRevenue)} บาท</p>
      <Button onClick={onRefresh} disabled={loading}>
        {loading ? 'กำลังโหลด...' : 'รีเฟรช'}
      </Button>
    </div>
  );
}

export default SalesSummary; 