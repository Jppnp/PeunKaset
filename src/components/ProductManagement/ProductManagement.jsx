import React, { useState, useEffect } from 'react';
import ProductForm from './ProductForm';
import ProductTable from './ProductTable';

function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', price: '', stock: '' });
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingId, setEditingId] = useState(null);

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
    setForm({ name: '', description: '', price: '', stock: '' });
    setEditingIndex(null);
    setEditingId(null);
    loadProducts();
  };

  const handleEdit = (idx) => {
    setForm({
      name: products[idx].name,
      description: products[idx].description,
      price: products[idx].price,
      stock: products[idx].stockOnHand,
    });
    setEditingIndex(idx);
    setEditingId(products[idx].id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบสินค้านี้?')) {
      await window.api.deleteProduct(id);
      loadProducts();
    }
  };

  const handlePrintLabel = async (product) => {
    await window.api.printLabel(product);
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>จัดการสินค้า</h2>
      <ProductForm
        form={form}
        onFormChange={setForm}
        onSubmit={handleSubmit}
        isEditing={editingIndex !== null}
      />
      <ProductTable
        products={products}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onPrintLabel={handlePrintLabel}
      />
    </div>
  );
}

export default ProductManagement; 