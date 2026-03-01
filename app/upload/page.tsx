'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Card, Button } from '../components/ui';

interface Store {
  id: string;
  name: string;
  platform: 'takemypayments' | 'booker';
  outletId?: string;
  mid?: string;
  bookerId?: string;
  lastUploaded?: string;
  transactionCount?: number;
  isUploading?: boolean;
}

const PREDEFINED_STORES: Store[] = [
  // TakeMyPayments Stores
  { id: 'TPM262523-2', name: 'Bath Road', platform: 'takemypayments', outletId: 'TPM262523-2', mid: 'GB0000000234497' },
  { id: 'TPM262523-3-1', name: 'Bracknell', platform: 'takemypayments', outletId: 'TPM262523-3', mid: 'GB0000000234494' },
  { id: 'TPM262523-3-2', name: 'London (3)', platform: 'takemypayments', outletId: 'TPM262523-3', mid: 'GB0000000234498' },
  { id: 'TPM262523-4', name: 'London (4)', platform: 'takemypayments', outletId: 'TPM262523-4', mid: 'GB0000000234498' },
  { id: 'TPM262523-5', name: 'Stockley Park', platform: 'takemypayments', outletId: 'TPM262523-5', mid: 'GB0000000234500' },
  
  // Booker Stores
  { id: '742335034', name: 'Cannon Street', platform: 'booker', bookerId: '742335034' },
  { id: '741169011', name: 'Bath Road', platform: 'booker', bookerId: '741169011' },
  { id: '741169037', name: 'Bracknell', platform: 'booker', bookerId: '741169037' },
  { id: '742837716', name: 'Bishopsgate', platform: 'booker', bookerId: '742837716' },
  { id: '741169854', name: 'Stockley Park', platform: 'booker', bookerId: '741169854' },
  { id: '741169839', name: 'Waterside', platform: 'booker', bookerId: '741169839' },
  { id: '740328096', name: 'GX', platform: 'booker', bookerId: '740328096' },
  { id: '742433466', name: 'Marlow', platform: 'booker', bookerId: '742433466' },
];

export default function UploadPage() {
  const [stores, setStores] = useState<Store[]>(PREDEFINED_STORES);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [filterPlatform, setFilterPlatform] = useState<'all' | 'takemypayments' | 'booker'>('all');

  useEffect(() => {
    fetchStoresStatus();
  }, []);

  const fetchStoresStatus = async () => {
    try {
      const response = await fetch('/api/upload/status');
      if (response.ok) {
        const data = await response.json();
        setStores(prevStores => 
          prevStores.map(store => {
            const status = data.stores.find((s: any) => s.storeId === store.id);
            return status ? { ...store, ...status } : store;
          })
        );
      }
    } catch (error) {
      console.error('Failed to fetch store status:', error);
    }
  };

  const handleFileSelect = async (storeId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const store = stores.find(s => s.id === storeId);
    if (!store) return;

    // Update uploading status
    setStores(prevStores => 
      prevStores.map(s => s.id === storeId ? { ...s, isUploading: true } : s)
    );
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('storeId', store.id);
      formData.append('storeName', store.name);
      formData.append('platform', store.platform);
      if (store.outletId) formData.append('outletId', store.outletId);
      if (store.mid) formData.append('mid', store.mid);
      if (store.bookerId) formData.append('bookerId', store.bookerId.toString());

      const response = await fetch('/api/upload/store', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`Successfully uploaded ${data.transactionCount} transactions for ${store.name}!`);
        setMessageType('success');
        
        // Update store status
        setStores(prevStores => 
          prevStores.map(s => s.id === storeId 
            ? { 
                ...s, 
                isUploading: false, 
                lastUploaded: data.lastUploaded,
                transactionCount: data.transactionCount 
              } 
            : s
          )
        );
        
        // Refresh status
        fetchStoresStatus();
      } else {
        let errorMsg = data.error || 'Upload failed';
        
        // Add column information if available
        if (data.foundColumns) {
          errorMsg += `\n\nColumns in your file: ${data.foundColumns}`;
        }
        
        // Log sample data to browser console for debugging
        if (data.sampleRow) {
          console.error('Sample row from file:', data.sampleRow);
        }
        
        setMessage(`Error: ${errorMsg}`);
        setMessageType('error');
        setStores(prevStores => 
          prevStores.map(s => s.id === storeId ? { ...s, isUploading: false } : s)
        );
      }
    } catch (error) {
      setMessage(`Failed to upload file for ${store.name}. Please try again.`);
      setMessageType('error');
      setStores(prevStores => 
        prevStores.map(s => s.id === storeId ? { ...s, isUploading: false } : s)
      );
    }

    // Reset file input
    event.target.value = '';
  };

  const filteredStores = filterPlatform === 'all' 
    ? stores 
    : stores.filter(s => s.platform === filterPlatform);

  const uploadedCount = stores.filter(s => s.lastUploaded).length;
  const totalTransactions = stores.reduce((sum, s) => sum + (s.transactionCount || 0), 0);

  return (
    <DashboardLayout>
      <div className="p-8 max-w-full overflow-x-hidden">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Manage Store Data</h1>
          <p className="text-base text-slate-600 mt-2 font-medium">
            Upload data files individually for each store
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          <Card className="p-5 border border-slate-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl">
                <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-slate-600 font-medium">Total Stores</p>
                <p className="text-3xl font-bold text-slate-900">{stores.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-5 border border-emerald-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-xl">
                <svg className="w-6 h-6 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-slate-600 font-medium">Uploaded</p>
                <p className="text-3xl font-bold text-emerald-700">{uploadedCount}</p>
              </div>
            </div>
          </Card>

          <Card className="p-5 border border-blue-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl">
                <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-slate-600 font-medium">Total Transactions</p>
                <p className="text-3xl font-bold text-blue-700">{totalTransactions.toLocaleString()}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Button 
            variant={filterPlatform === 'all' ? 'primary' : 'outline'}
            onClick={() => setFilterPlatform('all')}
            size="sm"
            className="font-medium"
          >
            All Stores ({stores.length})
          </Button>
          <Button 
            variant={filterPlatform === 'takemypayments' ? 'primary' : 'outline'}
            onClick={() => setFilterPlatform('takemypayments')}
            size="sm"
            className="font-medium"
          >
            TakeMyPayments ({stores.filter(s => s.platform === 'takemypayments').length})
          </Button>
          <Button 
            variant={filterPlatform === 'booker' ? 'primary' : 'outline'}
            onClick={() => setFilterPlatform('booker')}
            size="sm"
            className="font-medium"
          >
            Booker ({stores.filter(s => s.platform === 'booker').length})
          </Button>
        </div>

        {/* Stores Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
          {filteredStores.map(store => (
            <Card key={store.id} className="p-5 hover:shadow-lg transition-shadow duration-200 border border-slate-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 text-base leading-tight">{store.name}</h3>
                  <p className="text-xs text-slate-500 mt-1.5 font-medium">
                    {store.platform === 'takemypayments' ? 'TakeMyPayments' : 'Booker'}
                  </p>
                </div>
                <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  store.lastUploaded 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {store.lastUploaded ? 'Active' : 'No Data'}
                </div>
              </div>

              <div className="space-y-2.5 mb-5 text-xs text-slate-600">
                {store.outletId && (
                  <div className="flex justify-between">
                    <span>Outlet ID:</span>
                    <span className="font-medium text-slate-900">{store.outletId}</span>
                  </div>
                )}
                {store.mid && (
                  <div className="flex justify-between">
                    <span>MID:</span>
                    <span className="font-medium text-slate-900">{store.mid}</span>
                  </div>
                )}
                {store.bookerId && (
                  <div className="flex justify-between">
                    <span>Booker ID:</span>
                    <span className="font-medium text-slate-900">{store.bookerId}</span>
                  </div>
                )}
                {store.lastUploaded && (
                  <div className="flex justify-between">
                    <span>Last Upload:</span>
                    <span className="font-medium text-slate-900">
                      {new Date(store.lastUploaded).toLocaleString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}
                {store.transactionCount !== undefined && store.transactionCount > 0 && (
                  <div className="flex justify-between">
                    <span>Transactions:</span>
                    <span className="font-medium text-slate-900">
                      {store.transactionCount.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => handleFileSelect(store.id, e)}
                  className="hidden"
                  id={`file-${store.id}`}
                  disabled={store.isUploading}
                />
                <label htmlFor={`file-${store.id}`} className="block">
                  <Button 
                    type="button" 
                    onClick={() => document.getElementById(`file-${store.id}`)?.click()}
                    disabled={store.isUploading}
                    className="w-full flex items-center justify-center"
                    size="sm"
                  >
                    {store.isUploading ? (
                      <>
                        <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span>{store.lastUploaded ? 'Update Data' : 'Upload Data'}</span>
                      </>
                    )}
                  </Button>
                </label>
              </div>
            </Card>
          ))}
        </div>

        {/* Message */}
        {message && (
          <Card className={`p-5 shadow-md ${messageType === 'success' ? 'bg-emerald-50 border-emerald-300' : 'bg-rose-50 border-rose-300'}`}>
            <div className="flex items-center gap-3">
              {messageType === 'success' ? (
                <svg className="w-6 h-6 text-emerald-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-rose-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              <p className={`text-sm font-medium whitespace-pre-line ${messageType === 'success' ? 'text-emerald-900' : 'text-rose-900'}`}>
                {message}
              </p>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
