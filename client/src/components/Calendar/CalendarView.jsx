import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  Mail,
  CheckCircle2,
  Circle,
  Edit2,
  Trash2,
  Send
} from 'lucide-react';
import {
  format,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addWeeks,
  subWeeks,
  addDays,
  subDays
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function CalendarView({
  currentDate,
  onDateChange,
  selectedDate,
  onSelectDate,
  tasks = [],
  onOpenTaskModal,
  onOpenEditTask,
  onDeleteTask,
  onOpenNotifyModal,
  onToggleStatus
}) {
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'week' | 'day'

  // Navegação
  const handlePrev = () => {
    if (viewMode === 'month') onDateChange(subMonths(currentDate, 1));
    else if (viewMode === 'week') onDateChange(subWeeks(currentDate, 1));
    else onDateChange(subDays(currentDate, 1));
  };

  const handleNext = () => {
    if (viewMode === 'month') onDateChange(addMonths(currentDate, 1));
    else if (viewMode === 'week') onDateChange(addWeeks(currentDate, 1));
    else onDateChange(addDays(currentDate, 1));
  };

  const handleToday = () => {
    const today = new Date();
    onDateChange(today);
    onSelectDate(today);
  };

  // Obter tarefas de um dia específico
  const getTasksForDay = (day) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return tasks.filter(t => t.date === dayStr);
  };

  // Renderização da Visão Mensal
  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    return (
      <div className="flex flex-col flex-1 h-full min-h-[580px]">
        {/* Cabeçalho dos dias da semana */}
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 text-center py-2.5">
          {weekDays.map((wd, i) => (
            <div
              key={wd}
              className={`text-xs font-bold uppercase tracking-wider ${
                i === 0 || i === 6
                  ? 'text-slate-400 dark:text-slate-500'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {wd}
            </div>
          ))}
        </div>

        {/* Grade de Dias */}
        <div className="grid grid-cols-7 flex-1 auto-rows-fr bg-white dark:bg-slate-950/40 divide-x divide-y divide-slate-100 dark:divide-slate-800/60">
          {days.map((day) => {
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isSelected = isSameDay(day, selectedDate);
            const isDayToday = isToday(day);
            const dayTasks = getTasksForDay(day);

            return (
              <div
                key={day.toISOString()}
                onClick={() => onSelectDate(day)}
                className={`group relative p-2 min-h-[95px] sm:min-h-[110px] transition-all flex flex-col justify-between cursor-pointer ${
                  !isCurrentMonth
                    ? 'bg-slate-50/40 text-slate-400 opacity-60 dark:bg-slate-950/20 dark:text-slate-600'
                    : isSelected
                    ? 'bg-blue-50/80 dark:bg-blue-900/20 ring-1 ring-inset ring-blue-500/40'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-900/50'
                }`}
              >
                {/* Cabeçalho do dia no card */}
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center justify-center w-7 h-7 text-xs font-bold rounded-xl transition-all ${
                      isDayToday
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 ring-2 ring-blue-400'
                        : isSelected
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 font-extrabold'
                        : isCurrentMonth
                        ? 'text-slate-700 group-hover:text-slate-900 dark:text-slate-300 dark:group-hover:text-white'
                        : 'text-slate-400 dark:text-slate-600'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>

                  {/* Botão rápido de adicionar tarefa */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectDate(day);
                      onOpenTaskModal(format(day, 'yyyy-MM-dd'));
                    }}
                    title="Adicionar tarefa neste dia"
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-blue-600 hover:text-white text-slate-400 rounded-lg transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Lista de chips de tarefas no dia */}
                <div className="mt-1 space-y-1 overflow-hidden flex-1">
                  {dayTasks.slice(0, 3).map((task) => (
                    <div
                      key={task.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectDate(day);
                      }}
                      className="group/item flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-medium transition-all truncate border shadow-xs"
                      style={{
                        backgroundColor: `${task.color}15`,
                        borderColor: `${task.color}35`,
                        color: task.color
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: task.color }}
                      />
                      {task.start_time && (
                        <span className="opacity-80 font-mono text-[10px] shrink-0 font-semibold">
                          {task.start_time}
                        </span>
                      )}
                      <span className={`truncate font-medium ${task.status === 'concluida' ? 'line-through opacity-50 text-slate-500 dark:text-slate-400' : ''}`}>
                        {task.title}
                      </span>
                    </div>
                  ))}

                  {dayTasks.length > 3 && (
                    <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 pl-1">
                      +{dayTasks.length - 3} mais
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Renderização da Visão Semanal
  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return (
      <div className="flex flex-col flex-1 h-full min-h-[580px]">
        <div className="grid grid-cols-7 flex-1 divide-x divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950/40">
          {days.map((day) => {
            const dayTasks = getTasksForDay(day);
            const isDayToday = isToday(day);
            const isSelected = isSameDay(day, selectedDate);

            return (
              <div
                key={day.toISOString()}
                onClick={() => onSelectDate(day)}
                className={`p-3 flex flex-col transition-colors ${
                  isSelected
                    ? 'bg-blue-50/60 dark:bg-blue-900/10'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-900/30'
                }`}
              >
                <div className="text-center pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400">
                    {format(day, 'EEE', { locale: ptBR })}
                  </div>
                  <div
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold mt-1 ${
                      isDayToday
                        ? 'bg-blue-600 text-white'
                        : isSelected
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'
                        : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {format(day, 'd')}
                  </div>
                </div>

                <div className="mt-3 space-y-2 flex-1 overflow-y-auto">
                  {dayTasks.map((task) => (
                    <div
                      key={task.id}
                      className="group/weekTask p-2.5 rounded-xl border bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all text-xs relative shadow-xs"
                      style={{ borderLeftColor: task.color, borderLeftWidth: '4px' }}
                    >
                      <div className="font-semibold text-slate-900 dark:text-white truncate">{task.title}</div>
                      {task.start_time && (
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-blue-500 dark:text-blue-400" />
                          {task.start_time} {task.end_time ? `- ${task.end_time}` : ''}
                        </div>
                      )}
                    </div>
                  ))}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectDate(day);
                      onOpenTaskModal(format(day, 'yyyy-MM-dd'));
                    }}
                    className="w-full py-2 border border-dashed border-slate-300 dark:border-slate-800 hover:border-blue-500/50 hover:bg-blue-50 dark:hover:bg-blue-500/10 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 rounded-xl text-xs flex items-center justify-center gap-1 transition-all mt-2"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Adicionar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Renderização da Visão Diária
  const renderDayView = () => {
    const dayTasks = getTasksForDay(selectedDate);
    const isDayToday = isToday(selectedDate);

    return (
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
              {isDayToday && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30">
                  Hoje
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {dayTasks.length} {dayTasks.length === 1 ? 'compromisso agendado' : 'compromissos agendados'}
            </p>
          </div>

          <button
            onClick={() => onOpenTaskModal(format(selectedDate, 'yyyy-MM-dd'))}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Nova Tarefa
          </button>
        </div>

        <div className="mt-4 space-y-3 flex-1 overflow-y-auto">
          {dayTasks.length === 0 ? (
            <div className="py-16 text-center text-slate-400 dark:text-slate-500">
              <CalendarIcon className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-400" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Nenhuma tarefa para este dia</p>
              <p className="text-xs text-slate-500 dark:text-slate-600 mt-1">Clique em "Nova Tarefa" para adicionar um compromisso.</p>
            </div>
          ) : (
            dayTasks.map((task) => (
              <div
                key={task.id}
                className="group p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex items-start justify-between gap-4 shadow-xs"
                style={{ borderLeftColor: task.color, borderLeftWidth: '5px' }}
              >
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => onToggleStatus && onToggleStatus(task)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                      title={task.status === 'concluida' ? 'Marcar como pendente' : 'Marcar como concluída'}
                    >
                      {task.status === 'concluida' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                      ) : (
                        <Circle className="w-4 h-4" />
                      )}
                    </button>
                    <span className={`text-base font-bold text-slate-900 dark:text-white ${task.status === 'concluida' ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
                      {task.title}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {task.category}
                    </span>
                  </div>

                  {task.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 pl-6 line-clamp-2">{task.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pl-6 pt-1 flex-wrap">
                    {task.start_time && (
                      <span className="flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                        {task.start_time} {task.end_time ? `- ${task.end_time}` : ''}
                      </span>
                    )}
                    {task.notify_emails?.length > 0 && (
                      <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                        <Mail className="w-3.5 h-3.5" />
                        {task.notify_emails.length} e-mail(s)
                      </span>
                    )}
                    {task.notify_emails?.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
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
                                  : 'bg-slate-100 dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800'
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

                {/* Botões de Ação na Linha */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => onOpenNotifyModal && onOpenNotifyModal(task)}
                    title="Disparar notificação por e-mail"
                    className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-600/20 rounded-lg transition-colors border border-transparent hover:border-blue-200 dark:hover:border-blue-500/20"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                  {onOpenEditTask && (
                    <button
                      onClick={() => onOpenEditTask(task)}
                      title="Editar tarefa"
                      className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                  {onDeleteTask && (
                    <button
                      onClick={() => onDeleteTask(task.id, task.title)}
                      title="Excluir tarefa"
                      className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-sm dark:shadow-xl overflow-hidden transition-colors duration-200">
      {/* Barra Superior de Controle do Calendário */}
      <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 gap-3">
        {/* Mês/Ano e Navegação */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              title="Anterior"
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              title="Próximo"
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <h2 className="text-lg font-bold text-slate-900 dark:text-white capitalize min-w-[180px]">
            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
          </h2>

          <button
            onClick={handleToday}
            className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors"
          >
            Hoje
          </button>
        </div>

        {/* Alternador de Visões */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors">
          {[
            { id: 'month', label: 'Mês' },
            { id: 'week', label: 'Semana' },
            { id: 'day', label: 'Dia' }
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setViewMode(mode.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === mode.id
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conteúdo Dinâmico da Visão */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {viewMode === 'month' && renderMonthView()}
        {viewMode === 'week' && renderWeekView()}
        {viewMode === 'day' && renderDayView()}
      </div>
    </div>
  );
}
