import React, { useState, useEffect } from 'react';
import SalesSummary from './SalesSummary';
import SalesList from './SalesList';
import SaleDetails from './SaleDetails';

function SalesHistory() {
  const [sales, setSales] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);
  const [saleDetails, setSaleDetails] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadSalesHistory = async () => {
    setLoading(true);
    try {
      const salesData = await window.api.getSalesHistory(100);
      setSales(salesData);
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการโหลดประวัติการขาย: ' + error.message);
    }
    setLoading(false);
  };

  const loadSaleDetails = async (saleId) => {
    try {
      const details = await window.api.getSaleDetails(saleId);
      setSaleDetails(details);
      setSelectedSale(saleId);
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการโหลดรายละเอียด: ' + error.message);
    }
  };

  const handlePreviewReceipt = async (sale) => {
    try {
      const details = await window.api.getSaleDetails(sale.id);
      const saleData = {
        saleId: sale.id,
        totalAmount: sale.total_amount,
        saleDate: sale.date
      };
      const cartItems = details.map(item => ({
        id: item.id,
        name: item.product_name,
        qty: item.quantity,
        price: item.price
      }));
      window.api.previewReceipt(saleData, cartItems);
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการแสดงตัวอย่างใบเสร็จ: ' + error.message);
    }
  };

  useEffect(() => {
    loadSalesHistory();
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h2>ประวัติการขาย</h2>
      
      <SalesSummary 
        sales={sales} 
        onRefresh={loadSalesHistory} 
        loading={loading} 
      />

      <div style={{ display: 'flex', gap: 24 }}>
        <SalesList
          sales={sales}
          selectedSale={selectedSale}
          onSelectSale={loadSaleDetails}
          onPreviewReceipt={handlePreviewReceipt}
        />

        <SaleDetails
          saleDetails={saleDetails}
          selectedSale={selectedSale}
        />
      </div>
    </div>
  );
}

export default SalesHistory; 