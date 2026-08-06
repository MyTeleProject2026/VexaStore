import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useNotification } from '../hooks/useNotification';
import { authApi, api } from '../services/api';
import { 
  User, Mail, Phone, Camera, LogOut, 
  Shield, Lock, Globe, Smartphone, 
  ChevronRight, CheckCircle, Edit2, 
  ArrowLeft, Database, 
  Clock, Layers, Key, Eye, EyeOff, Save,
  Download, Trash2, Activity
} from 'lucide-react';

export default function Profile() {
  const navigate = useNavigate();
  const { showSuccess, showError, showInfo } = useNotification();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('personal');
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', bio: '' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [twofaEnabled, setTwofaEnabled] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await authApi.getProfile();
      if (res.data?.success) {
        setUser(res.data.user);
        setTwofaEnabled(res.data.user.twofa_enabled === 1);
        setForm({
          name: res.data.user.name || '',
          phone: res.data.user.phone || '',
          bio: res.data.user.bio || '',
        });
      } else {
        showError(res.data?.message || 'Failed to load profile');
      }
    } catch (err) {
      console.error('Profile fetch error:', err.response?.data || err.message);
      showError(err.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const res = await authApi.updateProfileFull({
        name: form.name,
        phone: form.phone,
        bio: form.bio,
      });
      if (res.data?.success) {
        setUser(res.data.user);
        setEditMode(false);
        const stored = localStorage.getItem('vexastore_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.name = res.data.user.name;
          localStorage.setItem('vexastore_user', JSON.stringify(parsed));
        }
        showSuccess('Profile updated');
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('avatar', file);
    
    try {
      setUploading(true);
      const res = await api.post('/api/upload/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.success) {
        const avatar_url = res.data.avatar_url;
        await authApi.updateProfilePicture(avatar_url);
        showSuccess('Avatar updated');
        fetchProfile();
      }
    } catch (err) {
      showError('Avatar upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleEnable2FA = async () => {
    try {
      const res = await authApi.enable2FA();
      if (res.data?.success) {
        setTwofaEnabled(true);
        const codes = res.data.backup_codes?.join(', ') || '';
        showSuccess(`2FA Enabled! Backup codes: ${codes}`);
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to enable 2FA');
    }
  };

  const handleDisable2FA = async () => {
    if (!confirm('Disable 2FA? This will reduce account security.')) return;
    try {
      await authApi.disable2FA();
      setTwofaEnabled(false);
      showSuccess('2FA disabled');
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to disable 2FA');
    }
  };

  const handleExportData = async () => {
    try {
      const res = await authApi.exportData();
      if (res.data?.success) {
        const blob = new Blob([JSON.stringify(res.data.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vexastore-data-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showSuccess('Data exported successfully');
      }
    } catch (err) {
      showError('Failed to export data');
    }
  };

  const handleDeleteAccount = async () => {
    const confirmText = prompt('Type "DELETE" to confirm account deletion:');
    if (confirmText === 'DELETE') {
      try {
        await authApi.deleteAccount({ confirm: confirmText });
        showSuccess('Account deleted successfully');
        localStorage.removeItem('vexastore_user_token');
        localStorage.removeItem('vexastore_user');
        navigate('/');
      } catch (err) {
        showError(err.response?.data?.message || 'Failed to delete account');
      }
    } else if (confirmText
