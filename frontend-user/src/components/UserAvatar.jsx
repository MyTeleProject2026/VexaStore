// frontend-user/src/components/UserAvatar.jsx
export default function UserAvatar({ user, size = 'md', className = '' }) {
  const sizeClass = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-14 h-14 text-2xl',
    xl: 'w-20 h-20 text-3xl',
  }[size] || 'w-10 h-10 text-base';

  const name = user?.name || 'U';
  const avatarUrl = user?.avatar_url;

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`rounded-full object-cover border-2 border-cyan-500/20 ${sizeClass} ${className}`}
      />
    );
  }

  return (
    <div className={`rounded-full bg-gradient-to-br from-cyan-500/30 to-emerald-500/30 flex items-center justify-center border-2 border-cyan-500/20 ${sizeClass} ${className}`}>
      <span className="font-bold text-cyan-400">{name.charAt(0).toUpperCase()}</span>
    </div>
  );
}
