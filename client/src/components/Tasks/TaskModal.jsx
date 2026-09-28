import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Tag, AlertCircle, Mail, Send, CheckCircle2, User, Plus } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../UI/Toast';

const CATEGORIES = ['Trabalho', 'Reunião', 'Projeto', 'Pessoal', 'Estudos', 'Urgente', 'Outro'];
const PRIORITIES = [
  {
    id: 'baixa',
    label: 'Baixa',
    color: 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30'
  },
  {
    id: 'media',
    label: 'Média',
    color: 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30'
  },
  {
    id: 'alta',
    label: 'Alta',
    color: 'bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-500/30'
  },
  {
    id: 'urgente',
    label: 'Urgente',
    color: 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30'
  }
];

const COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#ef4444', // red
  '#ec4899', // pink
  '#06b6d4'  // cyan
];

export default function TaskModal({
  isOpen,
  onClose,
  initialDate,
  editingTask,
  contacts = [],
  onTaskSaved
}) {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [customEmailInput, setCustomEmailInput] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: initialDate || new Date().toISOString().split('T')[0],
    start_time: '09:00',
    end_time: '10:00',
    priority: 'media',
    status: 'pendente',
    category: 'Trabalho',
    color: '#3b82f6',
    notify_emails: [],
    reminder_minutes: 60,
    send_immediate_notification: false
  });

  useEffect(() => {
    if (editingTask) {
      setFormData({
        title: editingTask.title || '',
        description: editingTask.description || '',
        date: editingTask.date || initialDate,
        start_time: editingTask.start_time || '',
        end_time: editingTask.end_time || '',
        priority: editingTask.priority || 'media',
        status: editingTask.status || 'pendente',
        category: editingTask.category || 'Trabalho',
        color: editingTask.color || '#3b82f6',
        notify_emails: editingTask.notify_emails || [],
        reminder_minutes: editingTask.reminder_minutes !== undefined ? editingTask.reminder_minutes : 60,
        send_immediate_notification: false
      });
    } else {
      setFormData({
        title: '',
        description: '',
        date: initialDate || new Date().toISOString().split('T')[0],
        start_time: '09:00',
        end_time: '10:00',
        priority: 'media',
        status: 'pendente',
        category: 'Trabalho',
        color: '#3b82f6',
        notify_emails: [],
        reminder_minutes: 60,
        send_immediate_notification: false
      });
    }
  }, [editingTask, initialDate, isOpen]);

  if (!isOpen) return null;

  const toggleEmailRecipient = (email) => {
    const current = formData.notify_emails || [];
    if (current.includes(email)) {
      setFormData({ ...formData, notify_emails: current.filter(e => e !== email) });
    } else {
      setFormData({ ...formData, notify_emails: [...current, email] });
    }
  };

  const handleAddCustomEmail = () => {
    const email = customEmailInput.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      toast.warning('Digite um e-mail válido');
      return;
    }
    if (!formData.notify_emails.includes(email)) {
      setFormData({ ...formData, notify_emails: [...formData.notify_emails, email] });
    }
    setCustomEmailInput('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.warning('Informe o título da tarefa.');
      return;
    }

    try {
      setSubmitting(true);
      if (editingTask) {
        await api.updateTask(editingTask.id, formData);
        toast.success('Tarefa atualizada com sucesso!');
      } else {
        const res = await api.createTask(formData);
        toast.success('Tarefa criada com sucesso!');
        if (res.notification) {
          toast.info('Notificação por e-mail enviada!');
        }
      }

      if (onTaskSaved) onTaskSaved();
      onClose();
    } catch (err) {
      toast.error('Erro ao salvar tarefa: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden transition-colors duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-full shadow-md"
              style={{ backgroundColor: formData.color }}
            />
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingTask ? 'Editar Tarefa' : 'Nova Tarefa no Calendário'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Preencha os detalhes e configure os e-mails para aviso</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Título */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Título da Tarefa *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Reunião com Cliente, Entrega de Relatório..."
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-950 transition-all font-medium"
            />
          </div>

          {/* Data e Horários */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                Data *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                Início
              </label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                Fim
              </label>
              <input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Prioridade e Categoria */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Prioridade</label>
              <div className="grid grid-cols-2 gap-2">
                {PRIORITIES.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, priority: p.id })}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      formData.priority === p.id
                        ? `${p.color} ring-2 ring-blue-500/50`
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400 dark:hover:border-slate-700'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Categoria</label>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: cat })}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                      formData.category === cat
                        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-500/20 dark:text-blue-300'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Cor da Etiqueta */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Cor da Etiqueta</label>
            <div className="flex items-center gap-2">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: c })}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    formData.color === c ? 'scale-125 ring-2 ring-slate-800 dark:ring-white shadow-md' : 'hover:scale-110 opacity-80'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Descrição / Notas</label>
            <textarea
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detalhes adicionais, pauta da reunião ou observações importantes..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-950 resize-none transition-colors"
            />
          </div>

          {/* Seção de E-mails / Destinatários */}
          <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                Destinatários para Notificação por E-mail
              </label>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {formData.notify_emails.length} selecionado(s)
              </span>
            </div>

            {/* Chips de Contatos Salvos */}
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1.5">Contatos Salvos:</span>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                {contacts.length === 0 ? (
                  <span className="text-xs text-slate-400 dark:text-slate-500 italic">Nenhum contato salvo ainda.</span>
                ) : (
                  contacts.map(c => {
                    const isSelected = formData.notify_emails.includes(c.email);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleEmailRecipient(c.email)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                          isSelected
                            ? 'bg-blue-50 border-blue-400 text-blue-700 dark:bg-blue-600/20 dark:border-blue-500 dark:text-blue-300 shadow-xs'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <User className="w-3 h-3" />
                        <span>{c.name}</span>
                        <span className="text-[10px] opacity-75">({c.email})</span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Adicionar e-mail avulso */}
            <div className="flex gap-2">
              <input
                type="email"
                value={customEmailInput}
                onChange={(e) => setCustomEmailInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomEmail(); } }}
                placeholder="Ou digite outro e-mail (ex: cliente@email.com)"
                className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleAddCustomEmail}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar
              </button>
            </div>

            {/* E-mails selecionados lista rápida */}
            {formData.notify_emails.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {formData.notify_emails.map(email => (
                  <span
                    key={email}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 text-[11px]"
                  >
                    {email}
                    <button
                      type="button"
                      onClick={() => toggleEmailRecipient(email)}
                      className="hover:text-rose-500 dark:hover:text-rose-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Cronograma de Notificações Automáticas */}
            {formData.notify_emails.length > 0 && (
              <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-500/20 text-xs text-slate-700 dark:text-slate-300 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-blue-700 dark:text-blue-300 text-[11px]">
                  <span>🔔</span>
                  Régua de Notificações Automáticas (4 Frequências):
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 pt-0.5 text-[10px] font-semibold text-center">
                  <span className="px-1.5 py-1 bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-300 rounded-lg border border-blue-200 dark:border-blue-500/20">
                    1. 📅 1 Semana Antes
                  </span>
                  <span className="px-1.5 py-1 bg-purple-100 text-purple-800 dark:bg-purple-500/10 dark:text-purple-300 rounded-lg border border-purple-200 dark:border-purple-500/20">
                    2. 🔔 5 Dias Antes
                  </span>
                  <span className="px-1.5 py-1 bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300 rounded-lg border border-amber-200 dark:border-amber-500/20">
                    3. ⚠️ 3 Dias Antes
                  </span>
                  <span className="px-1.5 py-1 bg-rose-100 text-rose-800 dark:bg-rose-500/10 dark:text-rose-300 rounded-lg border border-rose-200 dark:border-rose-500/20">
                    4. 🚨 No Dia do Evento
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Os destinatários acima receberão os e-mails automaticamente nas datas correspondentes.
                </p>
              </div>
            )}

            {/* Checkbox Enviar Agora */}
            {!editingTask && formData.notify_emails.length > 0 && (
              <label className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.send_immediate_notification}
                  onChange={(e) => setFormData({ ...formData, send_immediate_notification: e.target.checked })}
                  className="rounded bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                  Enviar notificação por e-mail imediatamente ao salvar
                </span>
              </label>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-xl text-sm font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            {submitting ? 'Salvando...' : editingTask ? 'Atualizar Tarefa' : 'Criar Tarefa'}
          </button>
        </div>
      </div>
    </div>
  );
}
