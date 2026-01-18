'use client';

import { useState, useEffect } from 'react';
import { StatCard, Card, SectionHeader, Modal, Button } from './ui';

interface SalesData {
  totalSales: number;
  orders: number;
  avgOrderValue: number;
  weekOverWeek: number;
}

interface Transaction {
  _id: string;
  dateTime: string;
  site: string;
  customerType: string;
  items: Array<{
    productName: string;
    category: string;
    quantity: number;
    pricePerUnit: number;
  }>;
  totalAmount: number;
}

export default function SalesPerformance() {
  const [salesData, setSalesData] = useState<SalesData>({
    totalSales: 0,
    orders: 0,
    avgOrderValue: 0,
    weekOverWeek: 0
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [cafes, setCafes] = useState<any[]>([]);
  
  // Add Sale Form States
  const [dateTime, setDateTime] = useState('');
  const [site, setSite] = useState('');
  const [customerType, setCustomerType] = useState<'new' | 'returning'>('new');
  const [items, setItems] = useState<Array<{
    productName: string;
    category: string;
    quantity: number;
    pricePerUnit: number;
  }>>([{ productName: '', category: 'food', quantity: 1, pricePerUnit: 0 }]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  // Create Cafe Modal
  const [showCafeModal, setShowCafeModal] = useState(false);
  const [newCafe, setNewCafe] = useState({ name: '', location: '' });
  
  // Create Product Modal
  const [showProductModal, setShowProductModal] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', category: 'food', defaultPrice: 0 });

  useEffect(() => {
    fetchData();
    fetchTransactions();
    fetchProducts();
    fetchCafes();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/sales');
      const data = await response.json();
      if (data && data.totalSales !== undefined) {
        setSalesData(data);
      }
    } catch (error) {
      console.error('Failed to fetch sales data:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/transactions');
      const data = await response.json();
      setTransactions(data || []);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products-catalog');
      const data = await response.json();
      setProducts(data || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const fetchCafes = async () => {
    try {
      const response = await fetch('/api/cafes');
      const data = await response.json();
      setCafes(data || []);
    } catch (error) {
      console.error('Failed to fetch cafes:', error);
    }
  };
  const handleCreateCafe = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/cafes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCafe)
      });
      const data = await response.json();
      if (data.error) {
        setSuccessMessage(data.error);
        setShowSuccessModal(true);
        return;
      }
      await fetchCafes();
      setNewCafe({ name: '', location: '' });
      setShowCafeModal(false);
      setSuccessMessage('Cafe created successfully!');
      setShowSuccessModal(true);
    } catch (error) {
      setSuccessMessage('Failed to create cafe');
      setShowSuccessModal(true);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/products-catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
      });
      const data = await response.json();
      if (data.error) {
        setSuccessMessage(data.error);
        setShowSuccessModal(true);
        return;
      }
      await fetchProducts();
      setNewProduct({ name: '', category: 'food', defaultPrice: 0 });
      setShowProductModal(false);
      setSuccessMessage('Product created successfully!');
      setShowSuccessModal(true);
    } catch (error) {
      setSuccessMessage('Failed to create product');
      setShowSuccessModal(true);
    }
  };
  const handleDelete = async (id: string) => {
    setTransactionToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!transactionToDelete) return;
    
    try {
      const response = await fetch(`/api/transactions/${transactionToDelete}`, { method: 'DELETE' });
      if (response.ok) {
        await fetchTransactions();
        await fetchData();
        setShowDeleteModal(false);
        setTransactionToDelete(null);
        setSuccessMessage('Transaction deleted successfully!');
        setShowSuccessModal(true);
      }
    } catch (error) {
      setSuccessMessage('Failed to delete transaction');
      setShowSuccessModal(true);
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction({
      ...transaction,
      dateTime: new Date(transaction.dateTime).toISOString().slice(0, 16)
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;

    try {
      const response = await fetch(`/api/transactions/${editingTransaction._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateTime: new Date(editingTransaction.dateTime).toISOString(),
          site: editingTransaction.site,
          customerType: editingTransaction.customerType,
          items: editingTransaction.items
        })
      });

      if (response.ok) {
        setShowEditModal(false);
        setEditingTransaction(null);
        await fetchTransactions();
        await fetchData();
        setSuccessMessage('Transaction updated successfully!');
        setShowSuccessModal(true);
      }
    } catch (error) {
      setSuccessMessage('Failed to update transaction');
      setShowSuccessModal(true);
    }
  };

  const updateTransactionItem = (index: number, field: string, value: any) => {
    if (!editingTransaction) return;
    const newItems = [...editingTransaction.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setEditingTransaction({ ...editingTransaction, items: newItems });
  };

  const addTransactionItem = () => {
    if (!editingTransaction) return;
    setEditingTransaction({
      ...editingTransaction,
      items: [...editingTransaction.items, { productName: '', category: 'food', quantity: 1, pricePerUnit: 0 }]
    });
  };

  const removeTransactionItem = (index: number) => {
    if (!editingTransaction) return;
    setEditingTransaction({
      ...editingTransaction,
      items: editingTransaction.items.filter((_, i) => i !== index)
    });
  };

  // Add Sale Functions
  const addItem = () => {
    setItems([...items, { productName: '', category: 'food', quantity: 1, pricePerUnit: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleAddSale = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateTime: new Date(dateTime).toISOString(),
          site,
          customerType,
          items: items.filter(item => item.productName && item.pricePerUnit > 0)
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Sale added successfully!');
        setDateTime('');
        setSite('');
        setCustomerType('new');
        setItems([{ productName: '', category: 'food', quantity: 1, pricePerUnit: 0 }]);
        await fetchTransactions();
        await fetchData();
        setTimeout(() => {
          setShowAddModal(false);
          setMessage('');
        }, 1500);
      } else {
        setMessage('Failed to add sale: ' + data.error);
      }
    } catch (error) {
      setMessage('Error adding sale');
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.pricePerUnit), 0);

  return (
    <section id="sales" className="scroll-mt-6">
      <SectionHeader 
        title="Sales Performance"
        description="Overall sales metrics and performance indicators"
        action={
          <Button 
            onClick={() => setShowAddModal(true)}
            size="lg"
            className="flex items-center gap-2 shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Sale
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Sales"
          value={(salesData.totalSales || 0).toFixed(2)}
          prefix="£"
          change={salesData.weekOverWeek}
        />
        <StatCard
          title="Orders Count"
          value={salesData.orders || 0}
          change={salesData.weekOverWeek}
        />
        <StatCard
          title="Average Order Value"
          value={(salesData.avgOrderValue || 0).toFixed(2)}
          prefix="£"
        />
        <StatCard
          title="Week-on-Week"
          value={(salesData.weekOverWeek || 0).toFixed(1)}
          suffix="%"
        />
      </div>

      {/* Sales History */}
      <Card className="p-6">
        <h3 className="text-xl font-bold text-slate-900 mb-6">Sales History</h3>
        {transactions.length === 0 ? (
          <p className="text-center text-slate-500 py-12 font-medium">No sales transactions yet. Add your first sale to get started.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="px-5 py-4 text-left font-semibold text-slate-700 uppercase tracking-wide text-xs">Date & Time</th>
                  <th className="px-5 py-4 text-left font-semibold text-slate-700 uppercase tracking-wide text-xs">Site</th>
                  <th className="px-5 py-4 text-left font-semibold text-slate-700 uppercase tracking-wide text-xs">Customer</th>
                  <th className="px-5 py-4 text-left font-semibold text-slate-700 uppercase tracking-wide text-xs">Items</th>
                  <th className="px-5 py-4 text-right font-semibold text-slate-700 uppercase tracking-wide text-xs">Amount</th>
                  <th className="px-5 py-4 text-right font-semibold text-slate-700 uppercase tracking-wide text-xs">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction, idx) => (
                  <tr key={transaction._id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                    <td className="px-5 py-4 text-slate-900 font-medium">
                      {new Date(transaction.dateTime).toLocaleString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-5 py-4 text-slate-700 font-medium">{transaction.site}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        transaction.customerType === 'new' 
                          ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' 
                          : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                      }`}>
                        {transaction.customerType === 'new' ? 'New' : 'Returning'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-xs text-slate-600 space-y-1">
                        {transaction.items.map((item, idx) => (
                          <div key={idx} className="font-medium">
                            {item.quantity}x {item.productName}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-slate-900 text-base">£{transaction.totalAmount.toFixed(2)}</td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleEdit(transaction)}
                          className="px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-medium transition-all hover:shadow-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(transaction._id)}
                          className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-sm font-medium transition-all hover:shadow-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Edit Transaction Modal */}
      {editingTransaction && (
        <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Transaction">
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-1.5">Date & Time</label>
              <input
                type="datetime-local"
                value={editingTransaction.dateTime}
                onChange={(e) => setEditingTransaction({ ...editingTransaction, dateTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-slate-900"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-1.5">Site</label>
              <select
                value={editingTransaction.site}
                onChange={(e) => setEditingTransaction({ ...editingTransaction, site: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-slate-900"
                required
              >
                {cafes.map((cafe) => (
                  <option key={cafe._id} value={cafe.name}>{cafe.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-1.5">Customer Type</label>
              <select
                value={editingTransaction.customerType}
                onChange={(e) => setEditingTransaction({ ...editingTransaction, customerType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-slate-900"
              >
                <option value="new">New</option>
                <option value="returning">Returning</option>
              </select>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-semibold text-slate-900">Items</label>
                <button type="button" onClick={addTransactionItem} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  + Add Item
                </button>
              </div>
              {editingTransaction.items.map((item, idx) => (
                <div key={idx} className="border p-2 rounded mb-2 space-y-2 bg-white">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <select
                        value={item.productName}
                        onChange={(e) => {
                          const selectedProduct = products.find(p => p.name === e.target.value);
                          const newItems = [...editingTransaction.items];
                          newItems[idx] = {
                            ...newItems[idx],
                            productName: e.target.value,
                            category: selectedProduct?.category || 'food',
                            pricePerUnit: selectedProduct?.defaultPrice || newItems[idx].pricePerUnit
                          };
                          setEditingTransaction({ ...editingTransaction, items: newItems });
                        }}
                        className="w-full px-2 py-1 border rounded text-sm bg-white text-slate-900"
                        required
                      >
                        <option value="">Select Product</option>
                        {products.map((product) => (
                          <option key={product._id} value={product.name}>{product.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => updateTransactionItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-full px-2 py-1 border rounded text-sm bg-white text-slate-900"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Price"
                        value={item.pricePerUnit}
                        onChange={(e) => updateTransactionItem(idx, 'pricePerUnit', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 border rounded text-sm bg-white text-slate-900"
                        required
                      />
                    </div>
                    {editingTransaction.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTransactionItem(idx)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                Update Transaction
              </Button>
              <Button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Sale Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Sale">
        <form onSubmit={handleAddSale} className="space-y-4">
          {/* Date & Time */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-1.5">Date & Time *</label>
            <input
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-slate-400 text-sm bg-white transition-colors text-slate-900"
              required
            />
          </div>

          {/* Site */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-1.5">Site/Location *</label>
            <div className="flex gap-2">
              <select
                value={site}
                onChange={(e) => setSite(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-slate-400 text-sm bg-white transition-colors text-slate-900"
                required
              >
                <option value="">Select Cafe</option>
                {cafes.map((cafe) => (
                  <option key={cafe._id} value={cafe.name}>
                    {cafe.name} {cafe.location && `(${cafe.location})`}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowCafeModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-lg text-sm font-medium shadow-sm hover:shadow transition-all"
              >
                + New
              </button>
            </div>
          </div>

          {/* Customer Type */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-1.5">Customer Type *</label>
            <div className="flex gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="new"
                  checked={customerType === 'new'}
                  onChange={(e) => setCustomerType(e.target.value as 'new' | 'returning')}
                  className="mr-2 w-4 h-4 text-slate-600"
                />
                <span className="text-sm font-semibold text-slate-900">New Customer</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="returning"
                  checked={customerType === 'returning'}
                  onChange={(e) => setCustomerType(e.target.value as 'new' | 'returning')}
                  className="mr-2 w-4 h-4 text-slate-600"
                />
                <span className="text-sm font-semibold text-slate-900">Returning Customer</span>
              </label>
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-semibold text-slate-900">Items *</label>
              <button
                type="button"
                onClick={() => setShowProductModal(true)}
                className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-lg text-xs font-medium shadow-sm hover:shadow transition-all"
              >
                + New Product
              </button>
            </div>
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="border border-slate-200 rounded-xl p-3 space-y-2 bg-white transition-colors">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <select
                        value={item.productName}
                        onChange={(e) => {
                          const selectedProduct = products.find(p => p.name === e.target.value);
                          const newItems = [...items];
                          newItems[index] = {
                            ...newItems[index],
                            productName: e.target.value,
                            category: selectedProduct?.category || 'food',
                            pricePerUnit: selectedProduct?.defaultPrice || newItems[index].pricePerUnit
                          };
                          setItems(newItems);
                        }}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-400 bg-white text-slate-900"
                        required
                      >
                        <option value="">Select Product</option>
                        {products.map((product) => (
                          <option key={product._id} value={product.name}>
                            {product.name} ({product.category})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <select
                        value={item.category}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-900"
                        disabled
                      >
                        <option value="food">Food</option>
                        <option value="drink">Drink</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-400 bg-white text-slate-900"
                        required
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Price"
                        value={item.pricePerUnit || ''}
                        onChange={(e) => updateItem(index, 'pricePerUnit', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-400 bg-white text-slate-900"
                        required
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-slate-900">
                        £{(item.quantity * item.pricePerUnit).toFixed(2)}
                      </span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-rose-600 hover:text-rose-700 text-sm font-medium hover:bg-rose-50 px-2 py-1 rounded transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addItem}
              className="mt-2 px-3 py-2 text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-lg text-sm font-medium transition-all hover:shadow-sm"
            >
              + Add Another Item
            </button>
          </div>

          {/* Total */}
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-2 border-slate-200 rounded-xl p-3">
            <div className="flex justify-between items-center">
              <span className="text-base font-semibold text-slate-900">Total Amount:</span>
              <span className="text-2xl font-bold text-slate-900">£{totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Messages */}
          {message && (
            <div className={`px-4 py-2.5 rounded-lg text-sm font-medium ${
              message.includes('success') 
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' 
                : 'bg-rose-50 border border-rose-200 text-rose-700'
            }`}>
              {message}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading} className="flex-1 shadow-lg">
              {loading ? 'Saving...' : 'Save Sale'}
            </Button>
            <Button
              type="button"
              onClick={() => setShowAddModal(false)}
              variant="outline"
              className="px-6"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create Cafe Modal */}
      <Modal isOpen={showCafeModal} onClose={() => setShowCafeModal(false)} title="Create New Cafe">
        <form onSubmit={handleCreateCafe} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-1.5">Cafe Name *</label>
            <input
              type="text"
              value={newCafe.name}
              onChange={(e) => setNewCafe({ ...newCafe, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-slate-400 text-sm bg-white transition-colors text-slate-900"
              required
              placeholder="e.g., Downtown Cafe"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-1.5">Location</label>
            <input
              type="text"
              value={newCafe.location}
              onChange={(e) => setNewCafe({ ...newCafe, location: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-slate-400 text-sm bg-white transition-colors text-slate-900"
              placeholder="e.g., 123 Main Street"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1 shadow-lg">
              Create Cafe
            </Button>
            <Button
              type="button"
              onClick={() => setShowCafeModal(false)}
              variant="outline"
              className="px-6"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create Product Modal */}
      <Modal isOpen={showProductModal} onClose={() => setShowProductModal(false)} title="Create New Product">
        <form onSubmit={handleCreateProduct} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-1.5">Product Name *</label>
            <input
              type="text"
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-slate-400 text-sm bg-white transition-colors text-slate-900"
              required
              placeholder="e.g., Cappuccino"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-1.5">Category *</label>
            <select
              value={newProduct.category}
              onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-slate-400 text-sm bg-white transition-colors text-slate-900"
              required
            >
              <option value="food">Food</option>
              <option value="drink">Drink</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-1.5">Default Price (£) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={newProduct.defaultPrice || ''}
              onChange={(e) => setNewProduct({ ...newProduct, defaultPrice: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-slate-400 text-sm bg-white transition-colors text-slate-900"
              required
              placeholder="0.00"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1 shadow-lg">
              Create Product
            </Button>
            <Button
              type="button"
              onClick={() => setShowProductModal(false)}
              variant="outline"
              className="px-6"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Transaction">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-lg">
            <svg className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h4 className="text-sm font-semibold text-rose-900 mb-1">Are you sure you want to delete this transaction?</h4>
              <p className="text-sm text-rose-700">This action cannot be undone. Deleting this transaction will recalculate all analytics and sales metrics.</p>
            </div>
          </div>
          
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              onClick={confirmDelete}
              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white shadow-lg"
            >
              Delete Transaction
            </Button>
            <Button
              type="button"
              onClick={() => {
                setShowDeleteModal(false);
                setTransactionToDelete(null);
              }}
              variant="outline"
              className="px-6"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Success Modal */}
      <Modal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} title="">
        <div className="space-y-4">
          <div className="flex flex-col items-center justify-center p-6">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
              successMessage.toLowerCase().includes('failed') || successMessage.toLowerCase().includes('error')
                ? 'bg-rose-100'
                : 'bg-emerald-100'
            }`}>
              {successMessage.toLowerCase().includes('failed') || successMessage.toLowerCase().includes('error') ? (
                <svg className="w-8 h-8 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <h3 className={`text-lg font-bold mb-2 ${
              successMessage.toLowerCase().includes('failed') || successMessage.toLowerCase().includes('error')
                ? 'text-rose-900'
                : 'text-emerald-900'
            }`}>
              {successMessage.toLowerCase().includes('failed') || successMessage.toLowerCase().includes('error') 
                ? 'Error' 
                : 'Success!'}
            </h3>
            <p className="text-sm text-slate-700 text-center">{successMessage}</p>
          </div>
          
          <div className="flex justify-center pt-2">
            <Button
              type="button"
              onClick={() => setShowSuccessModal(false)}
              className={`px-8 shadow-lg ${
                successMessage.toLowerCase().includes('failed') || successMessage.toLowerCase().includes('error')
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              } text-white`}
            >
              OK
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
