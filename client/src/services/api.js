const API_BASE = '/api';

async function fetchJson(url, options = {}) {
  const isFormData = options.body instanceof FormData;
  
  const headers = isFormData 
    ? { ...options.headers }
    : { 'Content-Type': 'application/json', ...options.headers };

  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Erro na requisição: ${res.status} ${res.statusText}`);
  }
  return data;
}

export const api = {
  // Tarefas
  getTasks: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchJson(`/tasks${query ? `?${query}` : ''}`);
  },
  getTask: (id) => fetchJson(`/tasks/${id}`),
  createTask: (data) => fetchJson('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (id, data) => fetchJson(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateTaskStatus: (id, status) => fetchJson(`/tasks/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteTask: (id) => fetchJson(`/tasks/${id}`, { method: 'DELETE' }),
  deleteAllTasks: () => fetchJson('/tasks/all', { method: 'DELETE' }),
  notifyTask: (id, customData = {}) => fetchJson(`/tasks/${id}/notify`, { method: 'POST', body: JSON.stringify(customData) }),

  // Importação e Lote
  createTasksBatch: (tasks, sendImmediate = false) => fetchJson('/tasks/batch', {
    method: 'POST',
    body: JSON.stringify({ tasks, send_immediate_notification: sendImmediate })
  }),
  importPdfPreview: (formData) => fetchJson('/tasks/import-pdf-preview', {
    method: 'POST',
    body: formData
  }),

  // Contatos & Funcionários
  getContacts: () => fetchJson('/contacts'),
  createContact: (data) => fetchJson('/contacts', { method: 'POST', body: JSON.stringify(data) }),
  updateContact: (id, data) => fetchJson(`/contacts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteContact: (id) => fetchJson(`/contacts/${id}`, { method: 'DELETE' }),

  // Aniversários & Mensagens Personalizadas
  getBirthdays: () => fetchJson('/birthdays'),
  generateBirthdayMessage: (params) => fetchJson('/birthdays/generate-message', {
    method: 'POST',
    body: JSON.stringify(params)
  }),
  sendBirthdayWishes: (contactId, data) => fetchJson(`/birthdays/${contactId}/send-wishes`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  syncBirthdayCalendar: (year) => fetchJson('/birthdays/sync-calendar', {
    method: 'POST',
    body: JSON.stringify({ year })
  }),

  // Configurações SMTP
  getSmtpConfig: () => fetchJson('/settings/smtp'),
  saveSmtpConfig: (data) => fetchJson('/settings/smtp', { method: 'POST', body: JSON.stringify(data) }),
  testSmtp: (data) => fetchJson('/settings/smtp/test', { method: 'POST', body: JSON.stringify(data) }),

  // Histórico e Execução de Notificações
  getNotificationLogs: (limit = 50) => fetchJson(`/notifications/logs?limit=${limit}`),
  clearNotificationLogs: () => fetchJson('/notifications/logs', { method: 'DELETE' }),
  runNotificationCheck: () => fetchJson('/notifications/run-check', { method: 'POST' }),
};
