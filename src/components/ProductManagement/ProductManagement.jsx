import React, { useState, useEffect } from 'react';
import ProductForm from './ProductForm';
import ProductTable from './ProductTable';
import Toast from '../common/Toast';
import ConfirmModal from '../common/ConfirmModal';

function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', cost_price: '', sale_price: '', stock: '' });
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [notification, setNotification] = useState('');
  const [confirm, setConfirm] = useState({ open: false, message: '', onConfirm: null });

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3000);
  };

  const loadProducts = async () => {
    const dbProducts = await window.api.getProducts();
    setProducts(dbProducts);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingIndex !== null && editingId !== null) {
      await window.api.editProduct(editingId, form);
    } else {
      await window.api.addProduct(form);
    }
    setForm({ name: '', description: '', cost_price: '', sale_price: '', stock: '' });
    setEditingIndex(null);
    setEditingId(null);
    loadProducts();
  };

  const handleEdit = (id) => {
    const product = products.find(p => p.id === id);
    if (!product) return;
    setForm({
      name: product.name || '',
      description: product.description || '',
      cost_price: product.cost_price || '',
      sale_price: product.sale_price || '',
      stock: product.stockOnHand || '',
    });
    setEditingId(product.id);
    setEditingIndex(products.findIndex(p => p.id === id));
  };

  // Use confirm modal for delete
  const handleDelete = (id) => {
    setConfirm({
      open: true,
      message: 'คุณแน่ใจหรือไม่ว่าต้องการลบสินค้านี้?',
      onConfirm: async () => {
        setConfirm({ ...confirm, open: false });
        try {
          await window.api.deleteProduct(id);
          loadProducts();
          showNotification('ลบสินค้าสำเร็จ');
        } catch (error) {
          showNotification('เกิดข้อผิดพลาดในการลบสินค้า: ' + error.message);
        }
      }
    });
  };

  // Filter products by search query (name or description)
  const filteredProducts = products.filter(
    (product) =>
      product.name?.toLowerCase().includes(search.toLowerCase()) ||
      product.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: 24 }}>
      <Toast message={notification} onClose={() => setNotification('')} />
      <ConfirmModal
        open={confirm.open}
        message={confirm.message}
        onConfirm={confirm.onConfirm}
        onCancel={() => setConfirm({ ...confirm, open: false })}
      />
      <h2>จัดการสินค้า</h2>
      <ProductForm
        form={form}
        setForm={setForm}
        onSubmit={handleSubmit}
        editingIndex={editingIndex}
        setEditingIndex={setEditingIndex}
        setEditingId={setEditingId}
      />
      <div style={{ margin: '16px 0' }}>
        <input
          type="text"
          placeholder="ค้นหาสินค้า..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 300, fontSize: 16, padding: 4 }}
        />
      </div>
      <ProductTable
        products={filteredProducts}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}

export default ProductManagement; 