import { useState } from 'react';
import { useApp } from './AppContext';

export default function Profile() {
  const { user, theme, toggleTheme, updateUser, showToast } = useApp();
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '' });
  const [errors, setErrors] = useState({});
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function validate() {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required.';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Enter a valid email address.';
    return errs;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    updateUser({ name: form.name.trim(), email: form.email.trim() });
    showToast('Profile details saved.', 'success');
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Profile &amp; settings</h1>
          <p className="muted">Manage your account details and notification preferences.</p>
        </div>
      </header>

      <div className="dashboard-grid">
        <section className="panel">
          <h2>Account details</h2>
          <div className="profile-summary">
            <span className="avatar avatar-lg" style={{ background: user?.avatarColor }} aria-hidden="true">
              {user?.name?.charAt(0)}
            </span>
            <div>
              <strong>{user?.name}</strong>
              <p className="muted small">{user?.role}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-field">
              <label htmlFor="name">Full name</label>
              <input id="name" name="name" value={form.name} onChange={handleChange} aria-invalid={!!errors.name} />
              {errors.name && <span className="field-error">{errors.name}</span>}
            </div>
            <div className="form-field">
              <label htmlFor="profile-email">Email</label>
              <input
                id="profile-email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                aria-invalid={!!errors.email}
              />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>
            <button type="submit" className="btn btn-primary">Save changes</button>
          </form>
        </section>

        <section className="panel">
          <h2>Preferences</h2>
          <div className="preference-row">
            <div>
              <strong>Dark mode</strong>
              <p className="muted small">Toggle between light and dark themes.</p>
            </div>
            <label className="switch">
              <input type="checkbox" checked={theme === 'dark'} onChange={toggleTheme} />
              <span className="switch-track" aria-hidden="true" />
              <span className="sr-only">Toggle dark mode</span>
            </label>
          </div>

          <div className="preference-row">
            <div>
              <strong>Email alerts</strong>
              <p className="muted small">Get an email when a site sends a new message.</p>
            </div>
            <label className="switch">
              <input type="checkbox" checked={emailAlerts} onChange={(e) => setEmailAlerts(e.target.checked)} />
              <span className="switch-track" aria-hidden="true" />
              <span className="sr-only">Toggle email alerts</span>
            </label>
          </div>

          <div className="preference-row">
            <div>
              <strong>SMS alerts</strong>
              <p className="muted small">Receive a text for urgent task notifications.</p>
            </div>
            <label className="switch">
              <input type="checkbox" checked={smsAlerts} onChange={(e) => setSmsAlerts(e.target.checked)} />
              <span className="switch-track" aria-hidden="true" />
              <span className="sr-only">Toggle SMS alerts</span>
            </label>
          </div>
        </section>
      </div>
    </div>
  );
}
