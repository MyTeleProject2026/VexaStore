import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, getApiErrorMessage } from '../services/api';
import { useNotification } from '../hooks/useNotification';
import { ArrowLeft, Upload, X } from 'lucide-react';

export default function AddApp() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);
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
    icon: null,
    icon_preview: null,
  });

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      const res = await api.getCategories();
      setCategories(res.data?.data || []);
      if (res.data?.data?.length > 0) {
        setForm(prev => ({ ...prev, category_id: String(res.data.data[0].id) }));
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
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
    } else if (name === 'category_id') {
      setForm(prev => ({ ...prev, category_id: value }));
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
    }
  };

  const removeIcon = () => {
    setForm(prev => ({ ...prev, icon: null, icon_preview: null }));
  };

  // ✅ FIXED: handleSubmit with proper FormData
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // ✅ Validate
    if (!form.name || !form.slug || !form.category_id) {
      showError('Name, slug, and category are required');
      return;
    }

    try {
      setLoading(true);
      
      // ✅ Build FormData correctly
      const formData = new FormData();
      
      // ✅ Append each field manually (more reliable)
      formData.append('name', form.name.trim());
      formData.append('slug', form.slug.trim());
      formData.append('category_id', Number(form.category_id));  // ✅ Convert to number
      formData.append('description', form.description || '');
      formData.append('long_description', form.long_description || '');
      formData.append('developer', form.developer || 'VexaTrade');
      formData.append('website', form.website || '');
      formData.append('is_featured', String(form.is_featured));
      
      if (form.icon instanceof File) {
        formData.append('icon', form.icon);
      }

      // ✅ Debug: Log FormData contents
      console.log('📤 Sending FormData:');
      for (let [key, value] of formData.entries()) {
        console.log(`  ${key}: ${value instanceof File ? value.name : value}`);
      }

      const response = await api.createApp(formData);
      console.log('✅ Response:', response);
      
      showSuccess('App created successfully!');
      navigate('/apps');
    } catch (err) {
      console.error('❌ Create app error:', err);
      showError(getApiErrorMessage(err) || 'Failed to create app');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Link to="/apps" className="inline-flex items-center gap-2 text-text-secondary hover:text-white transition">
        <ArrowLeft size={20} /> Back to Apps
      </Link>

      <div className="glass-card p-6">
        <h1 className="text-2xl font-bold text-white">Add New App</h1>
        <p className="text-text-secondary">Create a new app listing on VexaStore</p>
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
              placeholder="Enter app name"
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
              placeholder="app-name"
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
            placeholder="Brief app description"
            className="input-field"
          />
        </div>

        <div>
          <label className="input-label">Full Description</label>
          <textarea
            name="long_description"
            value={form.long_description}
            onChange={handleChange}
            placeholder="Detailed app description"
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
              placeholder="Developer name"
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
              placeholder="https://example.com"
              className="input-field"
            />
          </div>
        </div>

        {/* Icon Upload */}
        <div>
          <label className="input-label">App Icon</label>
          <div className="flex items-center gap-4">
            {form.icon_preview ? (
              <div className="relative">
                <img src={form.icon_preview} alt="Icon preview" className="w-20 h-20 rounded-xl object-cover border border-dark-border" />
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
            <span className="text-xs text-text-secondary">Recommended: 512x512 PNG</span>
          </div>
        </div>

        {/* Feature Toggle */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            name="is_featured"
            checked={form.is_featured === 1}
            onChange={handleChange}
            className="w-4 h-4 accent-accent-primary"
          />
          <label className="text-sm text-text-secondary">Feature this app on homepage</label>
        </div>

        <div className="flex gap-3 pt-4 border-t border-dark-border">
          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-black/30 border-t-transparent rounded-full animate-spin"></span>
                Creating...
              </>
            ) : (
              'Create App'
            )}
          </button>
          <Link to="/apps" className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  );
}