import React, { useState, useEffect } from 'react';
import { X, Settings, Mail, Lock, Server, Shield, Send, CheckCircle2, HelpCircle, Eye, EyeOff, BellRing, RefreshCw, Check, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../UI/Toast';

export default function SettingsModal({ isOpen, onClose }) {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [runningCheck, setRunningCheck] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [activeTab, setActiveTab] = useState('smtp'); // 'smtp' | 'automation' | 'help'

  const [formData, setFormData] = useState({
    service: 'custom',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    user: '',
    pass: '',
    from_name: 'CALENDÁRIO OLINDINA',
    from_email: '',
    enable_simulation: true
  });

  const loadConfig = async () => {
    try {
      setLoading(true);
      const data = await api.getSmtpConfig();
      setFormData(prev => ({
        ...prev,
        ...data
      }));
    } catch (err) {
      toast.error('Erro ao carregar configurações: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadConfig();
    }
  }, [isOpen]);

  const handlePresetChange = (serviceName) => {
    if (serviceName === 'gmail') {
      setFormData(prev => ({
        ...prev,
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 465,
        secure: true
      }));
    } else if (serviceName === 'outlook' || serviceName === 'hotmail') {
      setFormData(prev => ({
        ...prev,
        service: 'outlook',
        host: 'smtp.office365.com',
        port: 587,
        secure: false
      }));
    } else if (serviceName === 'brevo') {
      setFormData(prev => ({
        ...prev,
        service: 'brevo',
        host: 'smtp-relay.brevo.com',
        port: 587,
        secure: false
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        service: 'custom',
        host: prev.host || '',
        port: prev.port || 587,
        secure: prev.secure || false
      }));
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      const res = await api.saveSmtpConfig(formData);
      toast.success('Configurações de e-mail salvas com sucesso!');
      setFormData(prev => ({
        ...prev,
        ...res.config
      }));
    } catch (err) {
      toast.error('Erro ao salvar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSendTest = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      toast.warning('Informe um endereço de e-mail válido para o teste.');
      return;
    }

    try {
      setTesting(true);
      const res = await api.testSmtp({
        to_email: testEmail,
        test_config: formData
      });

      if (res.result?.mode === 'simulated') {
        toast.info('✅ Teste simulado registrado com sucesso no histórico!');
      } else {
        toast.success(`✅ E-mail de teste enviado para ${testEmail}! Verifique sua caixa de entrada.`);
      }
    } catch (err) {
      toast.error('Falha no teste: ' + err.message);
    } finally {
      setTesting(false);
    }
  };

  const handleRunNotificationCheck = async () => {
    try {
      setRunningCheck(true);
      const res = await api.runNotificationCheck();
      const count = res.report?.notificationsDispatched || 0;
      const checked = res.report?.totalActiveTasksChecked || 0;

      if (count > 0) {
        toast.success(`🎉 ${count} notificação(ões) automática(s) disparada(s) com sucesso!`);
      } else {
        toast.info(`ℹ️ Verificação concluída: ${checked} tarefa(s) avaliada(s). Nenhuma notificação pendente no momento.`);
      }
    } catch (err) {
      toast.error('Erro ao executar verificação: ' + err.message);
    } finally {
      setRunningCheck(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden transition-colors duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl border border-purple-200 dark:border-purple-500/20">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Configurações do Sistema</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Servidor SMTP, disparos de e-mail e automação de lembretes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-slate-50/60 dark:bg-slate-950/40">
          <button
            onClick={() => setActiveTab('smtp')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'smtp'
                ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400 font-bold'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Servidor SMTP & Credenciais
          </button>
          <button
            onClick={() => setActiveTab('automation')}
            className={`flex items-center gap-1.5 py-3 px-4 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'automation'
                ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400 font-bold'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <BellRing className="w-3.5 h-3.5" />
            Frequência de Notificações (4 Etapas)
          </button>
          <button
            onClick={() => setActiveTab('help')}
            className={`flex items-center gap-1.5 py-3 px-4 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'help'
                ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400 font-bold'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Ajuda
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-5">
          {loading ? (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400">Carregando configurações...</div>
          ) : activeTab === 'automation' ? (
            <div className="space-y-4 text-slate-800 dark:text-slate-200">
              {/* Card Status do Agendador */}
              <div className="p-4 rounded-xl bg-blue-50/80 dark:bg-gradient-to-r dark:from-blue-900/30 dark:via-indigo-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-500/30 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Agendador Automático Ativo
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    O sistema executa verificações contínuas a cada minuto e dispara as mensagens no momento exato.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleRunNotificationCheck}
                  disabled={runningCheck}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 transition-all shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${runningCheck ? 'animate-spin' : ''}`} />
                  {runningCheck ? 'Verificando...' : 'Verificar e Disparar Agora'}
                </button>
              </div>

              {/* Linha do Tempo das 4 Frequências */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Ciclo de Notificações Configurado (4 Etapas):
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Etapa 1 */}
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-blue-200 dark:border-blue-500/30 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        1. Uma Semana Antes
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 text-[10px] font-bold">
                        7 dias antes
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      Enviado exatamente 7 dias antes da data do compromisso para que os destinatários possam se planejar.
                    </p>
                  </div>

                  {/* Etapa 2 */}
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-purple-200 dark:border-purple-500/30 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-700 dark:text-purple-400 flex items-center gap-1.5">
                        <BellRing className="w-3.5 h-3.5" />
                        2. Cinco Dias Antes
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20 text-[10px] font-bold">
                        5 dias antes
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      Lembrete intermediário enviado a 5 dias da data para reforço e confirmações.
                    </p>
                  </div>

                  {/* Etapa 3 */}
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-amber-200 dark:border-amber-500/30 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        3. Três Dias Antes
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 text-[10px] font-bold">
                        3 dias antes
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      Aviso de proximidade enviado a 3 dias do evento para checagem final de materiais e pautas.
                    </p>
                  </div>

                  {/* Etapa 4 */}
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-rose-200 dark:border-rose-500/30 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        4. No Dia do Evento
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 text-[10px] font-bold">
                        Hoje (D-0)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      Alerta no dia do evento, considerando o horário de início estipulado para a atividade.
                    </p>
                  </div>
                </div>
              </div>

              {/* Informação sobre Destinatários */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                💡 <strong className="text-slate-800 dark:text-slate-300">Como funciona:</strong> Qualquer tarefa ou compromisso cadastrado no calendário que possua destinatários de e-mail associados participará automaticamente desse ciclo sem necessidade de intervenção manual.
              </div>
            </div>
          ) : activeTab === 'help' ? (
            <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300">
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                <h4 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  Como usar com o Gmail:
                </h4>
                <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  <li>Acesse sua Conta Google &gt; <strong>Segurança</strong>.</li>
                  <li>Ative a <strong>Verificação em 2 etapas</strong> caso ainda não esteja ativa.</li>
                  <li>Pesquise por <strong>"Senhas de app"</strong> na sua conta Google.</li>
                  <li>Crie uma nova senha com o nome "Calendário" e copie a chave de 16 letras gerada.</li>
                  <li>Cole a chave no campo <strong>Senha / Token SMTP</strong> abaixo e coloque seu e-mail no campo Usuário.</li>
                </ol>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                <h4 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Modo de Demonstração / Simulação:
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Se você deseja testar o sistema agora sem cadastrar credenciais de e-mail reais, mantenha a opção 
                  <strong> "Permitir Modo Simulação"</strong> ativada. O sistema registrará os envios no histórico de logs com o template HTML completo.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              {/* Simulation Mode Toggle Card */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-500/20 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    Modo Simulação & Teste Seguro
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    Permite testar disparos mesmo sem dados de SMTP preenchidos.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.enable_simulation}
                    onChange={(e) => setFormData({ ...formData, enable_simulation: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Provider presets */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Provedor de E-mail
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'brevo', label: 'Brevo (Sendinblue)' },
                    { id: 'gmail', label: 'Google Gmail' },
                    { id: 'outlook', label: 'Outlook / Office' },
                    { id: 'custom', label: 'Personalizado' }
                  ].map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handlePresetChange(p.id)}
                      className={`p-2.5 rounded-xl border text-xs font-medium transition-all ${
                        formData.service === p.id
                          ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-600/10 dark:text-blue-400 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400 dark:hover:border-slate-700'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Host & Port */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Host SMTP</label>
                  <div className="relative">
                    <Server className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={formData.host}
                      onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                      placeholder="smtp.gmail.com"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-950 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Porta</label>
                  <input
                    type="number"
                    value={formData.port}
                    onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                    placeholder="587"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-950 transition-colors"
                  />
                </div>
              </div>

              {/* User & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Usuário / E-mail de Envio</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={formData.user}
                      onChange={(e) => setFormData({ ...formData, user: e.target.value, from_email: formData.from_email || e.target.value })}
                      placeholder="seu.email@gmail.com"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-950 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Senha / Senha de App</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.pass}
                      onChange={(e) => setFormData({ ...formData, pass: e.target.value })}
                      placeholder="Senha do app ou servidor"
                      className="w-full pl-9 pr-10 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-950 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Sender Name & Sender Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Nome do Remetente</label>
                  <input
                    type="text"
                    value={formData.from_name}
                    onChange={(e) => setFormData({ ...formData, from_name: e.target.value })}
                    placeholder="Ex: CALENDÁRIO OLINDINA"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-950 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">E-mail de Resposta / From</label>
                  <input
                    type="email"
                    value={formData.from_email}
                    onChange={(e) => setFormData({ ...formData, from_email: e.target.value })}
                    placeholder="notificacoes@suaempresa.com"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-950 transition-colors"
                  />
                </div>
              </div>

              {/* Test Connection Section */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Testar Envio de E-mail</label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="Digite seu e-mail para receber um teste"
                    className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-950 transition-colors"
                  />
                  <button
                    type="button"
                    disabled={testing}
                    onClick={handleSendTest}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white disabled:opacity-50 rounded-xl text-xs font-semibold transition-all shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {testing ? 'Testando...' : 'Enviar Teste'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-xl text-sm font-medium transition-colors"
          >
            Fechar
          </button>
          {activeTab === 'smtp' && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              {saving ? 'Salvando...' : 'Salvar Configurações'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
