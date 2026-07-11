import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../api';

export default function AuthPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [role, setRole] = useState('department');
  const [form, setForm] = useState({ name: '', email: '', password: '', departmentName: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user =
        mode === 'login'
          ? await login(form.email, form.password)
          : await register({ ...form, role });
      navigate(user.role === 'pharmacy' ? '/pharmacy/orders' : '/department/order');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-panel">
        <div>
          <span className="eyebrow">Hospital pharmacy</span>
          <h1>PharmaStock</h1>
        </div>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={submit}>
          {mode === 'register' && (
            <>
              <div className="role-toggle" role="group" aria-label="Account type">
                <button
                  type="button"
                  className={role === 'department' ? 'active' : ''}
                  onClick={() => setRole('department')}
                >
                  Department
                </button>
                <button
                  type="button"
                  className={role === 'pharmacy' ? 'active' : ''}
                  onClick={() => setRole('pharmacy')}
                >
                  Pharmacy
                </button>
              </div>
              <div className="field">
                <label htmlFor="name">Full name</label>
                <input id="name" value={form.name} onChange={set('name')} required />
              </div>
              {role === 'department' && (
                <div className="field">
                  <label htmlFor="dept">Department</label>
                  <input
                    id="dept"
                    value={form.departmentName}
                    onChange={set('departmentName')}
                    placeholder="e.g. Emergency Room"
                    required
                  />
                </div>
              )}
            </>
          )}
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={form.email} onChange={set('email')} required />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={form.password}
              onChange={set('password')}
              minLength={6}
              required
            />
          </div>
          <button className="btn btn--primary" disabled={busy}>
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>
        <p className="auth-switch">
          {mode === 'login' ? 'No account yet?' : 'Already registered?'}{' '}
          <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
            {mode === 'login' ? 'Create one' : 'Sign in'}
          </button>
        </p>
      </div>
      <div className="auth-hero">
        <h2>Every ampoule accounted for.</h2>
        <p>
          Departments order, pharmacy approves, stock updates itself. One ledger for the
          whole hospital.
        </p>
      </div>
    </div>
  );
}
