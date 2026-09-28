import React, { useState, useEffect } from 'react';
import { X, Send, Mail, User, AlertCircle, Plus, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../UI/Toast';

export default function NotifyModal({ isOpen, onClose, task, contacts = [] }) {
  const toast = useToast();
  const [sending, setSending] = useState(false);
  const [recipients, setRecipients] = useState([]);
  const [customNote, setCustomNote] = useState('');
  const [customEmail, setCustomEmail] = useState('');

  useEffect(() => {
    if (task && isOpen) {
      setRecipients(task.notify_emails || []);
      setCustomNote('');
      setCustomEmail('');
    }
  }, [task, isOpen]);

  if (!isOpen || !task) return null;

  const toggleRecipient = (email) => {
    if (recipients.includes(email)) {
      setRecipients(recipients.filter(e => e !== email));
    } else {
      setRecipients([...recipients, email]);
    }
  };

  const handleAddEmail = () => {
    const email = customEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      toast.warning('Digite um e-mail válido');
      return;
    }
    if (!recipients.includes(email)) {
      setRecipients([...recipients, email]);
    }
    setCustomEmail('');
  };

  const handleSend = async () => {
    if (recipients.length === 0) {
      toast.warning('Selecione ao menos um destinatário para enviar o e-mail.');
      return;
    }

    try {
      setSending(true);
      const res = await api.notifyTask(task.id, {
        custom_emails: recipients,
        custom_note: customNote
      });

      if (res.result?.mode === 'simulated') {
        toast.info(`✅ Notificação simulada registrada para ${recipients.join(', ')}!`);
      } else {
        toast.success(`✅ Notificação enviada para ${recipients.length} destinatário(s)!`);
      }
      onClose();
    } catch (err) {
      toast.error('Erro no envio: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden transition-colors duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-200 dark:border-blue-500/20">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Disparar Notificação por E-mail</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Envie um lembrete com os detalhes desta tarefa</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          {/* Card Resumo da Tarefa */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Tarefa:</div>
            <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{task.title}</div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 flex gap-3">
              <span>📅 {task.date}</span>
              {task.start_time && <span>⏰ {task.start_time}</span>}
              <span className="capitalize">🏷️ {task.category}</span>
            </div>
          </div>

          {/* Destinatários */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Destinatários ({recipients.length})
            </label>

            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1">
              {contacts.map(c => {
                const isSelected = recipients.includes(c.email);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleRecipient(c.email)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                      isSelected
                        ? 'bg-blue-50 border-blue-400 text-blue-700 dark:bg-blue-600/20 dark:border-blue-500 dark:text-blue-300 shadow-xs'
                        : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <User className="w-3 h-3" />
                    <span>{c.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Input para e-mail adicional */}
            <div className="flex gap-2 pt-1">
              <input
                type="email"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddEmail(); } }}
                placeholder="Adicionar outro e-mail..."
                className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-950 transition-colors"
              />
              <button
                type="button"
                onClick={handleAddEmail}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar
              </button>
            </div>

            {/* Chips dos selecionados */}
            <div className="flex flex-wrap gap-1 pt-1">
              {recipients.map(email => (
                <span
                  key={email}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 text-xs"
                >
                  {email}
                  <button onClick={() => toggleRecipient(email)} className="hover:text-rose-500 dark:hover:text-rose-400">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Mensagem Opcional */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Mensagem / Recado Adicional (opcional)
            </label>
            <textarea
              rows="2"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="Ex: Favor confirmar presença até as 14h..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-950 resize-none transition-colors"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-xl text-sm font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSend}
            disabled={sending || recipients.length === 0}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20 transition-all"
          >
            <Send className="w-4 h-4" />
            {sending ? 'Disparando E-mail...' : 'Enviar Agora'}
          </button>
        </div>
      </div>
    </div>
  );
}
