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

  const [locationDetecting, setLocationDetecting] = useState(false);
  const [locationDetectMsg, setLocationDetectMsg] = useState('');

  const handleDetectLocation = () => {
    if (!('geolocation' in navigator)) {
      setLocationDetectMsg('Geolocation is not supported by this browser.');
      return;
    }
    setLocationDetecting(true);
    setLocationDetectMsg('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocationDetecting(false);
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        setSettings(prev => ({
          ...prev,
          shopLat: lat,
          shopLng: lng,
        }));
        setLocationDetectMsg(`✓ Captured location: ${lat}, ${lng} (±${Math.round(pos.coords.accuracy)}m accuracy)`);
        setTimeout(() => setLocationDetectMsg(''), 5000);
      },
      (err) => {
        setLocationDetecting(false);
        setLocationDetectMsg(`Could not retrieve location: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSaveSettings = () => {
    DS.updateSettings({
      shopName: settings.shopName,
      deviceLabel: settings.deviceLabel,
      shopLat: Number(settings.shopLat || 26.279653),
      shopLng: Number(settings.shopLng || 73.010635),
      geofenceRadius: Number(settings.geofenceRadius || 150),
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

          {/* Store Location & Geofencing */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Store Location & Geofencing</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Restricts customer catalog access exclusively to devices physically in the boutique
                </p>
              </div>
              <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-full">
                Active
              </span>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Shop Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={settings.shopLat ?? 26.279653}
                    onChange={(e) => setSettings(prev => ({ ...prev, shopLat: parseFloat(e.target.value) || '' }))}
                    className="input-field"
                    placeholder="26.279653"
                  />
                  <p className="text-xs text-gray-400 mt-1">e.g. 26.279653 (Fever Profile Fashion)</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Shop Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={settings.shopLng ?? 73.010635}
                    onChange={(e) => setSettings(prev => ({ ...prev, shopLng: parseFloat(e.target.value) || '' }))}
                    className="input-field"
                    placeholder="73.010635"
                  />
                  <p className="text-xs text-gray-400 mt-1">e.g. 73.010635 (Sardarpura, Jodhpur)</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Allowed Radius (meters)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="20"
                    max="1000"
                    step="5"
                    value={settings.geofenceRadius ?? 150}
                    onChange={(e) => setSettings(prev => ({ ...prev, geofenceRadius: parseInt(e.target.value, 10) || '' }))}
                    className="input-field max-w-[180px]"
                    placeholder="150"
                  />
                  <span className="text-sm text-gray-500 font-medium">meters around shop</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Indoor GPS typically drifts 20–50m. 150m is the recommended starting radius.
                </p>
              </div>

              {/* Location helper detection */}
              <div className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={locationDetecting}
                  className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
                >
                  <svg className={`w-4 h-4 text-accent ${locationDetecting ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {locationDetecting ? 'Detecting GPS…' : '📍 Use Current Device Location'}
                </button>

                <button
                  onClick={handleSaveSettings}
                  className={`transition-all duration-300 ${settingsSaved ? 'bg-emerald-500 text-white px-6 py-3 rounded-xl font-semibold' : 'btn-primary'}`}
                >
                  {settingsSaved ? '✓ Saved' : 'Save Geofence'}
                </button>
              </div>

              {locationDetectMsg && (
                <div className={`p-3 rounded-xl text-xs ${locationDetectMsg.startsWith('✓') ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-600'}`}>
                  {locationDetectMsg}
                </div>
              )}
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
