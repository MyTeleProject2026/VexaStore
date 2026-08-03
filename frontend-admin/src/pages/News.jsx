import { useState, useEffect } from 'react';
import { api, getApiErrorMessage } from '../services/api';
import { useNotification } from '../hooks/useNotification';
import { Plus, Edit, Trash2, Newspaper, X, Upload } from 'lucide-react';

export default function News() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    title: '',
    slug: '',
    content: '',
    is_featured: 0,
    is_published: 1,
    image: null,
    image_preview: null
  });
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    loadArticles();
  }, []);

  async function loadArticles() {
    try {
      setLoading(true);
      // ✅ UPDATED: Use getNews()
      const res = await api.getNews();
      setArticles(res.data?.data || []);
    } catch (err) {
      showError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function generateSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm(prev => ({
        ...prev,
        image: file,
        image_preview: URL.createObjectURL(file)
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.slug || !form.content) {
      showError('Title, slug, and content are required');
      return;
    }

    try {
      const data = new FormData();
      Object.keys(form).forEach(key => {
        if (key === 'image' && form[key] instanceof File) {
          data.append('image', form[key]);
        } else if (key !== 'image_preview' && form[key] !== undefined && form[key] !== null) {
          data.append(key, form[key]);
        }
      });

      // ✅ UPDATED: Use createNews() and updateNews()
      if (editing) {
        await api.updateNews(editing, data);
        showSuccess('Article updated');
      } else {
        await api.createNews(data);
        showSuccess('Article created');
      }
      
      setShowModal(false);
      setEditing(null);
      setForm({ title: '', slug: '', content: '', is_featured: 0, is_published: 1, image: null, image_preview: null });
      loadArticles();
    } catch (err) {
      showError(getApiErrorMessage(err));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this article?')) return;
    try {
      // ✅ UPDATED: Use deleteNews()
      await api.deleteNews(id);
      showSuccess('Article deleted');
      loadArticles();
    } catch (err) {
      showError(getApiErrorMessage(err));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-accent-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">News & Articles</h1>
          <p className="text-text-secondary">Manage announcements and updates</p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setForm({ title: '', slug: '', content: '', is_featured: 0, is_published: 1, image: null, image_preview: null });
            setShowModal(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} /> Add Article
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {articles.map((article) => (
          <div key={article.id} className="glass-card p-4 hover:border-accent-primary/30 transition">
            {article.image_url && (
              <img src={article.image_url} alt={article.title} className="w-full h-40 object-cover rounded-xl mb-3" />
            )}
            <h3 className="font-semibold text-white line-clamp-2">{article.title}</h3>
            <p className="text-xs text-text-secondary mt-1 line-clamp-2">{article.content?.replace(/<[^>]*>/g, '').slice(0, 100)}</p>
            <div className="flex items-center gap-2 mt-2">
              {article.is_featured && <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">Featured</span>}
              {article.is_published ? (
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">Published</span>
              ) : (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">Draft</span>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-dark-border">
              <button
                onClick={() => {
                  setEditing(article.id);
                  setForm({
                    title: article.title,
                    slug: article.slug,
                    content: article.content,
                    is_featured: article.is_featured || 0,
                    is_published: article.is_published !== undefined ? article.is_published : 1,
                    image: null,
                    image_preview: article.image_url || null
                  });
                  setShowModal(true);
                }}
                className="p-2 rounded-lg hover:bg-white/5 text-text-secondary hover:text-white transition"
              >
                <Edit size={16} />
              </button>
              <button
                onClick={() => handleDelete(article.id)}
                className="p-2 rounded-lg hover:bg-red-500/10 text-text-secondary hover:text-red-400 transition"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {articles.length === 0 && (
        <div className="glass-card p-8 text-center text-text-secondary">
          <Newspaper size={48} className="mx-auto text-text-secondary/30 mb-4" />
          <p>No articles yet. Create your first announcement!</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto">
          <div className="glass-card max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">{editing ? 'Edit' : 'Add'} Article</h2>
              <button onClick={() => setShowModal(false)} className="text-text-secondary hover:text-white">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="input-label">Title *</label>
                <input
                  className="input-field"
                  value={form.title}
                  onChange={e => setForm({...form, title: e.target.value, slug: generateSlug(e.target.value)})}
                  required
                />
              </div>
              <div>
                <label className="input-label">Slug *</label>
                <input
                  className="input-field"
                  value={form.slug}
                  onChange={e => setForm({...form, slug: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="input-label">Content (HTML) *</label>
                <textarea
                  className="input-field min-h-[200px] font-mono text-sm"
                  value={form.content}
                  onChange={e => setForm({...form, content: e.target.value})}
                  placeholder="<p>Your article content here...</p>"
                  required
                />
              </div>
              <div>
                <label className="input-label">Image</label>
                <div className="flex items-center gap-4">
                  {form.image_preview && (
                    <img src={form.image_preview} alt="Preview" className="h-20 w-auto rounded-lg object-cover" />
                  )}
                  <label className="btn-secondary cursor-pointer">
                    <Upload size={16} className="inline mr-2" /> Upload Image
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  </label>
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm text-text-secondary">
                  <input
                    type="checkbox"
                    checked={form.is_featured === 1}
                    onChange={e => setForm({...form, is_featured: e.target.checked ? 1 : 0})}
                    className="w-4 h-4 accent-accent-primary"
                  />
                  Featured
                </label>
                <label className="flex items-center gap-2 text-sm text-text-secondary">
                  <input
                    type="checkbox"
                    checked={form.is_published === 1}
                    onChange={e => setForm({...form, is_published: e.target.checked ? 1 : 0})}
                    className="w-4 h-4 accent-accent-primary"
                  />
                  Published
                </label>
              </div>
              <div className="flex gap-3 pt-4 border-t border-dark-border">
                <button type="submit" className="btn-primary flex-1">
                  {editing ? 'Update' : 'Create'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}