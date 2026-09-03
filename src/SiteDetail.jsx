import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useFetch } from './useFetch';
import {
  fetchMessages,
  fetchSiteById,
  fetchUsers,
  sendMessage,
  toggleMessageReaction,
  fetchTasks,
  createTask,
  deleteTask,
  toggleTask
} from './api';
import { useApp } from './AppContext';
import { LoadingSpinner, ErrorMessage, Badge, Modal } from './UI';
import { getSiteCover } from './helpers';

const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4MB
const GROUP_GAP_MS = 5 * 60 * 1000; // messages within 5 min from the same person are grouped

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function formatDateLabel(iso) {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  if (isSameDay(date, today)) return 'Today';
  if (isSameDay(date, yesterday)) return 'Yesterday';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

// Groups consecutive messages from the same sender (within GROUP_GAP_MS) so the
// avatar and name are only shown once per cluster, like a real chat app.
function groupMessages(messages) {
  const days = [];
  let currentDay = null;

  messages.forEach((m) => {
    const dayLabel = formatDateLabel(m.time);
    if (!currentDay || currentDay.label !== dayLabel) {
      currentDay = { label: dayLabel, clusters: [] };
      days.push(currentDay);
    }
    const lastCluster = currentDay.clusters[currentDay.clusters.length - 1];
    const sameSender = lastCluster && lastCluster.userId === m.userId;
    const withinGap =
      lastCluster && new Date(m.time) - new Date(lastCluster.items[lastCluster.items.length - 1].time) < GROUP_GAP_MS;

    if (sameSender && withinGap) {
      lastCluster.items.push(m);
    } else {
      currentDay.clusters.push({ userId: m.userId, items: [m] });
    }
  });

  return days;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const TABS = [
  { id: 'chat', label: 'Chat' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'photos', label: 'Photos' }
];

const TASK_FILTERS = [
  { value: 'open', label: 'Open' },
  { value: 'done', label: 'Done' },
  { value: 'all', label: 'All' }
];

export default function SiteDetail() {
  const { siteId } = useParams();
  const { user, showToast } = useApp();
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

  const { data: site, loading: siteLoading, error: siteError } = useFetch(
    () => fetchSiteById(siteId),
    [siteId]
  );
  const {
    data: messages,
    loading: messagesLoading,
    error: messagesError,
    setData: setMessages
  } = useFetch(() => fetchMessages(siteId), [siteId]);
  const { data: users, loading: usersLoading, error: usersError } = useFetch(fetchUsers, []);
  const {
    data: tasks,
    loading: tasksLoading,
    error: tasksError,
    setData: setTasks
  } = useFetch(() => fetchTasks(siteId), [siteId]);

  const [activeTab, setActiveTab] = useState('chat');
  const [draft, setDraft] = useState('');
  const [pendingImage, setPendingImage] = useState(null);
  const [sending, setSending] = useState(false);
  const [draftError, setDraftError] = useState('');
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [taskDraft, setTaskDraft] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskError, setTaskError] = useState('');
  const [taskFilter, setTaskFilter] = useState('open');

  useEffect(() => {
    if (activeTab === 'chat') bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeTab]);

  function userFor(userId) {
    return users?.find((u) => u.id === userId) || { name: 'Unknown user', avatarColor: '#94a3b8' };
  }

  function handleFilePick(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please choose an image file.', 'error');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      showToast('Image is too large (max 4MB).', 'error');
      return;
    }
    readFileAsDataUrl(file).then((dataUrl) => setPendingImage(dataUrl));
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!draft.trim() && !pendingImage) {
      setDraftError('Type a message or attach a photo before sending.');
      return;
    }
    setDraftError('');
    setSending(true);
    try {
      const newMessage = await sendMessage(siteId, user.id, draft, pendingImage);
      setMessages((prev) => [...(prev || []), newMessage]);
      setDraft('');
      setPendingImage(null);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSending(false);
    }
  }

  async function handleToggleLike(messageId) {
    const previousMessages = messages;
    setMessages((prev) =>
      (prev || []).map((m) => {
        if (m.id !== messageId) return m;
        const reactions = m.reactions || [];
        const liked = reactions.includes(user.id);
        return { ...m, reactions: liked ? reactions.filter((id) => id !== user.id) : [...reactions, user.id] };
      })
    );
    try {
      await toggleMessageReaction(siteId, messageId, user.id);
    } catch (err) {
      setMessages(previousMessages);
      showToast(err.message, 'error');
    }
  }

  async function handleAddTask(e) {
    e.preventDefault();
    if (!taskDraft.trim()) {
      setTaskError('Type a task before adding it.');
      return;
    }
    setTaskError('');
    try {
      const newTask = await createTask(siteId, taskDraft, taskPriority, taskAssignee || null);
      setTasks((prev) => [...(prev || []), newTask]);
      setTaskDraft('');
      setTaskPriority('medium');
      setTaskAssignee('');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleToggleTask(taskId) {
    const previousTasks = tasks;
    setTasks((prev) =>
      (prev || []).map((t) => (t.id === taskId ? { ...t, done: !t.done } : t))
    );
    try {
      await toggleTask(taskId);
    } catch (err) {
      setTasks(previousTasks);
      showToast(err.message, 'error');
    }
  }

  async function handleDeleteTask(taskId) {
    const previousTasks = tasks;
    setTasks((prev) => (prev || []).filter((t) => t.id !== taskId));
    try {
      await deleteTask(taskId);
    } catch (err) {
      setTasks(previousTasks);
      showToast(err.message, 'error');
    }
  }

  const photos = useMemo(
    () => (messages || []).filter((m) => m.image).slice().reverse(),
    [messages]
  );

  const visibleTasks = useMemo(() => {
    if (!tasks) return [];
    if (taskFilter === 'open') return tasks.filter((t) => !t.done);
    if (taskFilter === 'done') return tasks.filter((t) => t.done);
    return tasks;
  }, [tasks, taskFilter]);

  const openTaskCount = useMemo(() => (tasks || []).filter((t) => !t.done).length, [tasks]);

  const groupedDays = messages ? groupMessages(messages) : [];

  if (siteLoading) return <LoadingSpinner label="Loading site…" />;
  if (siteError) return <ErrorMessage message={siteError} />;

  return (
    <div className="page site-page">
      <p className="breadcrumb">
        <Link to="/dashboard/sites">Sites</Link> / {site.name}
      </p>

      <div className="site-cover">
        <img src={getSiteCover(site.id)} alt="" />
        <div className="site-cover-overlay">
          <h1>{site.name}</h1>
          <p>{site.address}</p>
        </div>
      </div>

      <div className="site-tabs" role="tablist" aria-label="Site views">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`site-tab ${activeTab === tab.id ? 'site-tab-active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {tab.id === 'photos' && photos.length > 0 && <span className="site-tab-count">{photos.length}</span>}
            {tab.id === 'tasks' && openTaskCount > 0 && <span className="site-tab-count">{openTaskCount}</span>}
          </button>
        ))}
      </div>

      <div className="site-layout">
        <div className="site-main">
          {activeTab === 'chat' && (
            <div className="chat-page">
              <div className="chat-window">
                {messagesLoading && <LoadingSpinner label="Loading messages…" />}
                {messagesError && <ErrorMessage message={messagesError} />}

                {!messagesLoading && !messagesError && (
                  <>
                    {messages.length === 0 && <p className="muted empty-state">No messages yet. Say hello 👋</p>}
                    {groupedDays.map((day) => (
                      <div key={day.label}>
                        <div className="chat-date-divider"><span>{day.label}</span></div>
                        {day.clusters.map((cluster, ci) => {
                          const author = userFor(cluster.userId);
                          const isOwn = cluster.userId === user.id;
                          return (
                            <div key={ci} className={`chat-cluster ${isOwn ? 'chat-cluster-own' : ''}`}>
                              <span className="avatar avatar-sm chat-cluster-avatar" style={{ background: author.avatarColor }} aria-hidden="true">
                                {author.name.charAt(0)}
                              </span>
                              <div className="chat-cluster-body">
                                <div className="chat-cluster-meta">
                                  <strong>{author.name}</strong>
                                  <time dateTime={cluster.items[0].time}>{formatTime(cluster.items[0].time)}</time>
                                </div>
                                {cluster.items.map((m) => {
                                  const reactions = m.reactions || [];
                                  const liked = reactions.includes(user.id);
                                  return (
                                    <div key={m.id} className="chat-bubble-wrap">
                                      <div className="chat-bubble">
                                        {m.image && (
                                          <button
                                            type="button"
                                            className="chat-image-btn"
                                            onClick={() => setLightboxIndex(photos.findIndex((p) => p.id === m.id))}
                                            aria-label="View full-size photo"
                                          >
                                            <img src={m.image} alt="" className="chat-image" />
                                          </button>
                                        )}
                                        {m.text && <p>{m.text}</p>}
                                      </div>
                                      <div className="chat-bubble-actions">
                                        <button
                                          type="button"
                                          className={`like-btn ${liked ? 'like-btn-active' : ''}`}
                                          onClick={() => handleToggleLike(m.id)}
                                          aria-pressed={liked}
                                        >
                                          👍 {reactions.length > 0 && reactions.length}
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                    <div ref={bottomRef} />
                  </>
                )}
              </div>

              <form className="chat-composer" onSubmit={handleSend} noValidate>
                {pendingImage && (
                  <div className="composer-preview">
                    <img src={pendingImage} alt="Attachment preview" />
                    <button type="button" className="composer-preview-remove" onClick={() => setPendingImage(null)} aria-label="Remove photo">
                      ✕
                    </button>
                  </div>
                )}
                <div className="chat-composer-row">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    id="chat-image-input"
                    onChange={handleFilePick}
                  />
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label="Attach a photo"
                    title="Attach a photo"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    📷
                  </button>
                  <label htmlFor="chat-input" className="sr-only">Type a message</label>
                  <input
                    id="chat-input"
                    type="text"
                    placeholder="Type a message to the site team…"
                    value={draft}
                    onChange={(e) => {
                      setDraft(e.target.value);
                      if (draftError) setDraftError('');
                    }}
                    aria-invalid={!!draftError}
                    aria-describedby={draftError ? 'chat-error' : undefined}
                  />
                  <button type="submit" className="btn btn-primary" disabled={sending}>
                    {sending ? 'Sending…' : 'Send'}
                  </button>
                </div>
              </form>
              {draftError && <span className="field-error" id="chat-error">{draftError}</span>}
            </div>
          )}

          {activeTab === 'tasks' && (
            <div>
              <form className="task-add-form" onSubmit={handleAddTask} noValidate>
                <label htmlFor="task-input" className="sr-only">Add a task</label>
                <input
                  id="task-input"
                  type="text"
                  placeholder="Add a task for this site…"
                  value={taskDraft}
                  onChange={(e) => {
                    setTaskDraft(e.target.value);
                    if (taskError) setTaskError('');
                  }}
                  aria-invalid={!!taskError}
                  aria-describedby={taskError ? 'task-error' : undefined}
                />
                <label htmlFor="task-priority" className="sr-only">Priority</label>
                <select id="task-priority" value={taskPriority} onChange={(e) => setTaskPriority(e.target.value)}>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <label htmlFor="task-assignee" className="sr-only">Assign to</label>
                <select id="task-assignee" value={taskAssignee} onChange={(e) => setTaskAssignee(e.target.value)}>
                  <option value="">Unassigned</option>
                  {(users || []).map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
                <button type="submit" className="btn btn-primary">Add</button>
              </form>
              {taskError && <span className="field-error" id="task-error">{taskError}</span>}

              <div className="chip-group" role="group" aria-label="Filter tasks">
                {TASK_FILTERS.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    className={`chip ${taskFilter === f.value ? 'chip-active' : ''}`}
                    onClick={() => setTaskFilter(f.value)}
                    aria-pressed={taskFilter === f.value}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {tasksLoading && <LoadingSpinner label="Loading tasks…" />}
              {tasksError && <ErrorMessage message={tasksError} />}

              {!tasksLoading && !tasksError && (
                visibleTasks.length === 0 ? (
                  <p className="muted empty-state">
                    {taskFilter === 'open' ? 'No open tasks. Nice work!' : 'No tasks here yet.'}
                  </p>
                ) : (
                  <ul className="task-list">
                    {visibleTasks.map((t) => {
                      const assignee = (users || []).find((u) => u.id === t.assigneeId);
                      return (
                        <li key={t.id} className={`task-row ${t.done ? 'task-row-done' : ''}`}>
                          <label className="task-checkbox">
                            <input type="checkbox" checked={t.done} onChange={() => handleToggleTask(t.id)} />
                            <span>{t.text}</span>
                          </label>
                          <div className="task-row-meta">
                            {t.priority && <span className={`task-priority task-priority-${t.priority}`}>{t.priority}</span>}
                            {assignee && <span className="muted small">{assignee.name}</span>}
                            <button
                              type="button"
                              className="icon-btn"
                              aria-label={`Delete task: ${t.text}`}
                              onClick={() => handleDeleteTask(t.id)}
                            >
                              🗑
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )
              )}
            </div>
          )}

          {activeTab === 'photos' && (
            <div>
              {photos.length === 0 ? (
                <p className="muted empty-state">No photos uploaded to this site yet.</p>
              ) : (
                <div className="photo-grid">
                  {photos.map((m, i) => {
                    const author = userFor(m.userId);
                    return (
                      <button
                        type="button"
                        key={m.id}
                        className="photo-thumb"
                        onClick={() => setLightboxIndex(i)}
                      >
                        <img src={m.image} alt="" />
                        <span className="photo-thumb-meta">{author.name} · {formatTime(m.time)}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <aside className="site-sidebar">
          <div className="panel">
            <h2>About this site</h2>
            <ul className="list">
              <li className="list-row">
                <span className="muted">Status</span>
                <Badge status={site.status} />
              </li>
              <li className="list-row">
                <span className="muted">Open tasks</span>
                <span>{openTaskCount}</span>
              </li>
              <li className="list-row">
                <span className="muted">Last activity</span>
                <span>{formatDateLabel(site.lastActivity)}</span>
              </li>
            </ul>
          </div>

          <div className="panel">
            <h2>Team {users && `(${users.length})`}</h2>
            {usersLoading && <LoadingSpinner label="Loading team…" />}
            {usersError && <ErrorMessage message={usersError} />}
            {!usersLoading && !usersError && (
              <ul className="team-list">
                {(users || []).map((u) => (
                  <li key={u.id} className="team-list-row">
                    <span className="avatar avatar-sm" style={{ background: u.avatarColor }} aria-hidden="true">
                      {u.name.charAt(0)}
                    </span>
                    <div>
                      <strong>{u.name}</strong>
                      <div className="muted small">{u.role}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>

      <Modal
        title={lightboxIndex !== null && photos[lightboxIndex] ? `Photo ${lightboxIndex + 1} of ${photos.length}` : 'Photo'}
        isOpen={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
      >
        {lightboxIndex !== null && photos[lightboxIndex] && (
          <div className="lightbox-body">
            <img src={photos[lightboxIndex].image} alt="" className="lightbox-image" />
            <p className="muted small">
              {userFor(photos[lightboxIndex].userId).name} · {formatDateLabel(photos[lightboxIndex].time)} at {formatTime(photos[lightboxIndex].time)}
            </p>
            {photos[lightboxIndex].text && <p>{photos[lightboxIndex].text}</p>}
            {photos.length > 1 && (
              <div className="lightbox-nav">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setLightboxIndex((i) => (i - 1 + photos.length) % photos.length)}
                >
                  ← Previous
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setLightboxIndex((i) => (i + 1) % photos.length)}
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
