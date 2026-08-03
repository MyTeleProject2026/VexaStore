import { useState, useEffect } from 'react';
import { api, getApiErrorMessage } from '../services/api';
import { useNotification } from '../hooks/useNotification';
import { Plus, Edit, Trash2, Tag, X } from 'lucide-react';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', slug: '', icon: '', sort_order: 0 });
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      setLoading(true);
      const res = await api.getCategories();
      setCategories(res.data?.data || []);
    } catch (err) {
      showError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function generateSlug(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.slug) {
      showError('Name and slug required');
      return;
    }
    try {
      // Use admin API to create/update category
      const endpoint = editing ? `/admin/categories/${editing}` : '/admin/categories';
      const method = editing ? 'put' : 'post';
      await api[method](endpoint, form);
      showSuccess(editing ? 'Category updated' : 'Category created');
      setShowModal(false);
      setEditing(null);
      setForm({ name: '', slug: '', icon: '', sort_order: 0 });
      loadCategories();
    } catch (err) {
      showError(getApiErrorMessage(err));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this category?')) return;
    try {
      await api.delete(`/admin/categories/${id}`);
      showSuccess('Category deleted');
      loadCategories();
    } catch (err) {
      showError(getApiErrorMessage(err));
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-accent-primary border-t-transparent rounded-full"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Categories</h1>
          <p className="text-text-secondary">Manage app categories</p>
        </div>
        <button onClick={() => { setEditing(null); setForm({ name: '', slug: '', icon: '', sort_order: 0 }); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Add Category
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <div key={cat.id} className="glass-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-primary/10 flex items-center justify-center">
                <Tag size={18} className="text-accent-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-white">{cat.name}</h3>
                <p className="text-xs text-text-secondary">/{cat.slug}</p>
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => { setEditing(cat.id); setForm(cat); setShowModal(true); }} className="p-2 rounded-lg hover:bg-white/5 text-text-secondary hover:text-white transition">
                <Edit size={16} />
              </button>
              <button onClick={() => handleDelete(cat.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-text-secondary hover:text-red-400 transition">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="glass-card max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">{editing ? 'Edit' : 'Add'} Category</h2>
              <button onClick={() => setShowModal(false)} className="text-text-secondary hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="input-label">Name *</label>
                <input className="input-field" value={form.name} onChange={e => setForm({...form, name: e.target.value, slug: generateSlug(e.target.value)})} required />
              </div>
              <div>
                <label className="input-label">Slug *</label>
                <input className="input-field" value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} required />
              </div>
              <div>
                <label className="input-label">Icon (optional)</label>
                <input className="input-field" value={form.icon || ''} onChange={e => setForm({...form, icon: e.target.value})} placeholder="e.g., Apple, Android" />
              </div>
              <div>
                <label className="input-label">Sort Order</label>
                <input type="number" className="input-field" value={form.sort_order || 0} onChange={e => setForm({...form, sort_order: Number(e.target.value)})} />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary flex-1">{editing ? 'Update' : 'Create'}</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}