// frontend-user/src/pages/settings/DataExport.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNotification } from '../../hooks/useNotification';
import { ArrowLeft, Download, Database, Shield, Clock, FileJson, FileText } from 'lucide-react';

export default function DataExport() {
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState('json');

  const getToken = () => {
    return (
      localStorage.getItem('vexastore_user_token') ||
      localStorage.getItem('userToken') ||
      localStorage.getItem('token') ||
      localStorage.getItem('accessToken') ||
      ''
    );
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        showError('Please login first');
        return;
      }

      const vexaAccountUrl = import.meta.env.VITE_VEXA_ACCOUNT_URL || 'https://api-vexaaccount.onrender.com';
      const response = await fetch(`${vexaAccountUrl}/api/auth/export-data`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        const exportData = data.data;

        // Format data based on selected format
        let content;
        let filename;
        let mimeType;

        if (exportFormat === 'json') {
          content = JSON.stringify(exportData, null, 2);
          filename = `vexastore-export-${new Date().toISOString().split('T')[0]}.json`;
          mimeType = 'application/json';
        } else if (exportFormat === 'csv') {
          // Simple CSV export
          const user = exportData.user || {};
          const rows = [
            ['Field', 'Value'],
            ['Name', user.name || ''],
            ['Email', user.email || ''],
            ['Phone', user.phone || ''],
            ['Bio', user.bio || ''],
            ['Verified', user.is_verified ? 'Yes' : 'No'],
            ['Member Since', new Date(user.created_at).toLocaleDateString()],
            ['', ''],
            ['Activity Log', ''],
          ];
          (exportData.activity || []).forEach(a => {
            rows.push([new Date(a.created_at).toLocaleString(), a.action || '']);
          });
          content = rows.map(row => row.join(',')).join('\n');
          filename = `vexastore-export-${new Date().toISOString().split('T')[0]}.csv`;
          mimeType = 'text/csv';
        } else {
          // Text format
          const user = exportData.user || {};
          const lines = [
            '=== VEXASTORE DATA EXPORT ===',
            `Export Date: ${new Date().toLocaleString()}`,
            '',
            '--- USER INFORMATION ---',
            `Name: ${user.name || 'N/A'}`,
            `Email: ${user.email || 'N/A'}`,
            `Phone: ${user.phone || 'N/A'}`,
            `Bio: ${user.bio || 'N/A'}`,
            `Verified: ${user.is_verified ? 'Yes' : 'No'}`,
            `Member Since: ${new Date(user.created_at).toLocaleDateString()}`,
            '',
            '--- ACTIVITY LOG ---',
          ];
          (exportData.activity || []).forEach(a => {
            lines.push(`${new Date(a.created_at).toLocaleString()} - ${a.action || 'Unknown'}`);
          });
          content = lines.join('\n');
          filename = `vexastore-export-${new Date().toISOString().split('T')[0]}.txt`;
          mimeType = 'text/plain';
        }

        // Download the file
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showSuccess(`Data exported successfully as ${filename}`);
      } else {
        showError(data.message || 'Failed to export data');
      }
    } catch (err) {
      showError('Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Link to="/profile" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition">
        <ArrowLeft size={20} /> Back to Profile
      </Link>

      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-2">
          <Database size={24} className="text-cyan-400" />
          <h1 className="text-2xl font-bold text-white">Data Export</h1>
        </div>
        <p className="text-slate-400">Download your account data</p>
      </div>

      <div className="glass-card p-6 space-y-5">
        <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20">
          <div className="flex items-start gap-3">
            <Shield size={18} className="text-cyan-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-slate-400">
                Your data export includes:
              </p>
              <ul className="text-sm text-slate-400 list-disc list-inside mt-2 space-y-1">
                <li>Profile information (name, email, phone, bio)</li>
                <li>Account status and verification</li>
                <li>Recent activity log</li>
                <li>Connected apps and devices</li>
              </ul>
            </div>
          </div>
        </div>

        <div>
          <label className="input-label">Export Format</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'json', label: 'JSON', icon: FileJson },
              { value: 'csv', label: 'CSV', icon: FileText },
              { value: 'txt', label: 'Text', icon: FileText },
            ].map((format) => (
              <button
                key={format.value}
                onClick={() => setExportFormat(format.value)}
                className={`p-3 rounded-xl border transition flex flex-col items-center gap-1 ${
                  exportFormat === format.value
                    ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400'
                    : 'border-white/10 text-slate-400 hover:border-white/20'
                }`}
              >
                <format.icon size={20} />
                <span className="text-xs font-medium">{format.label}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleExport}
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2 py-3"
        >
          {loading ? (
            <span className="spinner-small" />
          ) : (
            <Download size={18} />
          )}
          {loading ? 'Generating...' : `Export as ${exportFormat.toUpperCase()}`}
        </button>

        <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
          <div className="flex items-start gap-3">
            <Clock size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-slate-400">
              Your data export is for personal use. Please keep it secure and do not share it with others.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
