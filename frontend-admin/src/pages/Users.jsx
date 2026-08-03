import { useState, useEffect } from 'react';
import { api, getApiErrorMessage } from '../services/api';
import { useNotification } from '../hooks/useNotification';
import { Users as UsersIcon, Check, XCircle, Trash2 } from 'lucide-react';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setLoading(true);
      const res = await api.get('/admin/settings/users');
      setUsers(res.data?.data || []);
    } catch (err) {
      showError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function toggleStatus(id, currentStatus) {
    try {
      await api.put(`/admin/settings/users/${id}`, { is_active: currentStatus ? 0 : 1 });
      showSuccess('User status updated');
      loadUsers();
    } catch (err) {
      showError(getApiErrorMessage(err));
    }
  }

  async function deleteUser(id) {
    if (!confirm('Delete this user?')) return;
    try {
      await api.delete(`/admin/settings/users/${id}`);
      showSuccess('User deleted');
      loadUsers();
    } catch (err) {
      showError(getApiErrorMessage(err));
    }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-accent-primary border-t-transparent rounded-full"></div></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Users</h1>
        <p className="text-text-secondary">Manage store users</p>
      </div>

      <div className="glass-card p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-text-secondary border-b border-dark-border">
            <tr>
              <th className="text-left py-3 px-3">Name</th>
              <th className="text-left py-3 px-3">Email</th>
              <th className="text-left py-3 px-3">Verified</th>
              <th className="text-left py-3 px-3">Status</th>
              <th className="text-left py-3 px-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-dark-border/50 hover:bg-white/5">
                <td className="py-3 px-3 text-white">{user.name}</td>
                <td className="py-3 px-3 text-text-secondary">{user.email}</td>
                <td className="py-3 px-3">{user.is_verified ? <Check size={16} className="text-emerald-400" /> : <XCircle size={16} className="text-red-400" />}</td>
                <td className="py-3 px-3">
                  <button onClick={() => toggleStatus(user.id, user.is_active)} className={`px-3 py-1 rounded-full text-xs font-medium ${user.is_active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                    {user.is_active ? 'Active' : 'Disabled'}
                  </button>
                </td>
                <td className="py-3 px-3">
                  <button onClick={() => deleteUser(user.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-text-secondary hover:text-red-400 transition">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}