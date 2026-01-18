'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from './components/DashboardLayout';
import { Card, Button, Modal } from './components/ui';
import { useRouter } from 'next/navigation';

interface SaleItem {
  productName: string;
  category: string;
  quantity: number;
  pricePerUnit: number;
}

interface Cafe {
  _id: string;
  name: string;
  location?: string;
}

interface Product {
  _id: string;
  name: string;
  category: 'food' | 'drink';
  defaultPrice?: number;
}

export default function Home() {
  const [showAddSale, setShowAddSale] = useState(false);
  const [showCafeModal, setShowCafeModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [newCafe, setNewCafe] = useState({ name: '', location: '' });
  const [newProduct, setNewProduct] = useState({ name: '', category: 'food' as 'food' | 'drink', defaultPrice: 0 });
  
  // Form state
  const [dateTime, setDateTime] = useState('');
  const [site, setSite] = useState('');
  const [customerType, setCustomerType] = useState<'new' | 'returning'>('new');
  const [items, setItems] = useState<SaleItem[]>([
    { productName: '', category: 'food', quantity: 1, pricePerUnit: 0 }
  ]);

  useEffect(() => {
    if (showAddSale) {
      fetchCafes();
      fetchProducts();
    }
  }, [showAddSale]);

  const fetchCafes = async () => {
    try {
      const response = await fetch('/api/cafes');
      const data = await response.json();
      setCafes(data);
    } catch (error) {
      console.error('Error fetching cafes:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products-catalog');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleCreateCafe = async () => {
    try {
      const response = await fetch('/api/cafes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCafe)
      });
      const data = await response.json();
      if (data.error) {
        alert(data.error);
        return;
      }
      await fetchCafes();
      setSite(data.name);
      setNewCafe({ name: '', location: '' });
      setShowCafeModal(false);
    } catch (error) {
      alert('Failed to create cafe');
    }
  };

  const handleCreateProduct = async () => {
    try {
      const response = await fetch('/api/products-catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
      });
      const data = await response.json();
      if (data.error) {
        alert(data.error);
        return;
      }
      await fetchProducts();
      setNewProduct({ name: '', category: 'food', defaultPrice: 0 });
      setShowProductModal(false);
    } catch (error) {
      alert('Failed to create product');
    }
  };

  const addItem = () => {
    setItems([...items, { productName: '', category: 'food', quantity: 1, pricePerUnit: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof SaleItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
        setMessage('Sale added successfully! All analytics have been updated.');
        // Reset form
        setDateTime('');
        setSite('');
        setCustomerType('new');
        setItems([{ productName: '', category: 'food', quantity: 1, pricePerUnit: 0 }]);
        setTimeout(() => {
          setShowAddSale(false);
          setMessage('');
        }, 2000);
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

  const router = useRouter();

  const navigateTo = (path: string) => {
    router.push(path);
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Welcome Back</h1>
            <p className="text-base text-slate-600 mt-2 font-medium">
              Manage your café operations and view real-time analytics
            </p>
          </div>
          <Button 
            onClick={() => setShowAddSale(true)}
            size="lg"
            className="flex items-center gap-2 shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Sale
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigateTo('/sales')}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">Sales</h3>
                <p className="text-sm text-slate-600">Track revenue & transactions</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigateTo('/time-demand')}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">Time Demand</h3>
                <p className="text-sm text-slate-600">Peak hours & patterns</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigateTo('/sites')}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">Sites</h3>
                <p className="text-sm text-slate-600">Location performance</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigateTo('/buying')}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">Spending</h3>
                <p className="text-sm text-slate-600">Monitor stock & expenses</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigateTo('/products')}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">Products</h3>
                <p className="text-sm text-slate-600">Top selling items</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigateTo('/customers')}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">Customers</h3>
                <p className="text-sm text-slate-600">Customer behavior insights</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Add Sale Modal */}
        <Modal isOpen={showAddSale} onClose={() => setShowAddSale(false)} title="Add New Sale">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Date & Time */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Date & Time *
              </label>
              <input
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-slate-400 text-sm bg-white transition-colors"
                required
              />
            </div>

            {/* Site */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Site/Location *
              </label>
              <div className="flex gap-2">
                <select
                  value={site}
                  onChange={(e) => setSite(e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-slate-400 text-sm bg-white transition-colors"
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
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Customer Type *
              </label>
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    value="new"
                    checked={customerType === 'new'}
                    onChange={(e) => setCustomerType(e.target.value as 'new' | 'returning')}
                    className="mr-2 w-4 h-4 text-slate-600"
                  />
                  <span className="text-sm font-medium text-slate-700">New Customer</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    value="returning"
                    checked={customerType === 'returning'}
                    onChange={(e) => setCustomerType(e.target.value as 'new' | 'returning')}
                    className="mr-2 w-4 h-4 text-slate-600"
                  />
                  <span className="text-sm font-medium text-slate-700">Returning Customer</span>
                </label>
              </div>
            </div>

            {/* Items */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-slate-700">
                  Items *
                </label>
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
                          className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-400 bg-white"
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
                          onChange={(e) => updateItem(index, 'category', e.target.value)}
                          className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-slate-400"
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
                          className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-400 bg-white"
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
                          className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-400 bg-white"
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
                <span className="text-base font-medium text-slate-700">Total Amount:</span>
                <span className="text-2xl font-bold text-slate-900">£{totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Messages */}
            {message && (
              <div className={`px-4 py-2.5 rounded-lg text-sm ${
                message.includes('success') 
                  ? 'bg-green-50 border border-green-200 text-green-700' 
                  : 'bg-red-50 border border-red-200 text-red-700'
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
                onClick={() => setShowAddSale(false)}
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
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Cafe Name *</label>
              <input
                type="text"
                value={newCafe.name}
                onChange={(e) => setNewCafe({ ...newCafe, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 bg-white transition-colors"
                placeholder="e.g., Downtown Cafe"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Location (Optional)</label>
              <input
                type="text"
                value={newCafe.location}
                onChange={(e) => setNewCafe({ ...newCafe, location: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 bg-white transition-colors"
                placeholder="e.g., Main Street"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button 
                onClick={() => setShowCafeModal(false)} 
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateCafe}
                className="flex-1 shadow-lg"
                disabled={!newCafe.name.trim()}
              >
                Create Cafe
              </Button>
            </div>
          </div>
        </Modal>

        {/* Create Product Modal */}
        <Modal isOpen={showProductModal} onClose={() => setShowProductModal(false)} title="Create New Product">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Product Name *</label>
              <input
                type="text"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 bg-white transition-colors"
                placeholder="e.g., Cappuccino"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Category *</label>
              <select
                value={newProduct.category}
                onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value as 'food' | 'drink' })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 bg-white transition-colors"
              >
                <option value="food">Food</option>
                <option value="drink">Drink</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Default Price (Optional)</label>
              <input
                type="number"
                step="0.01"
                value={newProduct.defaultPrice}
                onChange={(e) => setNewProduct({ ...newProduct, defaultPrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 bg-white transition-colors"
                placeholder="0.00"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button 
                onClick={() => setShowProductModal(false)} 
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateProduct}
                className="flex-1 shadow-lg"
                disabled={!newProduct.name.trim()}
              >
                Create Product
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
