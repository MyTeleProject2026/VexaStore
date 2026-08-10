export default function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#050812] p-4">
      <div className="spinner mb-4" />
      <p className="text-slate-500 text-sm animate-pulse">{message}</p>
    </div>
  );
}
