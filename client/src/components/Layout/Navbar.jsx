import React from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Users,
  Bell,
  Settings,
  ListTodo,
  MailCheck,
  FileText,
  LogOut,
  Sun,
  Moon,
  Cake
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../UI/Toast';

export default function Navbar({
  activeTab,
  setActiveTab,
  contactsCount = 0,
  pendingTasksCount = 0,
  birthdaysCount = 0,
  todayBirthdaysCount = 0,
  onOpenCreateTask,
  onOpenPdfImport,
  onOpenContacts,
  onOpenBirthdays,
  onOpenSettings,
  onOpenHistory
}) {
  const { currentUser, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const toast = useToast();

  const handleLogoutClick = async () => {
    if (!confirm('Deseja realmente sair da sua conta?')) return;
    try {
      await logout();
      toast.info('Você saiu da sua conta.');
    } catch (err) {
      toast.error('Erro ao sair: ' + err.message);
    }
  };

  const userDisplayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Usuário';
  const userInitial = (userDisplayName[0] || 'U').toUpperCase();

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-sm dark:shadow-lg transition-colors duration-200">
      {/* Brand / Logo */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-500 text-white rounded-2xl shadow-lg shadow-blue-500/25 flex items-center justify-center">
          <CalendarIcon className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
              CALENDÁRIO OLINDINA
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
              <MailCheck className="w-3 h-3" /> Notificações Ativas
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
            Organize seu dia, aniversários de funcionários e envie avisos por e-mail
          </p>
        </div>
      </div>

      {/* Navegação Central */}
      <div className="flex items-center bg-slate-100 dark:bg-slate-950/80 p-1 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors">
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'calendar'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <CalendarIcon className="w-3.5 h-3.5" />
          Calendário
        </button>

        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all relative ${
            activeTab === 'tasks'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <ListTodo className="w-3.5 h-3.5" />
          Tarefas
          {pendingTasksCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold flex items-center justify-center">
              {pendingTasksCount}
            </span>
          )}
        </button>
      </div>

      {/* Botões de Ação & Perfil */}
      <div className="flex items-center gap-2">
        {/* Alternador de Tema Claro / Escuro */}
        <button
          onClick={toggleTheme}
          title={isDark ? 'Alternar para Modo Claro (Branco)' : 'Alternar para Modo Escuro'}
          className="p-2 text-slate-600 dark:text-amber-400 hover:text-slate-900 dark:hover:text-amber-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 rounded-xl border border-slate-200 dark:border-slate-700 transition-all shadow-sm"
          aria-label="Alternar tema"
        >
          {isDark ? (
            <Sun className="w-4 h-4 transition-transform rotate-0 hover:rotate-45" />
          ) : (
            <Moon className="w-4 h-4 transition-transform rotate-0 hover:-rotate-12" />
          )}
        </button>

        {/* Botão Importar PDF */}
        <button
          onClick={onOpenPdfImport}
          title="Importar Eventos de Arquivo PDF"
          className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-600/10 dark:hover:bg-indigo-600/20 dark:text-indigo-300 dark:hover:text-indigo-200 dark:border-indigo-500/30 rounded-xl text-xs font-semibold transition-all shadow-sm"
        >
          <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span className="hidden md:inline">Importar PDF</span>
        </button>

        {/* Botão Aniversários de Funcionários */}
        <button
          onClick={onOpenBirthdays}
          title="Aniversariantes da Escola e Homenagens"
          className={`relative p-2 rounded-xl border transition-all ${
            todayBirthdaysCount > 0
              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white border-pink-400 shadow-md shadow-pink-500/25 animate-pulse'
              : 'text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/40 hover:bg-pink-100 dark:hover:bg-pink-900/60 border-pink-200 dark:border-pink-800/80'
          }`}
        >
          <Cake className="w-4 h-4" />
          {(todayBirthdaysCount > 0 || birthdaysCount > 0) && (
            <span className={`absolute -top-1 -right-1 w-4 h-4 text-[9px] font-extrabold rounded-full flex items-center justify-center shadow ${
              todayBirthdaysCount > 0
                ? 'bg-amber-300 text-amber-950'
                : 'bg-pink-600 text-white'
            }`}>
              {todayBirthdaysCount > 0 ? todayBirthdaysCount : birthdaysCount}
            </span>
          )}
        </button>

        {/* Botão Contatos */}
        <button
          onClick={onOpenContacts}
          title="Contatos & E-mails Salvos"
          className="relative p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors"
        >
          <Users className="w-4 h-4" />
          {contactsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow">
              {contactsCount}
            </span>
          )}
        </button>

        {/* Histórico */}
        <button
          onClick={onOpenHistory}
          title="Histórico de E-mails Disparados"
          className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors"
        >
          <Bell className="w-4 h-4" />
        </button>

        {/* Configurações */}
        <button
          onClick={onOpenSettings}
          title="Configurações do Sistema"
          className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Nova Tarefa */}
        <button
          onClick={() => onOpenCreateTask()}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nova Tarefa</span>
        </button>

        {/* Chip do Usuário Logado & Logout */}
        {currentUser && (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
            <div
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300"
              title={`Conectado como: ${currentUser.email}`}
            >
              <div className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center">
                {userInitial}
              </div>
              <span className="hidden lg:inline max-w-[120px] truncate font-medium">
                {userDisplayName}
              </span>
            </div>

            <button
              onClick={handleLogoutClick}
              title="Sair da Conta (Logout)"
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 rounded-xl border border-transparent hover:border-rose-200 dark:hover:border-rose-500/20 transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
