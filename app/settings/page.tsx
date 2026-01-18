'use client';

import { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Button, Card, SectionHeader } from '../components/ui';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('password');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    // For now, just show message since password is hardcoded
    setError('Password is hardcoded in the system. To change it, update the HARDCODED_PASSWORD constant in lib/auth.ts');
    
    // Clear form
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <SectionHeader 
          title="Settings"
          description="Manage your dashboard preferences"
        />

        <div className="flex gap-6">
          {/* Tabs */}
          <div className="w-64">
            <Card className="p-3">
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab('password')}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors text-sm ${
                    activeTab === 'password'
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Change Password
                </button>
              </nav>
            </Card>
          </div>

          {/* Content */}
          <div className="flex-1">
            {activeTab === 'password' && (
              <Card className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Change Password</h3>
                
                <form onSubmit={handlePasswordChange} className="space-y-5 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="Enter current password"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="Enter new password"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="Confirm new password"
                      required
                    />
                  </div>

                  {message && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2.5 rounded-lg text-sm">
                      {message}
                    </div>
                  )}

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2.5 rounded-lg text-sm">
                    <p><strong>Note:</strong> Current credentials:</p>
                    <p className="mt-1 text-xs">Email: kpriyesh1908@gmail.com</p>
                    <p className="text-xs">Password: 12345678</p>
                    <p className="mt-2 text-xs">To change, update HARDCODED_PASSWORD in lib/auth.ts</p>
                  </div>

                  <Button type="submit">
                    Update Password
                  </Button>
                </form>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
