
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Login } from '@/components/auth/Login';

const Auth = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [forceTimeout, setForceTimeout] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  // Force timeout after 5 seconds if still loading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        console.log('Auth loading timeout - forcing page refresh');
        window.location.href = '/';
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <Login />;
};

export default Auth;
