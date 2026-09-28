import React, { useState, useEffect } from 'react';
import {
  X,
  UserPlus,
  Mail,
  Phone,
  Briefcase,
  Trash2,
  Edit2,
  Check,
  Search,
  Users,
  Cake,
  Sparkles,
  Building,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../UI/Toast';

export default function ContactsModal({
  isOpen,
  onClose,
  onContactsUpdated,
  onOpenCelebration
}) {
  const toast = useToast();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingContact, setEditingContact] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Modal de confirmação de exclusão
  const [contactToDelete, setContactToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    birth_date: '',
    department: ''
  });

  const loadContacts = async () => {
    try {
      setLoading(true);
      const data = await api.getContacts();
      setContacts(Array.isArray(data) ? data : []);
      if (onContactsUpdated) onContactsUpdated(data);
    } catch (err) {
      toast.error('Erro ao carregar contatos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadContacts();
      setShowForm(false);
      setEditingContact(null);
      setContactToDelete(null);
      setSearch('');
    }
  }, [isOpen]);

  const handleOpenCreate = () => {
    setEditingContact(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: '',
      birth_date: '',
      department: ''
    });
    setShowForm(true);
  };

  const handleOpenEdit = (contact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      email: contact.email,
      phone: contact.phone || '',
      role: contact.role || '',
      birth_date: contact.birth_date || '',
      department: contact.department || ''
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.warning('Nome e E-mail são obrigatórios.');
      return;
    }

    try {
      if (editingContact) {
        await api.updateContact(editingContact.id, formData);
        toast.success('Funcionário/Contato atualizado com sucesso!');
      } else {
        await api.createContact(formData);
        toast.success('Funcionário/Contato salvo com sucesso!');
      }
      setShowForm(false);
      setEditingContact(null);
      loadContacts();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const requestDelete = (contact) => {
    setContactToDelete(contact);
  };

  const confirmDelete = async () => {
    if (!contactToDelete) return;
    const targetId = contactToDelete.id;
    const targetName = contactToDelete.name;

    try {
      setDeleting(true);
      // Atualização otimista imediata na interface
      const updatedList = contacts.filter(c => String(c.id) !== String(targetId) && Number(c.id) !== Number(targetId));
      setContacts(updatedList);
      if (onContactsUpdated) onContactsUpdated(updatedList);

      await api.deleteContact(targetId);
      toast.success(`Funcionário "${targetName}" excluído com sucesso.`);
      setContactToDelete(null);
      loadContacts();
    } catch (err) {
      toast.error('Erro ao excluir: ' + err.message);
      loadContacts(); // Reverte a lista caso a API retorne erro
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen) return null;

  const filteredContacts = contacts.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    (c.role && c.role.toLowerCase().includes(search.toLowerCase())) ||
    (c.department && c.department.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden transition-colors duration-200 relative">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl border border-blue-200 dark:border-blue-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Funcionários e Contatos da Escola</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Cadastre e gerencie a equipe escolar, e-mails e datas de aniversário</p>
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
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          
          {/* Top action bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome, cargo, e-mail..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-950 transition-colors"
              />
            </div>
            <button
              onClick={handleOpenCreate}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              Novo Funcionário / Contato
            </button>
          </div>

          {/* Form Inline */}
          {showForm && (
            <form onSubmit={handleSubmit} className="bg-slate-50 dark:bg-slate-950 border border-blue-500/30 rounded-2xl p-5 space-y-3.5 animate-slide-up shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  {editingContact ? '✏️ Editar Dados do Funcionário' : '➕ Adicionar Novo Funcionário'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Maria Santos"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">E-mail Institucional / Pessoal *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="maria.santos@escola.edu.br"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Cargo / Função</label>
                  <input
                    type="text"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="Ex: Professora de Matemática, Coordenador"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Setor / Departamento</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="Ex: Ensino Médio, Secretaria, Direção"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(98) 99999-9999"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-pink-600 dark:text-pink-400 mb-1 flex items-center gap-1">
                    <Cake className="w-3.5 h-3.5" /> Data de Aniversário
                  </label>
                  <input
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:border-pink-500 transition-colors"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  {editingContact ? 'Atualizar Dados' : 'Cadastrar Funcionário'}
                </button>
              </div>
            </form>
          )}

          {/* Contact List */}
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-2">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-sm">Carregando lista de funcionários...</p>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <Users className="w-10 h-10 mx-auto text-slate-400 dark:text-slate-600 mb-2" />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nenhum funcionário encontrado</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                {search ? 'Nenhum resultado corresponde à sua busca.' : 'Cadastre os membros da equipe escolar para selecionar facilmente em tarefas e agendar felicitações automáticas.'}
              </p>
              {!search && (
                <button
                  onClick={handleOpenCreate}
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
                >
                  Cadastrar Primeiro Funcionário
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredContacts.map(contact => (
                <div
                  key={contact.id}
                  className="group flex flex-col justify-between p-4 rounded-2xl bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {contact.name}
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                        <Mail className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 shrink-0" />
                        <span className="truncate">{contact.email}</span>
                      </div>

                      {contact.role && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                          <Briefcase className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400 shrink-0" />
                          <span className="truncate">{contact.role}{contact.department ? ` • ${contact.department}` : ''}</span>
                        </div>
                      )}

                      {contact.birth_date && (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-pink-600 dark:text-pink-400 pt-1">
                          <Cake className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                          <span>{contact.formattedDayMonth || contact.birth_date}</span>
                          {contact.isToday && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-pink-500 text-white uppercase animate-pulse">
                              Hoje! 🎉
                            </span>
                          )}
                        </div>
                      )}

                      {contact.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                          <Phone className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                          <span>{contact.phone}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(contact)}
                          title="Editar funcionário"
                          className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => requestDelete(contact)}
                          title="Excluir funcionário"
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Botão Parabenizar */}
                      {contact.birth_date && onOpenCelebration && (
                        <button
                          onClick={() => onOpenCelebration(contact)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-pink-50 hover:bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:hover:bg-pink-900/60 dark:text-pink-300 rounded-lg text-[11px] font-bold border border-pink-200 dark:border-pink-800 transition-all cursor-pointer"
                          title="Gerar texto de parabéns e enviar"
                        >
                          <Sparkles className="w-3 h-3 text-pink-500" />
                          Parabenizar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50/80 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
          <span>Total: <strong>{contacts.length}</strong> funcionários cadastrados</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 rounded-xl font-medium transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>

        {/* Modal de Confirmação de Exclusão (In-App Seguro) */}
        {contactToDelete && (
          <div className="absolute inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-scale-in">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-2xl">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Excluir Funcionário</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Confirmação de remoção do sistema</p>
                </div>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-300">
                Deseja realmente excluir <strong>{contactToDelete.name}</strong> ({contactToDelete.email})? Esta ação removerá o funcionário do catálogo de contatos e do calendário de aniversários.
              </p>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => setContactToDelete(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={confirmDelete}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-rose-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Excluindo...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      Sim, Excluir Funcionário
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
