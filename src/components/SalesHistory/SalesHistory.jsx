import React, { useState, useEffect } from 'react';
import SalesSummary from './SalesSummary';
import SalesList from './SalesList';
import SaleDetails from './SaleDetails';
import Toast from '../common/Toast';
import ConfirmModal from '../common/ConfirmModal';
import { getTodayDate } from '../../utils/formatters';

const PAGE_SIZE = 10;

function SalesHistory() {
  const [sales, setSales] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);
  const [saleDetails, setSaleDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('day'); // 'all' | 'day' | 'month'
  const [filterValue, setFilterValue] = useState(getTodayDate());
  const [exporting, setExporting] = useState(false);
  const [page, setPage] = useState(1);
  const [notification, setNotification] = useState('');
  const [confirm, setConfirm] = useState({ open: false, message: '', onConfirm: null });

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3000);
  };

  const loadSalesHistory = async () => {
    setLoading(true);
    try {
      let params = {}; // Remove limit to show all orders
      if (filterType === 'day') params = { filterType: 'day', filterValue };
      else if (filterType === 'month') params = { filterType: 'month', filterValue };
      const salesData = await window.api.getSalesHistory(params);
      setSales(salesData);
      setPage(1);
    } catch (error) {
      showNotification('เกิดข้อผิดพลาดในการโหลดประวัติการขาย: ' + error.message);
    }
    setLoading(false);
  };

  const loadSaleDetails = async (saleId) => {
    try {
      const details = await window.api.getSaleDetails(saleId);
      setSaleDetails(details);
      setSelectedSale(saleId);
    } catch (error) {
      showNotification('เกิดข้อผิดพลาดในการโหลดรายละเอียด: ' + error.message);
    }
  };

  const handlePreviewReceipt = async (sale) => {
    try {
      const details = await window.api.getSaleDetails(sale.id);
      const saleData = {
        saleId: sale.id,
        totalAmount: sale.total_amount,
        saleDate: sale.date,
        remark: sale.remark || ''
      };
      const cartItems = details.map(item => ({
        id: item.id,
        name: item.product_name,
        qty: item.quantity,
        price: item.sale_price ?? item.price
      }));
      window.api.previewReceipt(saleData, cartItems);
    } catch (error) {
      showNotification('เกิดข้อผิดพลาดในการแสดงตัวอย่างใบเสร็จ: ' + error.message);
    }
  };

  const handleExport = async () => {
    if (!filterValue || filterType !== 'month') {
      showNotification('กรุณาเลือกเดือนที่ต้องการส่งออก');
      return;
    }
    setExporting(true);
    try {
      const result = await window.api.exportSalesCSV({ month: filterValue });
      showNotification(result.message);
    } catch (error) {
      showNotification('เกิดข้อผิดพลาดในการส่งออก: ' + error.message);
    }
    setExporting(false);
  };

  // Use confirm modal for delete sale
  const handleDeleteSale = (saleId) => {
    setConfirm({
      open: true,
      message: 'คุณแน่ใจหรือไม่ว่าต้องการลบรายการขายนี้?',
      onConfirm: async () => {
        setConfirm({ ...confirm, open: false });
        try {
          await window.api.deleteSale(saleId);
          loadSalesHistory();
          setSaleDetails([]);
          setSelectedSale(null);
          showNotification('ลบรายการขายสำเร็จ');
        } catch (error) {
          showNotification('เกิดข้อผิดพลาดในการลบ: ' + error.message);
        }
      }
    });
  };

  // Use confirm modal for delete sale item
  const handleDeleteSaleItem = (saleItemId, saleId) => {
    setConfirm({
      open: true,
      message: 'คุณแน่ใจหรือไม่ว่าต้องการลบสินค้านี้ออกจากรายการขาย?',
      onConfirm: async () => {
        setConfirm({ ...confirm, open: false });
        try {
          await window.api.deleteSaleItem(saleItemId);
          if (saleId) loadSaleDetails(saleId);
          loadSalesHistory();
          showNotification('ลบสินค้าสำเร็จ');
        } catch (error) {
          showNotification('เกิดข้อผิดพลาดในการลบสินค้า: ' + error.message);
        }
      }
    });
  };

  useEffect(() => {
    loadSalesHistory();
    // eslint-disable-next-line
  }, [filterType, filterValue]);

  // Pagination logic
  const totalPages = Math.ceil(sales.length / PAGE_SIZE);
  const paginatedSales = sales.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div style={{ padding: 24 }}>
      <Toast message={notification} onClose={() => setNotification('')} />
      <ConfirmModal
        open={confirm.open}
        message={confirm.message}
        onConfirm={confirm.onConfirm}
        onCancel={() => setConfirm({ ...confirm, open: false })}
      />
      <h2>ประวัติการขาย</h2>
      <div style={{ marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
        <label>กรอง:</label>
        <select value={filterType} onChange={e => { setFilterType(e.target.value); setFilterValue(''); }}>
          <option value="all">ทั้งหมด</option>
          <option value="day">รายวัน</option>
          <option value="month">รายเดือน</option>
        </select>
        {filterType === 'day' && (
          <input type="date" value={filterValue} onChange={e => setFilterValue(e.target.value)} />
        )}
        {filterType === 'month' && (
          <input type="month" value={filterValue} onChange={e => setFilterValue(e.target.value)} />
        )}
        {filterType === 'month' && (
          <button onClick={handleExport} disabled={exporting} style={{ marginLeft: 16 }}>
            {exporting ? 'กำลังส่งออก...' : 'ส่งออก CSV'}
          </button>
        )}
      </div>
      <SalesSummary 
        sales={sales} 
        onRefresh={loadSalesHistory} 
        loading={loading} 
      />
      <div style={{ display: 'flex', gap: 24 }}>
        <SalesList
          sales={paginatedSales}
          selectedSale={selectedSale}
          onSelectSale={loadSaleDetails}
          onPreviewReceipt={handlePreviewReceipt}
          onDeleteSale={handleDeleteSale}
        />
        <SaleDetails
          saleDetails={saleDetails}
          saleId={selectedSale}
          onDeleteSaleItem={handleDeleteSaleItem}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16, gap: 8 }}>
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>&lt; ก่อนหน้า</button>
        <span>หน้า {page} / {totalPages}</span>
        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>&gt; ถัดไป</button>
      </div>
    </div>
  );
}

export default SalesHistory; 