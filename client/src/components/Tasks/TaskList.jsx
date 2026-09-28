import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  Mail,
  Send,
  Trash2,
  Edit2,
  Plus,
  Search,
  Filter,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const PRIORITIES = {
  baixa: {
    label: 'Baixa',
    color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20'
  },
  media: {
    label: 'Média',
    color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
  },
  alta: {
    label: 'Alta',
    color: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20'
  },
  urgente: {
    label: 'Urgente',
    color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'
  }
};

export default function TaskList({
  tasks = [],
  selectedDate,
  viewAll = false,
  onOpenCreateTask,
  onOpenEditTask,
  onDeleteTask,
  onDeleteAllTasks,
  onToggleStatus,
  onOpenNotifyModal
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const selectedDateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';

  const filteredTasks = tasks.filter(task => {
    if (!viewAll && task.date !== selectedDateStr) {
      return false;
    }
    if (statusFilter !== 'all' && task.status !== statusFilter) {
      return false;
    }
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
      return false;
    }
    if (search) {
      const q = search.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = task.description && task.description.toLowerCase().includes(q);
      const matchCat = task.category && task.category.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchCat) return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-sm dark:shadow-xl overflow-hidden transition-colors duration-200">
      {/* Header */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              {viewAll
                ? 'Todas as Tarefas'
                : selectedDate
                ? `Tarefas de ${format(selectedDate, "d 'de' MMMM", { locale: ptBR })}`
                : 'Tarefas do Dia'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {filteredTasks.length} {filteredTasks.length === 1 ? 'tarefa encontrada' : 'tarefas encontradas'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {tasks.length > 0 && onDeleteAllTasks && (
              <button
                onClick={onDeleteAllTasks}
                title="Excluir todas as tarefas cadastradas"
                className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/20 rounded-xl text-xs font-semibold transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Limpar Todas</span>
              </button>
            )}

            <button
              onClick={() => onOpenCreateTask(selectedDateStr)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Nova Tarefa
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtrar tarefas..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="flex gap-1.5">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="all">Todos os Status</option>
              <option value="pendente">Pendente</option>
              <option value="em_andamento">Em Andamento</option>
              <option value="concluida">Concluída</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="all">Todas as Prioridades</option>
              <option value="urgente">Urgente</option>
              <option value="alta">Alta</option>
              <option value="media">Média</option>
              <option value="baixa">Baixa</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task List Items */}
      <div className="flex-1 p-4 overflow-y-auto space-y-2.5">
        {filteredTasks.length === 0 ? (
          <div className="py-12 text-center text-slate-400 dark:text-slate-500">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Nenhuma tarefa encontrada</p>
            <p className="text-xs text-slate-400 dark:text-slate-600 mt-1">Clique em "Nova Tarefa" ou "Importar PDF" para agendar atividades.</p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isCompleted = task.status === 'concluida';
            const priorityBadge = PRIORITIES[task.priority] || PRIORITIES.media;

            return (
              <div
                key={task.id}
                className={`group p-3.5 rounded-xl border transition-all shadow-xs ${
                  isCompleted
                    ? 'bg-slate-50/50 border-slate-200/60 opacity-60 dark:bg-slate-950/40 dark:border-slate-800/60'
                    : 'bg-slate-50/70 hover:bg-slate-100/80 border-slate-200/80 dark:bg-slate-950/80 dark:border-slate-800 dark:hover:border-slate-700'
                }`}
                style={{ borderLeftColor: task.color || '#3b82f6', borderLeftWidth: '4px' }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <button
                      onClick={() => onToggleStatus(task)}
                      className="mt-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-white shrink-0 transition-colors"
                      title={isCompleted ? 'Marcar como pendente' : 'Marcar como concluída'}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                      ) : (
                        <Circle className="w-4 h-4 hover:text-blue-500 dark:hover:text-blue-400" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-semibold text-slate-900 dark:text-white ${isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
                          {task.title}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${priorityBadge.color}`}>
                          {priorityBadge.label}
                        </span>
                        {task.category && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {task.category}
                          </span>
                        )}
                      </div>

                      {task.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-2 flex-wrap">
                        {viewAll && (
                          <span className="flex items-center gap-1 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                            <Calendar className="w-3 h-3 text-blue-500 dark:text-blue-400" />
                            {task.date}
                          </span>
                        )}
                        {task.start_time && (
                          <span className="flex items-center gap-1 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                            <Clock className="w-3 h-3 text-blue-500 dark:text-blue-400" />
                            {task.start_time} {task.end_time ? `- ${task.end_time}` : ''}
                          </span>
                        )}
                        {task.notify_emails?.length > 0 && (
                          <span className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                            <Mail className="w-3 h-3" />
                            {task.notify_emails.length} e-mail(s)
                          </span>
                        )}
                      </div>

                      {/* Progresso dos Lembretes Automáticos (4 Estágios) */}
                      {task.notify_emails?.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-1.5">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Lembretes:</span>
                          {[
                            { key: '7_days', label: '7d' },
                            { key: '5_days', label: '5d' },
                            { key: '3_days', label: '3d' },
                            { key: 'day_of_event', label: 'Hoje' }
                          ].map(st => {
                            const isSent = (task.reminders_sent || []).includes(st.key) || (st.key === 'day_of_event' && Number(task.reminder_sent) === 1);
                            return (
                              <span
                                key={st.key}
                                title={isSent ? `Lembrete "${st.label}" já enviado` : `Lembrete "${st.label}" programado`}
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold border transition-all ${
                                  isSent
                                    ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30'
                                    : 'bg-slate-100 dark:bg-slate-900/90 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                                }`}
                              >
                                {st.label} {isSent ? '✓' : '⏳'}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Ações da Tarefa */}
                  <div className="flex items-center gap-1 shrink-0 opacity-90 group-hover:opacity-100">
                    <button
                      onClick={() => onOpenNotifyModal(task)}
                      title="Enviar notificação por e-mail agora"
                      className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors border border-transparent hover:border-blue-200 dark:hover:border-blue-500/20"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onOpenEditTask(task)}
                      title="Editar tarefa"
                      className="p-1.5 text-slate-400 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteTask(task.id, task.title)}
                      title="Excluir tarefa"
                      className="p-1.5 text-slate-400 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
