import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import Navbar from './components/Layout/Navbar';
import CalendarView from './components/Calendar/CalendarView';
import TaskList from './components/Tasks/TaskList';
import TaskModal from './components/Tasks/TaskModal';
import NotifyModal from './components/Tasks/NotifyModal';
import PdfImportModal from './components/Tasks/PdfImportModal';
import ContactsModal from './components/Contacts/ContactsModal';
import SettingsModal from './components/Settings/SettingsModal';
import NotificationHistoryModal from './components/Notifications/NotificationHistoryModal';
import BirthdayCelebrationModal from './components/Birthdays/BirthdayCelebrationModal';
import BirthdaysListModal from './components/Birthdays/BirthdaysListModal';
import LoginPage from './components/Auth/LoginPage';
import { ToastProvider, useToast } from './components/UI/Toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { api } from './services/api';

function MainApp() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('calendar'); // 'calendar' | 'tasks'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [tasks, setTasks] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [birthdaysData, setBirthdaysData] = useState({
    todayBirthdays: [],
    upcomingBirthdays: [],
    thisMonthBirthdays: [],
    allBirthdays: [],
    totalRegistered: 0
  });
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [targetDateForNewTask, setTargetDateForNewTask] = useState('');

  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
  const [notifyingTask, setNotifyingTask] = useState(null);

  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isContactsModalOpen, setIsContactsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Aniversários state
  const [isBirthdaysListModalOpen, setIsBirthdaysListModalOpen] = useState(false);
  const [isCelebrationModalOpen, setIsCelebrationModalOpen] = useState(false);
  const [celebratingContact, setCelebratingContact] = useState(null);

  // Carregar tarefas, contatos e aniversários
  const loadData = async () => {
    try {
      setLoading(true);
      const [tasksData, contactsData, bdaysData] = await Promise.all([
        api.getTasks(),
        api.getContacts(),
        api.getBirthdays().catch(() => ({ todayBirthdays: [], upcomingBirthdays: [], totalRegistered: 0 }))
      ]);
      setTasks(Array.isArray(tasksData) ? tasksData : []);
      setContacts(Array.isArray(contactsData) ? contactsData : []);
      setBirthdaysData(bdaysData || { todayBirthdays: [], upcomingBirthdays: [], totalRegistered: 0 });
    } catch (err) {
      toast.error('Erro ao sincronizar dados: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handlers para tarefas
  const handleOpenCreateTask = (dateStr) => {
    setEditingTask(null);
    setTargetDateForNewTask(dateStr || format(selectedDate, 'yyyy-MM-dd'));
    setIsTaskModalOpen(true);
  };

  const handleOpenEditTask = (task) => {
    setEditingTask(task);
    setTargetDateForNewTask(task.date);
    setIsTaskModalOpen(true);
  };

  const handleDeleteTask = async (id, title) => {
    if (!confirm(`Deseja realmente remover a tarefa "${title || 'esta tarefa'}"?`)) return;
    try {
      await api.deleteTask(id);
      toast.success('Tarefa removida com sucesso!');
      setTasks(prev => prev.filter(t => String(t.id) !== String(id) && Number(t.id) !== Number(id)));
    } catch (err) {
      toast.error('Erro ao excluir tarefa: ' + err.message);
    }
  };

  const handleDeleteAllTasks = async () => {
    if (!confirm('Deseja realmente remover TODAS as tarefas cadastradas no calendário? Esta ação não pode ser desfeita.')) return;
    try {
      await api.deleteAllTasks();
      toast.success('Todas as tarefas foram removidas com sucesso!');
      setTasks([]);
    } catch (err) {
      toast.error('Erro ao limpar tarefas: ' + err.message);
    }
  };

  const handleToggleStatus = async (task) => {
    const newStatus = task.status === 'concluida' ? 'pendente' : 'concluida';
    try {
      const updated = await api.updateTaskStatus(task.id, newStatus);
      setTasks(prev => prev.map(t => (String(t.id) === String(task.id) ? updated : t)));
      if (newStatus === 'concluida') {
        toast.success(`Tarefa "${task.title}" marcada como concluída! 🎉`);
      } else {
        toast.info(`Tarefa "${task.title}" reaberta como pendente.`);
      }
    } catch (err) {
      toast.error('Erro ao alterar status: ' + err.message);
    }
  };

  const handleOpenNotifyModal = (task) => {
    setNotifyingTask(task);
    setIsNotifyModalOpen(true);
  };

  // Handler para abrir modal de celebração de aniversário
  const handleOpenCelebration = (target) => {
    if (!target) return;
    
    // Se for um contato direto
    if (target.email || target.birth_date || target.name) {
      // Tentar enriquecer com o contato do banco se necessário
      const matched = contacts.find(c => c.id === target.id || (target.email && c.email === target.email));
      setCelebratingContact(matched || target);
      setIsCelebrationModalOpen(true);
      return;
    }

    // Se for uma tarefa de aniversário do calendário
    if (target.category?.includes('Aniversário') || target.title?.includes('🎂')) {
      const nameMatch = target.title.replace(/^🎂\s*(Aniversário:)?\s*/i, '').trim();
      const matched = contacts.find(c => 
        c.name.toLowerCase().includes(nameMatch.toLowerCase()) ||
        (target.notify_emails && target.notify_emails.includes(c.email))
      );

      if (matched) {
        setCelebratingContact(matched);
      } else {
        setCelebratingContact({
          name: nameMatch || 'Colega',
          role: 'Funcionário(a) da Escola',
          email: target.notify_emails?.[0] || ''
        });
      }
      setIsCelebrationModalOpen(true);
    }
  };

  const pendingTasksCount = tasks.filter(t => t.status !== 'concluida').length;
  const todayBirthdaysCount = birthdaysData?.todayBirthdays?.length || 0;
  const birthdaysCount = birthdaysData?.totalRegistered || 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        contactsCount={contacts.length}
        pendingTasksCount={pendingTasksCount}
        birthdaysCount={birthdaysCount}
        todayBirthdaysCount={todayBirthdaysCount}
        onOpenCreateTask={handleOpenCreateTask}
        onOpenPdfImport={() => setIsPdfModalOpen(true)}
        onOpenContacts={() => setIsContactsModalOpen(true)}
        onOpenBirthdays={() => setIsBirthdaysListModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenHistory={() => setIsHistoryModalOpen(true)}
      />

      {/* Main Content View */}
      <main className="flex-1 p-4 sm:p-6 max-w-[1600px] w-full mx-auto flex flex-col">
        {activeTab === 'calendar' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 items-start">
            {/* Calendário Principal (Esquerda - 8 colunas) */}
            <div className="lg:col-span-8 h-full min-h-[600px]">
              <CalendarView
                currentDate={currentDate}
                onDateChange={setCurrentDate}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                tasks={tasks}
                onOpenTaskModal={handleOpenCreateTask}
                onOpenEditTask={handleOpenEditTask}
                onDeleteTask={handleDeleteTask}
                onOpenNotifyModal={handleOpenNotifyModal}
                onToggleStatus={handleToggleStatus}
              />
            </div>

            {/* Painel de Tarefas do Dia Selecionado (Direita - 4 colunas) */}
            <div className="lg:col-span-4 h-full min-h-[600px]">
              <TaskList
                tasks={tasks}
                selectedDate={selectedDate}
                viewAll={false}
                onOpenCreateTask={handleOpenCreateTask}
                onOpenEditTask={handleOpenEditTask}
                onDeleteTask={handleDeleteTask}
                onDeleteAllTasks={handleDeleteAllTasks}
                onToggleStatus={handleToggleStatus}
                onOpenNotifyModal={handleOpenNotifyModal}
              />
            </div>
          </div>
        ) : (
          /* Visão Todas as Tarefas */
          <div className="flex-1 min-h-[600px]">
            <TaskList
              tasks={tasks}
              selectedDate={null}
              viewAll={true}
              onOpenCreateTask={handleOpenCreateTask}
              onOpenEditTask={handleOpenEditTask}
              onDeleteTask={handleDeleteTask}
              onDeleteAllTasks={handleDeleteAllTasks}
              onToggleStatus={handleToggleStatus}
              onOpenNotifyModal={handleOpenNotifyModal}
            />
          </div>
        )}
      </main>

      {/* Modais da Aplicação */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        initialDate={targetDateForNewTask}
        editingTask={editingTask}
        contacts={contacts}
        onTaskSaved={loadData}
      />

      <NotifyModal
        isOpen={isNotifyModalOpen}
        onClose={() => setIsNotifyModalOpen(false)}
        task={notifyingTask}
        contacts={contacts}
      />

      <PdfImportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        contacts={contacts}
        onImportComplete={loadData}
      />

      <ContactsModal
        isOpen={isContactsModalOpen}
        onClose={() => setIsContactsModalOpen(false)}
        onContactsUpdated={(newContacts) => {
          setContacts(newContacts);
          loadData();
        }}
        onOpenCelebration={handleOpenCelebration}
      />

      <BirthdaysListModal
        isOpen={isBirthdaysListModalOpen}
        onClose={() => setIsBirthdaysListModalOpen(false)}
        onOpenCelebration={(c) => {
          setIsBirthdaysListModalOpen(false);
          handleOpenCelebration(c);
        }}
        onOpenCreateContact={() => {
          setIsBirthdaysListModalOpen(false);
          setIsContactsModalOpen(true);
        }}
      />

      <BirthdayCelebrationModal
        isOpen={isCelebrationModalOpen}
        onClose={() => {
          setIsCelebrationModalOpen(false);
          setCelebratingContact(null);
        }}
        contact={celebratingContact}
        onWishesSent={() => {
          loadData();
        }}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />

      <NotificationHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
      />
    </div>
  );
}

function RootApp() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col items-center justify-center p-4 transition-colors duration-200">
        <div className="p-4 bg-gradient-to-tr from-blue-600 to-indigo-500 text-white rounded-3xl shadow-2xl shadow-blue-500/30 mb-4 animate-pulse">
          <CalendarIcon className="w-10 h-10" />
        </div>
        <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
          Verificando autenticação Firebase...
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage />;
  }

  return <MainApp />;
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <RootApp />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
