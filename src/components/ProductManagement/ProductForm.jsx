import React from 'react';
import Button from '../common/Button';

function ProductForm({ form, onFormChange, onSubmit, isEditing }) {
  const handleChange = (e) => {
    onFormChange({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <form onSubmit={onSubmit} style={{ marginBottom: 24 }}>
      <input
        name="name"
        placeholder="ชื่อสินค้า"
        value={form.name}
        onChange={handleChange}
        required
        style={{ marginRight: '8px', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
      />
      <input
        name="description"
        placeholder="รายละเอียด"
        value={form.description}
        onChange={handleChange}
        style={{ marginRight: '8px', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
      />
      <input
        name="cost_price"
        type="number"
        placeholder="ราคาทุน (Cost Price)"
        value={form.cost_price}
        onChange={handleChange}
        required
        min="0"
        step="0.01"
        style={{ marginRight: '8px', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
      />
      <input
        name="sale_price"
        type="number"
        placeholder="ราคาขาย (Sale Price)"
        value={form.sale_price}
        onChange={handleChange}
        required
        min="0"
        step="0.01"
        style={{ marginRight: '8px', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
      />
      <input
        name="stock"
        type="number"
        placeholder="จำนวนคงเหลือ"
        value={form.stock}
        onChange={handleChange}
        required
        min="0"
        step="1"
        style={{ marginRight: '8px', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
      />
      <Button type="submit" variant="primary">
        {isEditing ? 'อัปเดตสินค้า' : 'เพิ่มสินค้า'}
      </Button>
    </form>
  );
}

export default ProductForm; 