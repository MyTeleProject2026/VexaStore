import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api, getApiErrorMessage } from '../services/api';
import { useNotification } from '../hooks/useNotification';
import { ArrowLeft, Upload, X } from 'lucide-react';

export default function EditApp() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    long_description: '',
    category_id: '',
    developer: 'VexaTrade',
    website: '',
    is_featured: 0,
    is_active: 1,
    icon: null,
    icon_preview: null,
  });
  const [existingIcon, setExistingIcon] = useState(null);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    try {
      setLoading(true);
      const [appRes, catRes] = await Promise.all([
        api.getApp(id),
        api.getCategories(),
      ]);
      
      const app = appRes.data?.data;
      if (app) {
        setForm({
          name: app.name || '',
          slug: app.slug || '',
          description: app.description || '',
          long_description: app.long_description || '',
          category_id: app.category_id || '',
          developer: app.developer || 'VexaTrade',
          website: app.website || '',
          is_featured: app.is_featured || 0,
          is_active: app.is_active !== undefined ? app.is_active : 1,
          icon: null,
          icon_preview: null,
        });
        if (app.icon_url) {
          setExistingIcon(`${import.meta.env.VITE_API_BASE_URL}${app.icon_url}`);
        }
      }
      setCategories(catRes.data?.data || []);
    } catch (err) {
      showError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function generateSlug(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'name') {
      const slug = generateSlug(value);
      setForm(prev => ({ ...prev, [name]: value, slug }));
    } else {
      setForm(prev => ({ 
        ...prev, 
        [name]: type === 'checkbox' ? (checked ? 1 : 0) : value 
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm(prev => ({
        ...prev,
        icon: file,
        icon_preview: URL.createObjectURL(file),
      }));
      setExistingIcon(null);
    }
  };

  const removeIcon = () => {
    setForm(prev => ({ ...prev, icon: null, icon_preview: null }));
    setExistingIcon(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.slug || !form.category_id) {
      showError('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      const data = new FormData();
      Object.keys(form).forEach(key => {
        if (key === 'icon' && form[key] instanceof File) {
          data.append(key, form[key]);
        } else if (key !== 'icon_preview' && form[key] !== undefined && form[key] !== null) {
          data.append(key, form[key]);
        }
      });

      await api.updateApp(id, data);
      showSuccess('App updated successfully!');
      navigate('/apps');
    } catch (err) {
      showError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
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
        <h1 className="text-2xl font-bold text-white">Edit App</h1>
        <p className="text-text-secondary">Update app details on VexaStore</p>
      </div>

      <form onSubmit={handleSubmit} className="glass-card p-6 space-y-5">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="input-label">App Name *</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="input-label">Slug *</label>
            <input
              type="text"
              name="slug"
              value={form.slug}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>
        </div>

        <div>
          <label className="input-label">Category *</label>
          <select
            name="category_id"
            value={form.category_id}
            onChange={handleChange}
            className="input-field"
            required
          >
            <option value="">Select category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="input-label">Short Description</label>
          <input
            type="text"
            name="description"
            value={form.description}
            onChange={handleChange}
            className="input-field"
          />
        </div>

        <div>
          <label className="input-label">Full Description</label>
          <textarea
            name="long_description"
            value={form.long_description}
            onChange={handleChange}
            className="input-field min-h-[120px] resize-y"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="input-label">Developer</label>
            <input
              type="text"
              name="developer"
              value={form.developer}
              onChange={handleChange}
              className="input-field"
            />
          </div>
          <div>
            <label className="input-label">Website</label>
            <input
              type="url"
              name="website"
              value={form.website}
              onChange={handleChange}
              className="input-field"
            />
          </div>
        </div>

        {/* Icon Upload */}
        <div>
          <label className="input-label">App Icon</label>
          <div className="flex items-center gap-4">
            {(form.icon_preview || existingIcon) ? (
              <div className="relative">
                <img 
                  src={form.icon_preview || existingIcon} 
                  alt="Icon preview" 
                  className="w-20 h-20 rounded-xl object-cover border border-dark-border" 
                />
                <button
                  type="button"
                  onClick={removeIcon}
                  className="absolute -top-2 -right-2 p-1 rounded-full bg-red-500/80 text-white hover:bg-red-500 transition"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label className="w-20 h-20 rounded-xl border-2 border-dashed border-dark-border flex items-center justify-center cursor-pointer hover:border-accent-primary transition">
                <Upload size={24} className="text-text-secondary" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
            <span className="text-xs text-text-secondary">Upload new icon to replace</span>
          </div>
        </div>

        {/* Toggles */}
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm text-text-secondary">
            <input
              type="checkbox"
              name="is_featured"
              checked={form.is_featured === 1}
              onChange={handleChange}
              className="w-4 h-4 accent-accent-primary"
            />
            Featured
          </label>
          <label className="flex items-center gap-2 text-sm text-text-secondary">
            <input
              type="checkbox"
              name="is_active"
              checked={form.is_active === 1}
              onChange={handleChange}
              className="w-4 h-4 accent-accent-primary"
            />
            Active
          </label>
        </div>

        <div className="flex gap-3 pt-4 border-t border-dark-border">
          <button type="submit" disabled={submitting} className="btn-primary flex items-center gap-2">
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-black/30 border-t-transparent rounded-full animate-spin"></span>
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
          <Link to="/apps" className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  );
}