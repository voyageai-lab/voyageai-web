import { Link, useNavigate } from 'react-router-dom';
import { Plane, LogOut, User } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/store/authSlice';

export function Navbar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, token } = useAppSelector((s) => s.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-blue-600 font-bold text-xl">
          <Plane className="w-6 h-6" />
          VoyageAI
        </Link>

        <div className="flex items-center gap-4">
          {token ? (
            <>
              <Link
                to="/planning"
                className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
              >
                Plan a Trip
              </Link>
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <User className="w-4 h-4" />
                {user?.username || user?.email || 'User'}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-gray-500 hover:text-red-600 transition-colors text-sm"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
