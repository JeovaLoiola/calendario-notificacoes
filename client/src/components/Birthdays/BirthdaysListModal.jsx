import React, { useState, useEffect } from 'react';
import {
  X,
  Cake,
  Gift,
  Calendar,
  Sparkles,
  Users,
  Search,
  RefreshCw,
  Send,
  CalendarPlus,
  Mail,
  Clock,
  ChevronRight,
  Heart,
  CheckCircle2,
  Briefcase
} from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../UI/Toast';

export default function BirthdaysListModal({
  isOpen,
  onClose,
  onOpenCelebration,
  onOpenCreateContact
}) {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [birthdayData, setBirthdayData] = useState({
    todayBirthdays: [],
    upcomingBirthdays: [],
    thisMonthBirthdays: [],
    allBirthdays: [],
    totalRegistered: 0
  });

  const [activeTab, setActiveTab] = useState('upcoming'); // 'today' | 'upcoming' | 'all'
  const [search, setSearch] = useState('');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState('all');

  const loadBirthdays = async () => {
    try {
      setLoading(true);
      const data = await api.getBirthdays();
      setBirthdayData(data || {
        todayBirthdays: [],
        upcomingBirthdays: [],
        thisMonthBirthdays: [],
        allBirthdays: [],
        totalRegistered: 0
      });
      if (data?.todayBirthdays?.length > 0) {
        setActiveTab('today');
      }
    } catch (err) {
      toast.error('Erro ao carregar aniversariantes: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadBirthdays();
      setSearch('');
    }
  }, [isOpen]);

  const handleSyncCalendar = async () => {
    try {
      setSyncing(true);
      const res = await api.syncBirthdayCalendar(new Date().getFullYear());
      toast.success(res.message || 'Aniversários sincronizados com sucesso no calendário escolar!');
      loadBirthdays();
    } catch (err) {
      toast.error('Erro ao sincronizar: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  if (!isOpen) return null;

  const currentList = () => {
    let list = [];
    if (activeTab === 'today') list = birthdayData.todayBirthdays || [];
    else if (activeTab === 'upcoming') list = birthdayData.upcomingBirthdays || [];
    else list = birthdayData.allBirthdays || [];

    if (selectedMonthFilter !== 'all') {
      const monthNum = parseInt(selectedMonthFilter, 10);
      list = list.filter(b => b.month === monthNum);
    }

    if (search.trim()) {
      const query = search.toLowerCase();
      list = list.filter(b =>
        b.name.toLowerCase().includes(query) ||
        (b.role && b.role.toLowerCase().includes(query)) ||
        (b.department && b.department.toLowerCase().includes(query)) ||
        (b.email && b.email.toLowerCase().includes(query))
      );
    }

    return list;
  };

  const displayedList = currentList();

  const MONTHS = [
    { value: '1', label: 'Janeiro' },
    { value: '2', label: 'Fevereiro' },
    { value: '3', label: 'Março' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Maio' },
    { value: '6', label: 'Junho' },
    { value: '7', label: 'Julho' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-pink-500 to-purple-600 text-white rounded-2xl shadow-md shadow-pink-500/20">
              <Cake className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Aniversários dos Funcionários da Escola
                </h2>
                {birthdayData.todayBirthdays?.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-pink-500 text-white animate-pulse">
                    {birthdayData.todayBirthdays.length} Hoje! 🎂
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gerencie as datas comemorativas, gere textos exclusivos e envie mensagens de parabéns
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncCalendar}
              disabled={syncing}
              title="Sincronizar datas de aniversário no calendário escolar"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:hover:bg-purple-900/60 dark:text-purple-300 rounded-xl text-xs font-bold border border-purple-200 dark:border-purple-800/80 transition-all"
            >
              <CalendarPlus className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sincronizar no Calendário</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Banner Especial para Aniversariantes de Hoje */}
        {birthdayData.todayBirthdays?.length > 0 && (
          <div className="mx-6 mt-4 p-4 bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white rounded-2xl shadow-lg shadow-pink-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="text-3xl animate-bounce">🎂</div>
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                  🎉 ANIVERSARIANTE(S) DE HOJE!
                </h3>
                <p className="text-xs text-white/90">
                  {birthdayData.todayBirthdays.map(b => b.name).join(', ')}
                </p>
              </div>
            </div>

            <button
              onClick={() => onOpenCelebration(birthdayData.todayBirthdays[0])}
              className="px-4 py-2 bg-white text-pink-600 hover:bg-pink-50 rounded-xl text-xs font-extrabold shadow-md transition-all shrink-0 flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-pink-500" />
              Parabenizar Agora
            </button>
          </div>
        )}

        {/* Tabs e Filtros */}
        <div className="px-6 pt-4 pb-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            {birthdayData.todayBirthdays?.length > 0 && (
              <button
                onClick={() => setActiveTab('today')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'today'
                    ? 'bg-pink-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Cake className="w-3.5 h-3.5" />
                Hoje ({birthdayData.todayBirthdays.length})
              </button>
            )}

            <button
              onClick={() => setActiveTab('upcoming')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'upcoming'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Próximos 30 Dias ({birthdayData.upcomingBirthdays?.length || 0})
            </button>

            <button
              onClick={() => setActiveTab('all')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'all'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Todos ({birthdayData.totalRegistered || 0})
            </button>
          </div>

          {/* Filtros e Busca */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar aniversariante..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-purple-500"
              />
            </div>

            {activeTab === 'all' && (
              <select
                value={selectedMonthFilter}
                onChange={(e) => setSelectedMonthFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-purple-500"
              >
                <option value="all">Todos os Meses</option>
                {MONTHS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Lista de Aniversariantes */}
        <div className="p-6 flex-1 overflow-y-auto space-y-3">
          {loading ? (
            <div className="py-12 text-center text-sm text-slate-500">
              Carregando calendário de aniversários...
            </div>
          ) : displayedList.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6">
              <Cake className="w-10 h-10 mx-auto mb-2 text-pink-400/50" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Nenhum aniversariante encontrado nesta visualização
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                Cadastre ou edite funcionários na lista de contatos informando a data de nascimento para ativar os lembretes e homenagens automáticas.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {displayedList.map(contact => (
                <div
                  key={contact.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                    contact.isToday
                      ? 'bg-gradient-to-br from-pink-50/80 to-purple-50/80 dark:from-pink-950/30 dark:to-purple-950/30 border-pink-300 dark:border-pink-800 shadow-md shadow-pink-500/10'
                      : 'bg-white dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {contact.name}
                        </span>
                        {contact.isToday && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-pink-500 text-white uppercase tracking-wider animate-pulse">
                            Hoje! 🎉
                          </span>
                        )}
                      </div>

                      {contact.role && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                          <Briefcase className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                          <span className="truncate">{contact.role}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-pink-50 dark:bg-pink-950/50 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800/60">
                          <Cake className="w-3 h-3 text-pink-500" />
                          {contact.formattedDayMonth}
                        </span>

                        {!contact.isToday && contact.daysUntil !== undefined && (
                          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                            {contact.daysUntil === 0
                              ? 'Hoje'
                              : contact.daysUntil === 1
                              ? 'Amanhã 🎈'
                              : `Em ${contact.daysUntil} dias`}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => onOpenCelebration(contact)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold shadow-md shadow-pink-500/20 transition-all shrink-0"
                      title="Gerar mensagem e parabenizar"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Parabenizar
                    </button>
                  </div>

                  {/* Mensagem Gerada Prévia */}
                  {contact.personalizedMessage && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-600 dark:text-slate-400 italic line-clamp-2">
                      "{contact.personalizedMessage.split('\n')[0]}..."
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
          <span>
            Total de <strong>{birthdayData.totalRegistered}</strong> aniversários cadastrados na escola
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 rounded-xl font-medium transition-colors"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
}
