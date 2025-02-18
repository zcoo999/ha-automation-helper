import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { Github, Lock, Server } from 'lucide-react';

export default function Login() {
  const [haUrl, setHaUrl] = useState(window.location.origin);
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!haUrl || !token) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      await login(haUrl, token);
      navigate('/select');
    } catch (error) {
      toast.error('Connection failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 animated-gradient backdrop-blur">
      <div className="w-full max-w-md space-y-8 bg-white/5 backdrop-blur-xl p-8 rounded-2xl shadow-xl border border-white/10">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            HA Automation Helper
          </h2>
          <a
            href="https://github.com/zcoo999"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center mt-2 text-sm text-gray-300 hover:text-white"
          >
            <Github className="w-4 h-4 mr-1" />
            v1.0-beta1
          </a>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Home Assistant URL
            </label>
            <div className="relative">
              <Server className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={haUrl}
                onChange={(e) => setHaUrl(e.target.value)}
                placeholder="e.g., 192.168.1.100"
                className="w-full pl-10 pr-4 py-2 bg-black/20 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Long-lived Access Token
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Enter your access token"
                className="w-full pl-10 pr-4 py-2 bg-black/20 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full py-3 px-4 bg-white/10 hover:bg-white/20 focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-sky-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
          >
            {isLoading ? 'Connecting...' : 'Connect'}
          </button>
        </div>
      </div>
    </div>
  );
}
