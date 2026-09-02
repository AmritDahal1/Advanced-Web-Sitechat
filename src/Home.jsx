import { Link } from 'react-router-dom';
import { Logo } from './UI';

const APP_PREVIEW = [
  { icon: '🏢', title: 'Sites', desc: 'Every job site your crew works, in one list.' },
  { icon: '💬', title: 'Site Chat', desc: 'A message thread for each site, open on any device.' },
  { icon: '🔔', title: 'Notifications', desc: 'Everything that needs your attention, in one feed.' },
  { icon: '📊', title: 'Dashboard', desc: 'Task and status overview across all sites at once.' }
];

const FACILITIES = [
  {
    label: 'Commercial offices',
    tag: 'Towers & HQs',
    img: 'https://images.unsplash.com/photo-1660893978186-04bb33247dc0?auto=format&fit=crop&w=800&q=70'
  },
  {
    label: 'Retail & shopping centres',
    tag: 'High-traffic floors',
    img: 'https://images.unsplash.com/photo-1655516557079-a969d3509876?auto=format&fit=crop&w=800&q=70'
  },
  {
    label: 'Healthcare facilities',
    tag: 'Clinical hygiene',
    img: 'https://images.unsplash.com/photo-1519494140681-8b17d830a3e9?auto=format&fit=crop&w=800&q=70'
  },
  {
    label: 'Education campuses',
    tag: 'Shared spaces',
    img: 'https://images.unsplash.com/photo-1659275136863-6f27b069e1f7?auto=format&fit=crop&w=800&q=70'
  }
];

const FEATURES = [
  {
    icon: '💬',
    title: 'A channel for every site',
    desc: 'Each job site gets its own chat, so updates and questions stay with the crew that needs them.'
  },
  {
    icon: '🔔',
    title: 'One notification feed',
    desc: 'Messages, task completions and status changes land in a single feed for supervisors to check.'
  },
  {
    icon: '📊',
    title: 'A dashboard across every site',
    desc: 'Open tasks and site status roll up into one view for operations managers.'
  }
];

const ROLES = [
  { initial: 'S', color: '#2563eb', title: 'Site Supervisor', blurb: 'Runs the site channel day to day and keeps the crew on task.' },
  { initial: 'O', color: '#d97706', title: 'Operations Manager', blurb: 'Watches the dashboard across every site and clears blockers.' },
  { initial: 'F', color: '#16a34a', title: 'Field Cleaner', blurb: 'Posts updates and photos from the job on their phone.' },
  { initial: 'A', color: '#7c3aed', title: 'Facilities Admin', blurb: 'Adds new sites and crew members as needed.' }
];

export default function Home() {
  return (
    <div className="public-page">
      <header className="site-header">
        <div className="site-header-inner">
          <Link to="/" className="brand">
            <Logo />
            SiteChat
          </Link>
          <nav className="site-nav">
            <div className="site-nav-links">
              <a href="#facilities">Facilities</a>
              <a href="#how-it-works">How it works</a>
              <a href="#team">Who it&rsquo;s for</a>
            </div>
            <div className="site-header-actions">
              <Link to="/login" className="btn btn-primary btn-sm">Employee Login</Link>
            </div>
          </nav>
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Built for CleanTasker crews</span>
          <h1>Every site, one chat away from sorted.</h1>
          <p className="hero-lede">
            SiteChat gives every CleanTasker job site its own channel, rolls up
            notifications into one feed, and gives supervisors a view across
            every location.
          </p>
          <div className="hero-actions">
            <Link to="/login" className="btn btn-primary btn-lg">Employee Login</Link>
            <a href="#how-it-works" className="btn btn-secondary btn-lg">See how it works</a>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <strong>5</strong>
              <span>active job sites</span>
            </div>
            <div className="hero-stat">
              <strong>24/7</strong>
              <span>notifications</span>
            </div>
            <div className="hero-stat">
              <strong>1</strong>
              <span>dashboard for it all</span>
            </div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="live-feed-card">
            <div className="live-feed-header">
              <span className="live-feed-title">What&rsquo;s inside SiteChat</span>
            </div>
            <ul className="live-feed-list">
              {APP_PREVIEW.map((item) => (
                <li className="live-feed-row" key={item.title}>
                  <span className="feature-icon" aria-hidden="true">{item.icon}</span>
                  <span className="live-feed-text">
                    <span className="live-feed-site">{item.title}</span>
                    <br />
                    {item.desc}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="section section-alt" id="facilities">
        <div className="section-header">
          <h2>The facilities we keep running</h2>
          <p>
            From office towers to hospital corridors, SiteChat keeps the right
            people talking wherever the work happens.
          </p>
        </div>
        <div className="facility-grid">
          {FACILITIES.map((f) => (
            <div className="facility-card" key={f.label}>
              <img src={f.img} alt={f.label} loading="lazy" />
              <div className="facility-card-label">
                <span>{f.tag}</span>
                <strong>{f.label}</strong>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section" id="how-it-works">
        <div className="section-header center">
          <h2>How SiteChat works</h2>
          <p>Three parts, working from the same source of truth for every job site.</p>
        </div>
        <div className="feature-grid">
          {FEATURES.map((f) => (
            <div className="feature-card" key={f.title}>
              <div className="feature-icon" aria-hidden="true">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section section-alt" id="team">
        <div className="section-header center">
          <h2>Built around who&rsquo;s on site</h2>
          <p>Every role sees what they need, without digging for it.</p>
        </div>
        <div className="role-grid">
          {ROLES.map((r) => (
            <div className="role-card" key={r.title}>
              <span className="avatar" style={{ background: r.color }} aria-hidden="true">{r.initial}</span>
              <h3>{r.title}</h3>
              <p>{r.blurb}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="cta-band">
          <div>
            <h2>Ready to see it in action?</h2>
            <p>Sign in with your CleanTasker account to open your site dashboard.</p>
          </div>
          <Link to="/login" className="btn btn-invert btn-lg">Employee Login</Link>
        </div>
      </section>

      <footer className="site-footer">
        <div className="site-footer-inner">
          <div className="site-footer-brand">
            <div className="brand">
              <Logo />
              SiteChat
            </div>
            <p>
              A real-time site chat and notification platform built for
              CleanTasker&rsquo;s cleaning crews and supervisors.
            </p>
          </div>
          <div>
            <h4>Product</h4>
            <ul>
              <li><a href="#facilities">Facilities</a></li>
              <li><a href="#how-it-works">How it works</a></li>
              <li><a href="#team">Who it&rsquo;s for</a></li>
            </ul>
          </div>
          <div>
            <h4>Access</h4>
            <ul>
              <li><Link to="/login">Employee login</Link></li>
              <li><Link to="/dashboard">Dashboard</Link></li>
            </ul>
          </div>
          <div>
            <h4>Project</h4>
            <ul>
              <li>ICT930 Assessment 2</li>
              <li>MIT ACT · Crennotech</li>
            </ul>
          </div>
        </div>
        <div className="site-footer-bottom">
          <span>© 2026 CleanTasker. Built for coursework, not a live product.</span>
          <span>SiteChat v1.0</span>
        </div>
      </footer>
    </div>
  );
}
