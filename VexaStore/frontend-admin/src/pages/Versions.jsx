import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, getApiErrorMessage } from '../services/api';
import { useNotification } from '../hooks/useNotification';
import { ArrowLeft, Plus, Trash2, Download, Smartphone, Apple, Window, Linux } from 'lucide-react';

const OS_LABELS = {
  ios: 'iOS',
  android: 'Android',
  windows: 'Windows',
  macos: 'macOS',
  linux: 'Linux',
};

const OS_ICONS = {
  ios: Apple,
  android: Smartphone,
  windows: Window,
  macos: Apple,
  linux: Linux,
};

export default function Versions() {
  const { id } = useParams();
  const [app, setApp] = useState(null);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const { showSuccess, showError } = useNotification();
  
  const [form, setForm] = useState({
    app_id: id,
    version: '',
    os: 'android',
    release_notes: '',
    is_latest: 1,
    file: null,
  });
  
  useEffect(() => {
    loadApp();
  }, [id]);
  
  async function loadApp() {
    try {
      setLoading(true);
      const res = await api.getApp(id);
      setApp(res.data?.data);
      setVersions(res.data?.data?.versions || []);
    } catch (err) {
      showError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm(prev => ({ ...prev, file }));
    }
  };
  
  const handleAddVersion = async (e) => {
    e.preventDefault();
    if (!form.version || !form.os || !form.file) {
      showError('Please fill in all required fields');
      return;
    }
    
    try {
      setSubmitting(true);
      const data = new FormData();
      Object.keys(form).forEach(key => {
        if (key === 'file' && form[key]) {
          data.append(key, form[key]);
        } else if (form[key] !== undefined && form[key] !== null) {
          data.append(key, form[key]);
        }
      });
      
      await api.addVersion(data);
      showSuccess('Version added successfully!');
      setShowAddForm(false);
      setForm({ app_id: id, version: '', os: 'android', release_notes: '', is_latest: 1, file: null });
      loadApp();
    } catch (err) {
      showError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleDeleteVersion = async (versionId) => {
    if (!confirm('Delete this version?')) return;
    try {
      setDeleting(versionId);
      await api.deleteVersion(versionId);
      showSuccess('Version deleted');
      loadApp();
    } catch (err) {
      showError(getApiErrorMessage(err));
    } finally {
      setDeleting(null);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-accent-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <Link to="/apps" className="inline-flex items-center gap-2 text-text-secondary hover:text-white transition">
        <ArrowLeft size={20} /> Back to Apps
      </Link>

      <div className="glass-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{app?.name} — Versions</h1>
            <p className="text-text-secondary">Manage app versions for all platforms</p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={18} /> Add Version
          </button>
        </div>
      </div>

      {/* Add Version Form */}
      {showAddForm && (
        <form onSubmit={handleAddVersion} className="glass-card p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white">New Version</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Version *</label>
              <input
                type="text"
                value={form.version}
                onChange={(e) => setForm(prev => ({ ...prev, version: e.target.value }))}
                placeholder="1.0.0"
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="input-label">Platform *</label>
              <select
                value={form.os}
                onChange={(e) => setForm(prev => ({ ...prev, os: e.target.value }))}
                className="input-field"
                required
              >
                <option value="android">Android (APK)</option>
                <option value="ios">iOS</option>
                <option value="windows">Windows</option>
                <option value="macos">macOS</option>
                <option value="linux">Linux</option>
              </select>
            </div>
          </div>
          <div>
            <label className="input-label">Release Notes</label>
            <textarea
              value={form.release_notes}
              onChange={(e) => setForm(prev => ({ ...prev, release_notes: e.target.value }))}
              placeholder="What's new in this version?"
              className="input-field min-h-[80px] resize-y"
            />
          </div>
          <div>
            <label className="input-label">App File *</label>
            <input
              type="file"
              onChange={handleFileChange}
              className="w-full text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-accent-primary/10 file:text-accent-primary hover:file:bg-accent-primary/20 transition"
              required
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-text-secondary">
              <input
                type="checkbox"
                checked={form.is_latest === 1}
                onChange={(e) => setForm(prev => ({ ...prev, is_latest: e.target.checked ? 1 : 0 }))}
                className="w-4 h-4 accent-accent-primary"
              />
              Set as latest version
            </label>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Adding...' : 'Add Version'}
            </button>
            <button type="button" onClick={() => setShowAddForm(false)} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Versions List */}
      {versions.length > 0 ? (
        <div className="space-y-3">
          {versions.map((v) => {
            const Icon = OS_ICONS[v.os] || Smartphone;
            return (
              <div key={v.id} className="glass-card p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <Icon size={24} className="text-accent-primary" />
                  <div>
                    <p className="font-semibold text-white">
                      {OS_LABELS[v.os] || v.os} {v.version}
                      {v.is_latest === 1 && (
                        <span className="ml-2 text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">Latest</span>
                      )}
                    </p>
                    <p className="text-xs text-text-secondary">
                      Size: {v.file_size || 'N/A'} • Downloads: {v.download_count || 0}
                    </p>
                    {v.release_notes && (
                      <p className="text-xs text-text-secondary mt-1">{v.release_notes}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a 
                    href={`${import.meta.env.VITE_API_BASE_URL}${v.file_url}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg hover:bg-dark-bg/50 text-text-secondary hover:text-white transition"
                    title="Download file"
                  >
                    <Download size={16} />
                  </a>
                  <button
                    onClick={() => handleDeleteVersion(v.id)}
                    disabled={deleting === v.id}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-text-secondary hover:text-red-400 transition disabled:opacity-50"
                  >
                    {deleting === v.id ? (
                      <span className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin inline-block"></span>
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card p-8 text-center text-text-secondary">
          <p>No versions added yet. Add your first version!</p>
        </div>
      )}
    </div>
  );
}