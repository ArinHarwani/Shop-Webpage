import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { useAdmin } from '../../contexts/AdminContext';
import * as DS from '../../services/DataService';

export default function Settings() {
  const { logout } = useAdmin();
  const [settings, setSettings] = useState(DS.getSettings());
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [settingsSaved, setSettingsSaved] = useState(false);

  const handleSaveSettings = () => {
    DS.updateSettings({
      shopName: settings.shopName,
      deviceLabel: settings.deviceLabel,
    });
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    const currentSettings = DS.getSettings();
    if (passwordForm.current !== currentSettings.adminPassword) {
      setPasswordError('Current password is incorrect');
      return;
    }
    if (passwordForm.new.length < 4) {
      setPasswordError('New password must be at least 4 characters');
      return;
    }
    if (passwordForm.new !== passwordForm.confirm) {
      setPasswordError('New passwords do not match');
      return;
    }

    DS.updateSettings({ adminPassword: passwordForm.new });
    setPasswordForm({ current: '', new: '', confirm: '' });
    setPasswordSuccess('Password changed successfully');
    setTimeout(() => setPasswordSuccess(''), 3000);
  };

  return (
    <AdminLayout>
      <div className="max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 mt-1">Configure your shop portal</p>
        </div>

        <div className="space-y-6">
          {/* Shop Settings */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Shop Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Shop Name</label>
                <input
                  type="text"
                  value={settings.shopName || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, shopName: e.target.value }))}
                  className="input-field"
                  placeholder="DressMirror"
                />
                <p className="text-xs text-gray-400 mt-1">Displayed on the welcome screen and header</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Device Label</label>
                <input
                  type="text"
                  value={settings.deviceLabel || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, deviceLabel: e.target.value }))}
                  className="input-field"
                  placeholder="Tablet 1"
                />
                <p className="text-xs text-gray-400 mt-1">Identifies this device in customer sessions (e.g., Tablet 1, Tablet 2)</p>
              </div>
              <button
                onClick={handleSaveSettings}
                className={`transition-all duration-300 ${settingsSaved ? 'bg-emerald-500 text-white px-6 py-3 rounded-xl font-semibold' : 'btn-primary'}`}
              >
                {settingsSaved ? '✓ Saved' : 'Save Settings'}
              </button>
            </div>
          </div>

          {/* Change Password */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Change Admin Password</h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Current Password</label>
                <input
                  type="password"
                  value={passwordForm.current}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, current: e.target.value }))}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  value={passwordForm.new}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, new: e.target.value }))}
                  className="input-field"
                  required
                  minLength={4}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm: e.target.value }))}
                  className="input-field"
                  required
                />
              </div>
              {passwordError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{passwordError}</div>
              )}
              {passwordSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-600 text-sm">{passwordSuccess}</div>
              )}
              <button type="submit" className="btn-primary">Change Password</button>
            </form>
          </div>

          {/* Data Management */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Data Management</h2>
            <p className="text-sm text-gray-500 mb-4">Reset all data to seed defaults. This will clear all items, sessions, and shortlists.</p>
            <button
              onClick={() => {
                if (window.confirm('Are you sure? This will delete ALL data and reload seed items.')) {
                  localStorage.clear();
                  window.location.reload();
                }
              }}
              className="btn-danger text-sm"
            >
              Reset All Data
            </button>
          </div>

          {/* Logout */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Session</h2>
            <button
              onClick={() => { logout(); window.location.href = '/admin'; }}
              className="btn-secondary text-sm text-red-600 border-red-200 hover:bg-red-50"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
