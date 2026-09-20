require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const siteRoutes = require('./routes/sites');
const taskRoutes = require('./routes/tasks');
const messageRoutes = require('./routes/messages');
const notificationRoutes = require('./routes/notifications');
const userRoutes = require('./routes/users');

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' })); // 5mb to allow small base64 chat attachments

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/sites', siteRoutes);
app.use('/api', taskRoutes); // /api/sites/:siteId/tasks, /api/tasks/:id
app.use('/api', messageRoutes); // /api/sites/:siteId/messages
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);

// Central error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`SiteChat API listening on port ${PORT}`));
