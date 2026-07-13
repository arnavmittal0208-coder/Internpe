import React, { useContext, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Shield, UserRound, LogIn } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

export default function AuthPage({ mode = 'student' }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, register } = useContext(AuthContext);
  const [view, setView] = useState(() => searchParams.get('view') === 'register' ? 'register' : 'login');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'Student' });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isAdminMode = mode === 'admin';
  const canRegister = !isAdminMode;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (view === 'register') {
      if (!form.name.trim() || !form.email.trim() || !form.password.trim() || !confirmPassword.trim()) {
        setError('All fields are required');
        setLoading(false);
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email)) {
        setError('Please enter a valid email address');
        setLoading(false);
        return;
      }

      if (form.password !== confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }
    }

    try {
      if (view === 'login') {
        const user = await login({ email: form.email, password: form.password });
        navigate(user.role === 'Admin' ? '/admin/courses' : '/courses', { replace: true });
      } else {
        const user = await register({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role
        });
        navigate('/courses', { replace: true });
      }
    } catch (authError) {
      setError(authError.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container auth-page-shell animate-fade-in" style={{ minHeight: '70vh', display: 'grid', placeItems: 'center', padding: '2rem 1rem' }}>
      <div className="card auth-card" style={{ width: '100%', maxWidth: 440, padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'inline-flex', padding: 12, borderRadius: '999px', background: 'var(--primary-light)', color: 'var(--primary)', marginBottom: 12 }}>
            {isAdminMode ? <Shield size={28} /> : <UserRound size={28} />}
          </div>
          <h3 style={{ marginBottom: 6 }}>{isAdminMode ? 'Admin Portal Access' : 'Welcome Back'}</h3>
          <p style={{ fontSize: 13, color: 'var(--neutral-600)' }}>
            {isAdminMode ? 'Sign in to manage courses, uploads, and assessments.' : 'Sign in as a student or create an account to continue learning.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button type="button" className={`btn btn-sm ${view === 'login' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1 }} onClick={() => { setView('login'); setError(''); }}>
            <LogIn size={14} />
            <span>Login</span>
          </button>
          {canRegister && (
            <button type="button" className={`btn btn-sm ${view === 'register' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1 }} onClick={() => { setView('register'); setError(''); }}>
              <UserRound size={14} />
              <span>Register</span>
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          {canRegister && view === 'register' && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-control" type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-control" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-control" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>

          {canRegister && view === 'register' && (
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input className="form-control" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>
          )}

          {error && <p style={{ color: 'var(--error)', marginBottom: 12, fontSize: 13 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => navigate('/courses')}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? 'Please wait...' : view === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}