const bcrypt = require('bcryptjs');
const db = require('./db');

const users = [
  { name: 'Amrit Dahal', email: 'amrit.dahal@cleantasker.com', password: 'password123', role: 'admin' },
  { name: 'Subham Giri', email: 'subham.giri@cleantasker.com', password: 'password123', role: 'user' },
  { name: 'Madhab Poudel', email: 'madhab.poudel@cleantasker.com', password: 'password123', role: 'admin' },
  { name: 'Sujit Budhathoki', email: 'sujit.budhathoki@cleantasker.com', password: 'password123', role: 'user' },
];

const sites = [
  { name: 'Riverside Office Tower', address: '88 Riverside Quay, Southbank VIC', facility_type: 'Commercial' },
  { name: 'Harbourview Apartments', address: '12 Dock Street, Docklands VIC', facility_type: 'Residential' },
  { name: 'Greenfield Shopping Centre', address: '200 Greenfield Rd, Clayton VIC', facility_type: 'Retail' },
  { name: 'Sunset Medical Centre', address: '5 Wellness Ave, Box Hill VIC', facility_type: 'Healthcare' },
  { name: 'Northgate Warehouse', address: '77 Industrial Way, Tullamarine VIC', facility_type: 'Industrial' },
];

function seed() {
  const insertUser = db.prepare(
    'INSERT OR IGNORE INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)'
  );
  for (const u of users) {
    insertUser.run(u.name, u.email, bcrypt.hashSync(u.password, 10), u.role);
  }

  const insertSite = db.prepare(
    'INSERT INTO sites (name, address, facility_type, created_by) VALUES (?, ?, ?, ?)'
  );
  const adminId = db.prepare('SELECT id FROM users WHERE email = ?').get('amrit.dahal@cleantasker.com').id;

  const existingCount = db.prepare('SELECT COUNT(*) AS c FROM sites').get().c;
  if (existingCount === 0) {
    for (const s of sites) {
      const info = insertSite.run(s.name, s.address, s.facility_type, adminId);
      db.prepare(
        "INSERT INTO tasks (site_id, text, priority, assignee, created_by) VALUES (?, ?, ?, ?, ?)"
      ).run(info.lastInsertRowid, `Initial walkthrough of ${s.name}`, 'Medium', 'Subham Giri', adminId);
      db.prepare(
        "INSERT INTO messages (site_id, user_id, sender_name, text) VALUES (?, ?, ?, ?)"
      ).run(info.lastInsertRowid, adminId, 'Amrit Dahal', `Welcome to the ${s.name} chat channel.`);
    }
  }

  console.log('Seed complete.');
  console.log('Demo accounts (password: password123):');
  users.forEach((u) => console.log(`  - ${u.email} (${u.role})`));
}

seed();
