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
          filename = `vexastore-export-${new Date().toISO
