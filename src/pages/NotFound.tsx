import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-800 to-blue-950 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-10 text-center">
        <div className="text-7xl font-bold text-blue-800 mb-4">404</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Page Not Found</h1>
        <p className="text-gray-500 text-sm mb-8">
          The page you are looking for does not exist or has been moved.
        </p>
        <button
          onClick={() => navigate('/login')}
          className="bg-blue-800 hover:bg-blue-900 text-white font-semibold px-6 py-2.5 rounded-lg transition"
        >
          Go to Login
        </button>
      </div>
    </div>
  );
}
