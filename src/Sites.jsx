import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useFetch } from './useFetch';
import { createSite, fetchSites } from './api';
import { useApp } from './AppContext';
import { LoadingSpinner, ErrorMessage, Badge, Modal } from './UI';
import { getSiteCover } from './helpers';

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'completed', label: 'Completed' }
];

export default function Sites() {
  const { showToast } = useApp();
  const { data: sites, loading, error, refetch, setData } = useFetch(fetchSites, []);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);

  const filteredSites = useMemo(() => {
    if (!sites) return [];
    return sites.filter((site) => {
      const matchesSearch =
        site.name.toLowerCase().includes(search.toLowerCase()) ||
        site.address.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || site.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [sites, search, statusFilter]);

  function handleCreated(newSite) {
    setData((prev) => [newSite, ...(prev || [])]);
    setModalOpen(false);
    showToast(`"${newSite.name}" was added.`, 'success');
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Sites</h1>
          <p className="muted">Browse and manage all CleanTasker job sites.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setModalOpen(true)}>
          + New site
        </button>
      </header>

      <div className="toolbar">
        <div className="search-field">
          <label htmlFor="site-search" className="sr-only">Search sites</label>
          <input
            id="site-search"
            type="search"
            placeholder="Search by name or address…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="chip-group" role="group" aria-label="Filter sites by status">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              className={`chip ${statusFilter === f.value ? 'chip-active' : ''}`}
              onClick={() => setStatusFilter(f.value)}
              aria-pressed={statusFilter === f.value}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading && <LoadingSpinner label="Loading sites…" />}
      {error && <ErrorMessage message={error} onRetry={refetch} />}

      {!loading && !error && (
        <>
          {filteredSites.length === 0 ? (
            <p className="muted empty-state">No sites match your search.</p>
          ) : (
            <div className="card-grid">
              {filteredSites.map((site) => (
                <Link key={site.id} to={`/dashboard/sites/${site.id}`} className="site-card">
                  <img className="site-card-cover" src={getSiteCover(site.id)} alt="" />
                  <div className="site-card-header">
                    <h3>{site.name}</h3>
                    <Badge status={site.status} />
                  </div>
                  <p className="muted small">{site.address}</p>
                  <div className="site-card-footer">
                    <span>{site.membersCount} members</span>
                    <span>{site.tasksOpen} open tasks</span>
                    <Badge count={site.unreadCount} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      <CreateSiteModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onCreated={handleCreated} />
    </div>
  );
}

function CreateSiteModal({ isOpen, onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', address: '', membersCount: 1 });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function validate() {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Site name is required.';
    if (!form.address.trim()) errs.address = 'Address is required.';
    if (!form.membersCount || Number(form.membersCount) < 1) {
      errs.membersCount = 'At least 1 team member is required.';
    }
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    setServerError('');
    try {
      const newSite = await createSite(form);
      onCreated(newSite);
      setForm({ name: '', address: '', membersCount: 1 });
    } catch (err) {
      setServerError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Add a new site" isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-field">
          <label htmlFor="site-name">Site name</label>
          <input
            id="site-name"
            name="name"
            value={form.name}
            onChange={handleChange}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'site-name-error' : undefined}
          />
          {errors.name && <span className="field-error" id="site-name-error">{errors.name}</span>}
        </div>
        <div className="form-field">
          <label htmlFor="site-address">Address</label>
          <input
            id="site-address"
            name="address"
            value={form.address}
            onChange={handleChange}
            aria-invalid={!!errors.address}
            aria-describedby={errors.address ? 'site-address-error' : undefined}
          />
          {errors.address && <span className="field-error" id="site-address-error">{errors.address}</span>}
        </div>
        <div className="form-field">
          <label htmlFor="site-members">Team members</label>
          <input
            id="site-members"
            name="membersCount"
            type="number"
            min="1"
            value={form.membersCount}
            onChange={handleChange}
            aria-invalid={!!errors.membersCount}
            aria-describedby={errors.membersCount ? 'site-members-error' : undefined}
          />
          {errors.membersCount && <span className="field-error" id="site-members-error">{errors.membersCount}</span>}
        </div>

        {serverError && <div className="error-box" role="alert">⚠ {serverError}</div>}

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create site'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
