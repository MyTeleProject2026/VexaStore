import { useState, useEffect } from 'react';
import { api, getApiErrorMessage } from '../services/api';
import { useNotification } from '../hooks/useNotification';
import { Save, Upload } from 'lucide-react';

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    site_title: '',
    site_subtitle: '',
    primary_color: '#06b6d4',
    secondary_color: '#10b981',
    background_color: '#050812',
    font_family: 'Inter',
    custom_css: '',
    custom_header_html: '',
    custom_footer_html: '',
    logo_url: '',
    favicon_url: ''
  });
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      const res = await api.get('/admin/settings');
      if (res.data?.success) {
        setSettings(res.data.data);
      }
    } catch (err) {
      showError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      await api.put('/admin/settings', settings);
      showSuccess('Settings updated');
    } catch (err) {
      showError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleFileUpload(field, file) {
    const formData = new FormData();
    formData.append(field, file);
    try {
      const res = await api.post(`/admin/settings/upload-${field}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.success) {
        setSettings(prev => ({ ...prev, [field === 'logo' ? 'logo_url' : 'favicon_url']: res.data[field + '_url'] }));
        showSuccess(`${field} uploaded`);
      }
    } catch (err) {
      showError(getApiErrorMessage(err));
    }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-accent-primary border-t-transparent rounded-full"></div></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Site Settings</h1>
      <div className="glass-card p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="input-label">Site Title</label>
            <input className="input-field" value={settings.site_title} onChange={e => setSettings({...settings, site_title: e.target.value})} />
          </div>
          <div>
            <label className="input-label">Site Subtitle</label>
            <input className="input-field" value={settings.site_subtitle} onChange={e => setSettings({...settings, site_subtitle: e.target.value})} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="input-label">Primary Color</label>
            <input type="color" className="input-field p-1 h-12" value={settings.primary_color} onChange={e => setSettings({...settings, primary_color: e.target.value})} />
          </div>
          <div>
            <label className="input-label">Secondary Color</label>
            <input type="color" className="input-field p-1 h-12" value={settings.secondary_color} onChange={e => setSettings({...settings, secondary_color: e.target.value})} />
          </div>
          <div>
            <label className="input-label">Background Color</label>
            <input type="color" className="input-field p-1 h-12" value={settings.background_color} onChange={e => setSettings({...settings, background_color: e.target.value})} />
          </div>
        </div>
        <div>
          <label className="input-label">Font Family</label>
          <input className="input-field" value={settings.font_family} onChange={e => setSettings({...settings, font_family: e.target.value})} />
        </div>
        <div>
          <label className="input-label">Custom CSS</label>
          <textarea className="input-field min-h-[100px]" value={settings.custom_css} onChange={e => setSettings({...settings, custom_css: e.target.value})} />
        </div>
        <div>
          <label className="input-label">Custom Header HTML</label>
          <textarea className="input-field min-h-[80px]" value={settings.custom_header_html} onChange={e => setSettings({...settings, custom_header_html: e.target.value})} />
        </div>
        <div>
          <label className="input-label">Custom Footer HTML</label>
          <textarea className="input-field min-h-[80px]" value={settings.custom_footer_html} onChange={e => setSettings({...settings, custom_footer_html: e.target.value})} />
        </div>
        <div className="flex flex-wrap gap-6">
          <div>
            <label className="input-label">Logo</label>
            <div className="flex items-center gap-4">
              {settings.logo_url && <img src={settings.logo_url} className="h-12 w-auto" alt="logo" />}
              <label className="btn-secondary cursor-pointer">
                <Upload size={16} className="inline mr-2" /> Upload Logo
                <input type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload('logo', e.target.files[0])} />
              </label>
            </div>
          </div>
          <div>
            <label className="input-label">Favicon</label>
            <div className="flex items-center gap-4">
              {settings.favicon_url && <img src={settings.favicon_url} className="h-8 w-auto" alt="favicon" />}
              <label className="btn-secondary cursor-pointer">
                <Upload size={16} className="inline mr-2" /> Upload Favicon
                <input type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload('favicon', e.target.files[0])} />
              </label>
            </div>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
          <Save size={18} /> {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}