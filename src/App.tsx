import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { initAuth, googleSignIn, logout } from './lib/auth';
import Dashboard from './components/Dashboard';
import SignatureVerifier from './components/SignatureVerifier';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [route, setRoute] = useState<'dashboard' | 'verify'>('dashboard');

  useEffect(() => {
    // Check path for simple routing
    if (window.location.pathname === '/verify' || window.location.search.includes('data=')) {
      setRoute('verify');
    } else {
      setRoute('dashboard');
    }

    // Listener for hash or popstate navigation changes
    const handleLocationChange = () => {
      if (window.location.pathname === '/verify' || window.location.search.includes('data=')) {
        setRoute('verify');
      } else {
        setRoute('dashboard');
      }
    };

    window.addEventListener('popstate', handleLocationChange);

    // Initialize Auth listener
    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );

    return () => {
      unsubscribe();
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  const handleLogin = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setToken(result.accessToken);
        setUser(result.user);
      }
    } catch (err) {
      console.error('Google Sign In failed:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setToken(null);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  if (route === 'verify') {
    return <SignatureVerifier />;
  }

  return (
    <Dashboard
      user={user}
      accessToken={token}
      onLogin={handleLogin}
      onLogout={handleLogout}
    />
  );
}

