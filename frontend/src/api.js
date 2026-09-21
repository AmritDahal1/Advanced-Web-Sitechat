// Real backend API layer.
// All network access is kept behind this single module (unchanged contract
// from the mock version) so page components never had to change when the
// mock JSON layer was replaced with real HTTP calls to the Express + SQLite
// backend in /backend.

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';

let authToken = localStorage.getItem('sitechat_token') || null;

function setToken(token) {
  authToken = token;
  if (token) localStorage.setItem('sitechat_token', token);
  else localStorage.removeItem('sitechat_token');
}

async function request(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  let data = null;
  try {
    data = await res.json();
  } catch {
    // no body
  }

  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return data;
}

// ---- Adapters: map backend shapes to the shapes the UI already expects ----

function adaptSite(s) {
  return {
    id: s.id,
    name: s.name,
    address: s.address,
    facilityType: s.facility_type,
    status: s.status || 'active',
    membersCount: s.memberCount || 0,
    lastActivity: s.last_activity,
    tasksOpen: s.openTaskCount,
    unreadCount: Number(s.unreadCount),
  };
}

function adaptTask(t) {
  return {
    id: t.id,
    siteId: t.site_id,
    text: t.text,
    done: !!t.completed,
    priority: t.priority,
    assigneeId: t.assignee,
    createdAt: t.created_at,
  };
}

function adaptMessage(m) {
  return {
    id: m.id,
    userId: m.user_id,
    senderName: m.sender_name,
    text: m.text || '',
    time: m.created_at,
    reactions: m.reactions ? JSON.parse(m.reactions) : [],
    ...(m.attachment_data_url ? { image: m.attachment_data_url } : {}),
  };
}

function adaptNotification(n) {
  return {
    id: n.id,
    siteId: n.site_id,
    text: n.message,
    type: n.type || 'system',
    read: !!n.read,
    time: n.created_at,
  };
}

// ---- Public API (same function names/signatures as the mock module) ----

export async function loginUser(email, password) {
  const { token, user } = await request('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  setToken(token);
  return user;
}

export function logoutUser() {
  setToken(null);
}

export async function registerUser({ name, email, password, role }) {
  const { token, user } = await request('/auth/register', {
    method: 'POST',
    body: { name, email, password, role },
  });
  setToken(token);
  return user;
}

export async function fetchSites() {
  const sites = await request('/sites');
  return sites.map(adaptSite);
}

export async function fetchSiteById(siteId) {
  const site = await request(`/sites/${siteId}`);
  return adaptSite(site);
}

export async function createSite({ name, address, facilityType, memberIds }) {
  const site = await request('/sites', {
    method: 'POST',
    body: { name, address, facilityType, memberIds },
  });
  return adaptSite(site);
}

export async function updateSite(siteId, updates) {
  const site = await request(`/sites/${siteId}`, {
    method: 'PUT',
    body: updates,
  });
  return adaptSite(site);
}

export async function fetchMessages(siteId) {
  const messages = await request(`/sites/${siteId}/messages`);
  return messages.map(adaptMessage);
}

export async function markSiteMessagesRead(siteId) {
  await request(`/sites/${siteId}/messages/read`, { method: 'PUT' });
}

export async function sendMessage(siteId, userId, text, image) {
  const message = await request(`/sites/${siteId}/messages`, {
    method: 'POST',
    body: { text, attachmentDataUrl: image },
  });
  return adaptMessage(message);
}

export async function deleteMessage(messageId) {
  await request(`/messages/${messageId}`, { method: 'DELETE' });
  return { id: messageId };
}

export async function fetchNotifications() {
  const notifications = await request('/notifications');
  return notifications.map(adaptNotification);
}

export async function markNotificationRead(notificationId) {
  const n = await request(`/notifications/${notificationId}/read`, { method: 'PUT' });
  return adaptNotification(n);
}

export async function markAllNotificationsRead() {
  return request('/notifications/read-all', { method: 'PUT' });
}

export async function fetchTasks(siteId) {
  const tasks = await request(`/sites/${siteId}/tasks`);
  return tasks.map(adaptTask);
}

export async function createTask(siteId, text, priority = 'Medium', assigneeId = null) {
  const task = await request(`/sites/${siteId}/tasks`, {
    method: 'POST',
    body: { text, priority, assignee: assigneeId },
  });
  return adaptTask(task);
}

export async function toggleTask(taskId) {
  const task = await request(`/tasks/${taskId}/toggle`, { method: 'PUT' });
  return adaptTask(task);
}

export async function deleteTask(taskId) {
  await request(`/tasks/${taskId}`, { method: 'DELETE' });
  return { id: taskId };
}

export async function fetchUsers() {
  const users = await request('/users');
  return users; // { id, name, email, role, created_at }
}

export async function updateCurrentUser({ name, email }) {
  return request('/users/me', {
    method: 'PUT',
    body: { name, email },
  });
}

export async function toggleMessageReaction(siteId, messageId, userId) {
  const message = await request(`/messages/${messageId}/react`, { method: 'PUT' });
  return adaptMessage(message);
}
