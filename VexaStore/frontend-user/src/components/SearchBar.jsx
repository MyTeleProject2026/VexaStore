import { Search } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SearchBar({ className = '' }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for apps..."
        className="w-full rounded-2xl bg-dark-bg border border-dark-border px-4 py-3 pl-12 text-base text-white placeholder-text-secondary focus:border-accent-primary outline-none transition"
      />
      <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
    </form>
  );
}