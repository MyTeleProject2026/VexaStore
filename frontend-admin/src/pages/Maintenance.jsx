import { useState, useEffect } from 'react';
import { api, getApiErrorMessage } from '../services/api';
import { useNotification } from '../hooks/useNotification';
import { Shield, RefreshCw, AlertTriangle, Clock, Save } from 'lucide-react';

export default function Maintenance() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    is_enabled: false,
    message: '',
    scheduled_end: '',
  });
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      const res = await api.getMaintenanceStatus();
      if (res.data?.success) {
        setSettings({
          is_enabled: res.data.data.is_enabled || false,
          message: res.data.data.message || '🚧 VexaStore is currently under maintenance. We\'ll be back soon!',
          scheduled_end: res.data.data.scheduled_end || '',
        });
      }
    } catch (err) {
      showError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle() {
    try {
      setSaving(true);
      await api.toggleMaintenance({
        enabled: !settings.is_enabled ? 1 : 0,
        message: settings.message,
        scheduled_end: settings.scheduled_end || null,
      });
      setSettings(prev => ({ ...prev, is_enabled: !prev.is_enabled }));
      showSuccess(`Maintenance mode ${!settings.is_enabled ? 'enabled' : 'disabled'}`);
      loadSettings();
    } catch (err) {
      showError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveMessage() {
    try {
      setSaving(true);
      await api.toggleMaintenance({
        enabled: settings.is_enabled ? 1 : 0,
        message: settings.message,
        scheduled_end: settings.scheduled_end || null,
      });
      showSuccess('Maintenance settings saved');
    } catch (err) {
      showError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-accent-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Maintenance</h1>
          <p className="text-text-secondary">Manage maintenance mode for VexaStore</p>
        </div>
      </div>

      <div className={`glass-card p-6 ${settings.is_enabled ? 'border-amber-500/30' : ''}`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${settings.is_enabled ? 'bg-amber-500/20' : 'bg-emerald-500/20'}`}>
              {settings.is_enabled ? (
                <AlertTriangle size={24} className="text-amber-400" />
              ) : (
                <Shield size={24} className="text-emerald-400" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                {settings.is_enabled ? 'Maintenance Mode Active' : 'Maintenance Mode Inactive'}
              </h3>
              <p className="text-sm text-text-secondary">
                {settings.is_enabled 
                  ? 'Users will see the maintenance page when visiting VexaStore'
                  : 'VexaStore is fully accessible to users'
                }
              </p>
            </div>
          </div>
          <button
            onClick={handleToggle}
            disabled={saving}
            className={`px-6 py-3 rounded-xl font-semibold transition ${settings.is_enabled 
              ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' 
              : 'bg-accent-primary/10 text-accent-primary hover:bg-accent-primary/20'
            }`}
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                Processing...
              </span>
            ) : (
              settings.is_enabled ? 'Disable Maintenance' : 'Enable Maintenance'
            )}
          </button>
        </div>
      </div>

      <div className="glass-card p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white">Maintenance Settings</h3>
        
        <div>
          <label className="input-label">Maintenance Message</label>
          <textarea
            value={settings.message}
            onChange={(e) => setSettings(prev => ({ ...prev, message: e.target.value }))}
            placeholder="Enter the message users will see during maintenance"
            className="input-field min-h-[100px] resize-y"
          />
          <p className="text-xs text-text-secondary mt-1">This message will be shown to all users during maintenance</p>
        </div>

        <div>
          <label className="input-label">Scheduled End Time (Optional)</label>
          <input
            type="datetime-local"
            value={settings.scheduled_end}
            onChange={(e) => setSettings(prev => ({ ...prev, scheduled_end: e.target.value }))}
            className="input-field"
          />
          <p className="text-xs text-text-secondary mt-1">Users will see when maintenance is expected to end</p>
        </div>

        <button
          onClick={handleSaveMessage}
          disabled={saving}
          className="btn-primary flex items-center gap-2"
        >
          <Save size={18} />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Preview</h3>
        <div className="bg-dark-bg rounded-xl p-6 border border-dark-border">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={28} className="text-amber-400" />
            </div>
            <h4 className="text-xl font-bold text-white">Under Maintenance</h4>
            <p className="text-text-secondary mt-2 max-w-md mx-auto">
              {settings.message || '🚧 VexaStore is currently under maintenance. We\'ll be back soon!'}
            </p>
            {settings.scheduled_end && (
              <div className="flex items-center justify-center gap-2 mt-3 text-sm text-text-secondary">
                <Clock size={16} />
                <span>Expected completion: {new Date(settings.scheduled_end).toLocaleString()}</span>
              </div>
            )}
            <div className="mt-4 px-4 py-2 rounded-xl bg-dark-card border border-dark-border inline-block">
              <RefreshCw size={16} className="text-accent-primary animate-spin" />
              <span className="ml-2 text-sm text-text-secondary">Users can refresh to check status</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
