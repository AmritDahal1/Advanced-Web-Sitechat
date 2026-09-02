// Simulated backend API layer.
// In a production build this module would be replaced with real HTTP calls
// (e.g. fetch/axios to a Firebase/Node backend). Keeping all "network" access
// behind this single module means the rest of the app never needs to change
// when a real API is wired in - only this file does.

import usersData from './mockUsers.json';
import sitesData from './mockSites.json';
import messagesData from './mockMessages.json';
import notificationsData from './mockNotifications.json';
import tasksData from './mockTasks.json';

const DELAY_MS = 600;

function delay(value, ms = DELAY_MS) {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

// In-memory copies so the app can mutate "server" state during the session.
let users = [...usersData];
let sites = [...sitesData];
let messagesBySite = JSON.parse(JSON.stringify(messagesData));
let notifications = [...notificationsData];
let tasks = [...tasksData];

// Open-task count is always derived from the tasks list, never trusted as a
// static field, so it can never drift out of sync as tasks are added/completed.
function withTaskCount(site) {
  const openCount = tasks.filter((t) => t.siteId === site.id && !t.done).length;
  return { ...site, tasksOpen: openCount };
}

export async function loginUser(email, password) {
  await delay(null, 500);
  const user = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );
  if (!user) {
    throw new Error('Invalid email or password.');
  }
  const { password: _pw, ...safeUser } = user;
  return safeUser;
}

export async function fetchSites() {
  await delay(null);
  return sites.map(withTaskCount);
}

export async function fetchSiteById(siteId) {
  await delay(null, 350);
  const site = sites.find((s) => s.id === siteId);
  if (!site) throw new Error('Site not found.');
  return withTaskCount(site);
}

export async function fetchMessages(siteId) {
  await delay(null, 400);
  return messagesBySite[siteId] ? [...messagesBySite[siteId]] : [];
}

export async function sendMessage(siteId, userId, text, image) {
  await delay(null, 300);
  if (!text?.trim() && !image) {
    throw new Error('Message cannot be empty.');
  }
  const newMessage = {
    id: `m${Date.now()}`,
    userId,
    text: text?.trim() || '',
    time: new Date().toISOString(),
    ...(image ? { image } : {})
  };
  if (!messagesBySite[siteId]) messagesBySite[siteId] = [];
  messagesBySite[siteId].push(newMessage);

  const site = sites.find((s) => s.id === siteId);
  if (site) site.lastActivity = newMessage.time;

  return newMessage;
}

export async function toggleMessageReaction(siteId, messageId, userId) {
  await delay(null, 150);
  const list = messagesBySite[siteId];
  if (!list) throw new Error('Message not found.');
  const message = list.find((m) => m.id === messageId);
  if (!message) throw new Error('Message not found.');
  const reactions = message.reactions || [];
  message.reactions = reactions.includes(userId)
    ? reactions.filter((id) => id !== userId)
    : [...reactions, userId];
  return { ...message };
}

export async function fetchNotifications() {
  await delay(null, 350);
  return [...notifications].sort((a, b) => new Date(b.time) - new Date(a.time));
}

export async function markNotificationRead(notificationId) {
  await delay(null, 200);
  notifications = notifications.map((n) =>
    n.id === notificationId ? { ...n, read: true } : n
  );
  return notifications.find((n) => n.id === notificationId);
}

export async function markAllNotificationsRead() {
  await delay(null, 250);
  notifications = notifications.map((n) => ({ ...n, read: true }));
  return [...notifications];
}

export async function createSite({ name, address, membersCount }) {
  await delay(null, 500);
  if (!name || !name.trim()) {
    throw new Error('Site name is required.');
  }
  const newSite = {
    id: `s${Date.now()}`,
    name: name.trim(),
    address: address?.trim() || 'Address not provided',
    status: 'active',
    membersCount: Number(membersCount) || 1,
    unreadCount: 0,
    lastActivity: new Date().toISOString(),
    tasksOpen: 0
  };
  sites = [newSite, ...sites];
  messagesBySite[newSite.id] = [];
  return newSite;
}

export async function fetchTasks(siteId) {
  await delay(null, 350);
  return tasks.filter((t) => t.siteId === siteId).map((t) => ({ ...t }));
}

export async function createTask(siteId, text, priority = 'medium', assigneeId = null) {
  await delay(null, 300);
  if (!text || !text.trim()) {
    throw new Error('Task text is required.');
  }
  const newTask = {
    id: `t${Date.now()}`,
    siteId,
    text: text.trim(),
    done: false,
    priority,
    assigneeId: assigneeId || null,
    createdAt: new Date().toISOString()
  };
  tasks = [...tasks, newTask];
  return newTask;
}

export async function toggleTask(taskId) {
  await delay(null, 200);
  const task = tasks.find((t) => t.id === taskId);
  if (!task) throw new Error('Task not found.');
  task.done = !task.done;
  return { ...task };
}

export async function deleteTask(taskId) {
  await delay(null, 200);
  const exists = tasks.some((t) => t.id === taskId);
  if (!exists) throw new Error('Task not found.');
  tasks = tasks.filter((t) => t.id !== taskId);
  return { id: taskId };
}

export async function fetchUsers() {
  await delay(null, 300);
  return users.map(({ password, ...u }) => u);
}

export function getUserById(userId) {
  const u = users.find((x) => x.id === userId);
  if (!u) return null;
  const { password, ...safe } = u;
  return safe;
}
