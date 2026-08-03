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
  const [submitting, setSubmitting] = useState(false);
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    loadArticles();
  }, []);

  async function loadArticles() {
    try {
      setLoading(true);
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
    
    if (!form.title.trim()) {
      showError('Title is required');
      return;
    }
    if (!form.slug.trim()) {
      showError('Slug is required');
      return;
    }
    if (!form.content.trim()) {
      showError('Content is required');
      return;
    }

    if (form.content.length > 4000000) {
      showError('Content is too large (max 4MB). Please reduce the size.');
      return;
    }

    try {
      setSubmitting(true);
      
      const data = {
        title: form.title.trim(),
        slug: form.slug.trim(),
        content: form.content.trim(),
        is_featured: form.is_featured,
        is_published: form.is_published
      };

      console.log('📤 Sending article:', {
        title: data.title,
        contentLength: data.content.length
      });

      if (form.image instanceof File) {
        const formData = new FormData();
        formData.append('title', data.title);
        formData.append('slug', data.slug);
        formData.append('content', data.content);
        formData.append('is_featured', data.is_featured);
        formData.append('is_published', data.is_published);
        formData.append('image', form.image);

        if (editing) {
          await api.updateNews(editing, formData);
        } else {
          await api.createNews(formData);
        }
      } else {
        if (editing) {
          await api.updateNews(editing, data);
        } else {
          await api.createNews(data);
        }
      }
      
      showSuccess(editing ? 'Article updated successfully!' : 'Article created successfully!');
      setShowModal(false);
      setEditing(null);
      setForm({ title: '', slug: '', content: '', is_featured: 0, is_published: 1, image: null, image_preview: null });
      loadArticles();
    } catch (err) {
      console.error('❌ Submit error:', err);
      showError(getApiErrorMessage(err) || 'Failed to save article');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this article?')) return;
    try {
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
            <p className="text-xs text-text-secondary mt-1 line-clamp-2">
              {article.content?.replace(/<[^>]*>/g, '').slice(0, 100)}
            </p>
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
                    content: article.content || '',
                    is_featured: article.is_featured || 0,
                    is_published: article.is_published !== undefined ? article.is_published : 1,
                    image: null,
                    image_preview: article.image_url || null
                  });
                  setShowModal(true);
                }}
                className="p-2 rounded-lg hover:bg-white/5 text-text-secondary hover:text-white transition"
