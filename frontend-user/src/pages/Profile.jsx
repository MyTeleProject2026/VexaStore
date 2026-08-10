// frontend-user/src/pages/Profile.jsx
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useNotification } from '../hooks/useNotification';
import {
  User, Mail, Phone, Camera, LogOut,
  Shield, Lock, Globe, Smartphone,
  ChevronRight, CheckCircle, Edit2,
  ArrowLeft, Database,
  Clock, Layers, Key, Eye, EyeOff, Save,
  Download, Trash2, Activity, TrendingUp, Wallet,
  Settings, Heart, Award, Zap, Sparkles
} from 'lucide-react';
import UserAvatar from '../components/UserAvatar';

export default function Profile() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('personal');
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', bio: '' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [twofaEnabled, setTwofaEnabled] = useState(false);
  const [stats, setStats] = useState({
    downloads: 0,
    favorites: 0,
    reviews: 0,
    memberSince: ''
  });

  const getUserFromStorage = () => {
    try {
      const data =
        localStorage.getItem('vexastore_user') ||
        localStorage.getItem('user') ||
        localStorage.getItem('userData');
      if (data) return JSON.parse(data);
      return null;
    } catch {
      return null;
    }
  };

  const getToken = () => {
    return (
      localStorage.getItem('vexastore_user_token') ||
      localStorage.getItem('userToken') ||
      localStorage.getItem('token') ||
      localStorage.getItem('accessToken') ||
      ''
    );
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);

      const token = getToken();
      if (!token) {
        const storedUser = getUserFromStorage();
        if (storedUser) {
          setUser(storedUser);
          setTwofaEnabled(storedUser.twofa_enabled === 1);
          setForm({
            name: storedUser.name || '',
            phone: storedUser.phone || '',
            bio: storedUser.bio || '',
          });
        }
        setLoading(false);
        return;
      }

      const vexaAccountUrl = import.meta.env.VITE_VEXA_ACCOUNT_URL || 'https://api-vexaaccount.onrender.com';
      const response = await fetch(`${vexaAccountUrl}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();

      if (data.success) {
        const userData = data.user;
        setUser(userData);
        setTwofaEnabled(userData.twofa_enabled === 1);
        setForm({
          name: userData.name || '',
          phone: userData.phone || '',
          bio: userData.bio || '',
        });

        // Try to get stats
        try {
          const vexaStoreUrl = import.meta.env.VITE_API_BASE_URL || 'https://vexastore-backend.onrender.com';
          const statsRes = await fetch(`${vexaStoreUrl}/api/user/stats`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const statsData = await statsRes.json();
          if (statsData.success) {
            setStats(statsData.data);
          }
        } catch {
          // Stats are optional
        }
      } else {
        const storedUser = getUserFromStorage();
        if (storedUser) {
          setUser(storedUser);
          setTwofaEnabled(storedUser.twofa_enabled === 1);
          setForm({
            name: storedUser.name || '',
            phone: storedUser.phone || '',
            bio: storedUser.bio || '',
          });
        }
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
      const storedUser = getUserFromStorage();
      if (storedUser) {
        setUser(storedUser);
        setTwofaEnabled(storedUser.twofa_enabled === 1);
        setForm({
          name: storedUser.name || '',
          phone: storedUser.phone || '',
          bio: storedUser.bio || '',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);

      const token = getToken();
      if (!token) {
        showError('Please login first');
        return;
      }

      const vexaAccountUrl = import.meta.env.VITE_VEXA_ACCOUNT_URL || 'https://api-vexaaccount.onrender.com';
      const response = await fetch(`${vexaAccountUrl}/api/auth/profile/full`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          bio: form.bio,
        })
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.user);
        setEditMode(false);

        const stored = getUserFromStorage();
        if (stored) {
          const updated = { ...stored, ...data.user };
          localStorage.setItem('vexastore_user', JSON.stringify(updated));
          localStorage.setItem('user', JSON.stringify(updated));
          localStorage.setItem('userData', JSON.stringify(updated));
        }

        showSuccess('Profile updated');
      } else {
        showError(data.message || 'Update failed');
      }
    } catch (err) {
      showError(err.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);

      const token = getToken();
      if (!token) {
        showError('Please login first');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result;

        const vexaAccountUrl = import.meta.env.VITE_VEXA_ACCOUNT_URL || 'https://api-vexaaccount.onrender.com';
        const response = await fetch(`${vexaAccountUrl}/api/auth/profile/picture`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ avatar_url: base64String })
        });

        const data = await response.json();
        if (data.success) {
          showSuccess('Avatar updated');
          fetchProfile();
        } else {
          showError(data.message || 'Avatar update failed');
        }
      };
      reader.readAsDataURL(file);

    } catch (err) {
      showError('Avatar upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      const token = getToken();
      if (!token) {
        showError('Please login first');
        return;
      }

      const vexaAccountUrl = import.meta.env.VITE_VEXA_ACCOUNT_URL || 'https://api-vexaaccount.onrender.com';
      const response = await fetch(`${vexaAccountUrl}/api/auth/resend
