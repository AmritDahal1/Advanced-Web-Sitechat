import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { loginUser } from './api';
import { useApp } from './AppContext';
import { Logo } from './UI';

function validate({ email, password }) {
  const errors = {};
  if (!email.trim()) errors.email = 'Email is required.';
  else if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = 'Enter a valid email address.';

  if (!password) errors.password = 'Password is required.';
  else if (password.length < 6) errors.password = 'Password must be at least 6 characters.';

  return errors;
}

export default function Login() {
  const { login, showToast } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: 'amrit.dahal@cleantasker.com', password: 'password123' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationErrors = validate(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    setServerError('');
    try {
      const user = await loginUser(form.email, form.password);
      login(user);
      showToast(`Welcome back, ${user.name.split(' ')[0]}!`, 'success');
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
    } catch (err) {
      setServerError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <Link to="/" className="auth-back">← Back to site</Link>
      <div className="auth-card">
        <div className="brand brand-lg">
          <Logo />
          SiteChat
        </div>
        <p className="auth-subtitle">Employee sign-in for CleanTasker site chat &amp; notifications.</p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
              autoComplete="username"
            />
            {errors.email && <span className="field-error" id="email-error">{errors.email}</span>}
          </div>

          <div className="form-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
              autoComplete="current-password"
            />
            {errors.password && <span className="field-error" id="password-error">{errors.password}</span>}
          </div>

          {serverError && <div className="error-box" role="alert">⚠ {serverError}</div>}

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="demo-hint">
          <p><strong>Demo accounts</strong> (password: <code>password123</code>)</p>
          <ul>
            <li>amrit.dahal@cleantasker.com — Site Supervisor</li>
            <li>madhab.poudel@cleantasker.com — Operations Manager</li>
            <li>subham.giri@cleantasker.com — Field Cleaner</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
