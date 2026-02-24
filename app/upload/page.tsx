'use client';

import { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Card, Button, Modal } from '../components/ui';

interface StoreMapping {
  file: File;
  storeName: string;
  platform: 'takemypayments' | 'booker';
}

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [storeMappings, setStoreMappings] = useState<StoreMapping[]>([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(selectedFiles);
      
      // Auto-create mappings
      const mappings: StoreMapping[] = selectedFiles.map((file, index) => ({
        file,
        storeName: `Store ${index + 1}`,
        platform: 'takemypayments' // Default
      }));
      setStoreMappings(mappings);
    }
  };

  const updateMapping = (index: number, field: 'storeName' | 'platform', value: string) => {
    const updated = [...storeMappings];
    updated[index] = { ...updated[index], [field]: value };
    setStoreMappings(updated);
  };

  const handleUpload = async () => {
    setShowConfirmModal(false);
    setUploading(true);
    setMessage('');

    try {
      const formData = new FormData();
      
      storeMappings.forEach((mapping, index) => {
        formData.append(`file_${index}`, mapping.file);
        formData.append(`storeName_${index}`, mapping.storeName);
        formData.append(`platform_${index}`, mapping.platform);
      });
      
      formData.append('fileCount', storeMappings.length.toString());

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`✅ Successfully uploaded ${data.transactionsCount} transactions from ${data.storesCount} stores!`);
        setFiles([]);
        setStoreMappings([]);
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage('❌ Failed to upload files. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Upload Data Files</h1>
          <p className="text-base text-slate-600 mt-2 font-medium">
            Upload CSV/Excel files from TakeMyPayments and Booker
          </p>
        </div>

        {/* Upload Area */}
        <Card className="p-8 mb-6">
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center hover:border-slate-400 transition-colors">
            <svg className="w-16 h-16 mx-auto text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Select Files to Upload</h3>
            <p className="text-sm text-slate-600 mb-4">
              Supports .csv, .xlsx, and .xls files
            </p>
            <input
              type="file"
              multiple
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <Button type="button" onClick={() => document.getElementById('file-upload')?.click()}>
                Choose Files
              </Button>
            </label>
          </div>
        </Card>

        {/* File Mappings */}
        {storeMappings.length > 0 && (
          <Card className="p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Configure Stores ({storeMappings.length} files)</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
              {storeMappings.map((mapping, index) => (
                <div key={index} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">File Name</label>
                      <input
                        type="text"
                        value={mapping.file.name}
                        disabled
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Store Name *</label>
                      <input
                        type="text"
                        value={mapping.storeName}
                        onChange={(e) => updateMapping(index, 'storeName', e.target.value)}
                        placeholder="e.g., Downtown Branch"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-slate-400"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Platform *</label>
                      <select
                        value={mapping.platform}
                        onChange={(e) => updateMapping(index, 'platform', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-slate-400"
                      >
                        <option value="takemypayments">TakeMyPayments</option>
                        <option value="booker">Booker</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Warning & Upload Button */}
        {storeMappings.length > 0 && (
          <>
            <Card className="p-4 mb-6 bg-amber-50 border-amber-200">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-amber-900">⚠️ This will replace all existing data</p>
                  <p className="text-xs text-amber-700 mt-1">
                    All previous transactions will be deleted and replaced with the new uploaded data.
                  </p>
                </div>
              </div>
            </Card>

            <div className="flex gap-4">
              <Button 
                onClick={() => setShowConfirmModal(true)} 
                disabled={uploading}
                size="lg"
              >
                {uploading ? 'Uploading...' : 'Upload & Replace Data'}
              </Button>
              {!uploading && (
                <Button 
                  onClick={() => { setFiles([]); setStoreMappings([]); }} 
                  variant="outline"
                  size="lg"
                >
                  Cancel
                </Button>
              )}
            </div>
          </>
        )}

        {/* Message */}
        {message && (
          <Card className={`p-4 mt-6 ${message.includes('✅') ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
            <p className={`text-sm font-medium ${message.includes('✅') ? 'text-emerald-900' : 'text-rose-900'}`}>
              {message}
            </p>
          </Card>
        )}

        {/* Confirmation Modal */}
        <Modal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} title="Confirm Data Replacement">
          <div className="space-y-4">
            <p className="text-slate-700">
              You are about to upload <span className="font-semibold">{storeMappings.length} file(s)</span> and replace all existing data.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-900 font-medium">
                ⚠️ This action cannot be undone. All previous data will be permanently deleted.
              </p>
            </div>
            <div className="flex gap-3 pt-4">
              <Button onClick={handleUpload} className="flex-1">
                Yes, Replace Data
              </Button>
              <Button onClick={() => setShowConfirmModal(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
