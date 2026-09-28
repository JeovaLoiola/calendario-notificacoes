import React, { useState, useRef } from 'react';
import {
  X,
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
  Tag,
  Mail,
  Trash2,
  Check,
  Send,
  Loader2,
  FileUp,
  User,
  Plus,
  Download,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../UI/Toast';

const CATEGORIES = ['Trabalho', 'Reunião', 'Projeto', 'Pessoal', 'Estudos', 'Urgente', 'Geral'];
const PRIORITIES = [
  { id: 'baixa', label: 'Baixa' },
  { id: 'media', label: 'Média' },
  { id: 'alta', label: 'Alta' },
  { id: 'urgente', label: 'Urgente' }
];

export default function PdfImportModal({ isOpen, onClose, contacts = [], onImportComplete }) {
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [step, setStep] = useState('upload'); // 'upload' | 'preview'
  const [file, setFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [showModelGuide, setShowModelGuide] = useState(false);

  const [pdfMeta, setPdfMeta] = useState(null);
  const [events, setEvents] = useState([]);
  const [sendImmediateNotification, setSendImmediateNotification] = useState(false);
  const [globalRecipientEmail, setGlobalRecipientEmail] = useState('');

  if (!isOpen) return null;

  const handleFileChange = async (selectedFile) => {
    if (!selectedFile) return;
    if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
      toast.warning('Por favor, selecione um arquivo no formato PDF.');
      return;
    }

    setFile(selectedFile);
    await processPdf(selectedFile);
  };

  const processPdf = async (fileToProcess) => {
    try {
      setParsing(true);
      const formData = new FormData();
      formData.append('pdfFile', fileToProcess);

      const res = await api.importPdfPreview(formData);
      setPdfMeta({
        filename: res.filename,
        filesize: (res.filesize / 1024).toFixed(1) + ' KB',
        pages: res.pages,
        totalEvents: res.totalEvents
      });

      setEvents(res.events || []);
      setStep('preview');
      toast.success(`${res.events?.length || 0} evento(s) detectado(s) no PDF!`);
    } catch (err) {
      toast.error('Erro ao ler PDF: ' + err.message);
      setStep('upload');
      setFile(null);
    } finally {
      setParsing(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleToggleSelectAll = (checked) => {
    setEvents(prev => prev.map(evt => ({ ...evt, selected: checked })));
  };

  const handleToggleSelectEvent = (id) => {
    setEvents(prev => prev.map(evt => evt.id === id ? { ...evt, selected: !evt.selected } : evt));
  };

  const handleUpdateEventField = (id, field, value) => {
    setEvents(prev => prev.map(evt => evt.id === id ? { ...evt, [field]: value } : evt));
  };

  const handleRemoveEvent = (id) => {
    setEvents(prev => prev.filter(evt => evt.id !== id));
  };

  const handleApplyGlobalRecipient = () => {
    const email = globalRecipientEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      toast.warning('Digite um e-mail válido para associar.');
      return;
    }

    setEvents(prev => prev.map(evt => {
      const current = evt.notify_emails || [];
      if (!current.includes(email)) {
        return { ...evt, notify_emails: [...current, email] };
      }
      return evt;
    }));

    toast.info(`E-mail ${email} associado aos eventos.`);
    setGlobalRecipientEmail('');
  };

  const handleConfirmImport = async () => {
    const selectedEvents = events.filter(e => e.selected);
    if (selectedEvents.length === 0) {
      toast.warning('Selecione ao menos um evento para importar.');
      return;
    }

    try {
      setImporting(true);
      const res = await api.createTasksBatch(selectedEvents, sendImmediateNotification);
      toast.success(`🎉 ${res.count} tarefa(s) criada(s) com sucesso no calendário!`);
      if (res.notificationsSent > 0) {
        toast.info(`✉️ ${res.notificationsSent} e-mail(s) de notificação disparado(s).`);
      }

      if (onImportComplete) onImportComplete();
      onClose();
    } catch (err) {
      toast.error('Erro ao importar tarefas: ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  const selectedCount = events.filter(e => e.selected).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden transition-colors duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-200 dark:border-indigo-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Importar Eventos do Arquivo PDF</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                O sistema lê cronogramas e listas no PDF e agenda tudo automaticamente no calendário
              </p>
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
        <div className="p-6 flex-1 overflow-y-auto">
          {step === 'upload' ? (
            <div className="space-y-5">
              {/* Banner de Modelo Recomendado para Download */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-500/30 gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded-lg shrink-0">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Modelo Ideal de Cronograma (PDF)</h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300">
                      Baixe o arquivo de modelo oficial pronto para preencher no Word, Canva ou Google Docs.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setShowModelGuide(!showModelGuide)}
                    className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    {showModelGuide ? 'Ocultar Guia' : 'Ver Estrutura'}
                    {showModelGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  <a
                    href="/api/tasks/template-pdf"
                    download="modelo_ideal_cronograma.pdf"
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Baixar Modelo PDF
                  </a>
                </div>
              </div>

              {/* Guia de Estrutura Expansível */}
              {showModelGuide && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 animate-fade-in text-xs">
                  <div className="font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                    <FileText className="w-4 h-4" />
                    Estrutura Ideal para seus Documentos PDF:
                  </div>

                  <div className="bg-white dark:bg-slate-900/80 p-3 rounded-lg border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-700 dark:text-slate-300 space-y-1">
                    <p className="text-indigo-600 dark:text-indigo-400 font-bold">// Exemplo de linha ideal:</p>
                    <p><strong>1. Data:</strong> 05/09/2026 | <strong>Horário:</strong> 09:00 às 10:30 | <strong>Reunião de Alinhamento Semanal</strong></p>
                    <p className="text-slate-500 dark:text-slate-400 pl-4">Descrição: Alinhamento de metas da sprint.</p>
                    <p className="text-slate-500 dark:text-slate-400 pl-4">Notificar: gestao@empresa.com, colaborador@empresa.com</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400 pt-1">
                    <div className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>Datas:</strong> Use <code>DD/MM/AAAA</code> (ex: 15/09/2026) ou textual (ex: 20 de Outubro).</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>Horários:</strong> Use <code>09:00 às 11:30</code>, <code>14h</code> ou <code>10:00</code>.</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>E-mails:</strong> Basta citar os e-mails na linha para vinculá-los às notificações.</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>Urgência:</strong> Adicione <code>(Urgente)</code> no título para definir prioridade máxima.</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Dropzone */}
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500/70 bg-slate-50/60 dark:bg-slate-950/60 hover:bg-indigo-50/30 dark:hover:bg-slate-950 rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                />

                <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
                  <UploadCloud className="w-10 h-10" />
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {parsing ? 'Processando e analisando o PDF...' : 'Clique para selecionar ou arraste o arquivo PDF'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md">
                    Suporta cronogramas, editais, relatórios, planos de aula e pautas de compromissos.
                  </p>
                </div>

                {parsing && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Extraindo datas, horários e compromissos...
                  </div>
                )}
              </div>

              {/* Recursos automáticos */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80">
                  <div className="text-xs font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                    Detecção de Datas
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    Identifica datas em formatos como <code>DD/MM/AAAA</code>, <code>15 de Setembro</code> e <code>AAAA-MM-DD</code>.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80">
                  <div className="text-xs font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                    Horários Automáticos
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    Reconhece horários como <code>14:00</code>, <code>09:00 às 11:30</code> ou <code>15h30</code>.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80">
                  <div className="text-xs font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                    Vínculo de E-mails
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    Detecta e-mails mencionados no documento para disparar avisos e lembretes.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Passo 2: Pré-visualização e Edição */
            <div className="space-y-4">
              {/* Meta bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 gap-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">{pdfMeta?.filename}</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">({pdfMeta?.filesize}, {pdfMeta?.pages} página(s))</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setStep('upload');
                    setFile(null);
                  }}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
                >
                  Substituir PDF
                </button>
              </div>

              {/* Barra de Ações Rápidas */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-50/80 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800/80">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCount === events.length && events.length > 0}
                    onChange={(e) => handleToggleSelectAll(e.target.checked)}
                    className="rounded bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500"
                  />
                  Selecionar Todos ({selectedCount}/{events.length})
                </label>

                {/* Associar Contato a Todos */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    type="email"
                    value={globalRecipientEmail}
                    onChange={(e) => setGlobalRecipientEmail(e.target.value)}
                    placeholder="Adicionar e-mail para todos..."
                    className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleApplyGlobalRecipient}
                    className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Aplicar
                  </button>
                </div>
              </div>

              {/* Lista de Eventos Detectados */}
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {events.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-sm">
                    Nenhum evento detectado no documento.
                  </div>
                ) : (
                  events.map((evt) => (
                    <div
                      key={evt.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        evt.selected
                          ? 'bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 shadow-sm'
                          : 'bg-slate-50/50 dark:bg-slate-950/40 border-slate-200/60 dark:border-slate-800/50 opacity-60'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={Boolean(evt.selected)}
                          onChange={() => handleToggleSelectEvent(evt.id)}
                          className="mt-1.5 rounded bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500"
                        />

                        <div className="flex-1 space-y-2.5">
                          {/* Linha 1: Título e Ação de Excluir */}
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={evt.title}
                              onChange={(e) => handleUpdateEventField(evt.id, 'title', e.target.value)}
                              placeholder="Título do evento"
                              className="flex-1 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveEvent(evt.id)}
                              title="Remover evento"
                              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Linha 2: Data, Horários, Prioridade e Categoria */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <div>
                              <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">Data</label>
                              <input
                                type="date"
                                value={evt.date}
                                onChange={(e) => handleUpdateEventField(evt.id, 'date', e.target.value)}
                                className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">Início</label>
                              <input
                                type="time"
                                value={evt.start_time || ''}
                                onChange={(e) => handleUpdateEventField(evt.id, 'start_time', e.target.value)}
                                className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">Prioridade</label>
                              <select
                                value={evt.priority}
                                onChange={(e) => handleUpdateEventField(evt.id, 'priority', e.target.value)}
                                className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                              >
                                {PRIORITIES.map(p => (
                                  <option key={p.id} value={p.id}>{p.label}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">Categoria</label>
                              <select
                                value={evt.category}
                                onChange={(e) => handleUpdateEventField(evt.id, 'category', e.target.value)}
                                className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                              >
                                {CATEGORIES.map(c => (
                                  <option key={c} value={c}>{c}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Linha 3: E-mails do evento */}
                          {evt.notify_emails && evt.notify_emails.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <Mail className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                                Notificar:
                              </span>
                              {evt.notify_emails.map((email, emailIdx) => (
                                <span
                                  key={emailIdx}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 text-[10px]"
                                >
                                  {email}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = evt.notify_emails.filter((_, i) => i !== emailIdx);
                                      handleUpdateEventField(evt.id, 'notify_emails', updated);
                                    }}
                                    className="hover:text-rose-500 dark:hover:text-rose-400"
                                  >
                                    <X className="w-2.5 h-2.5" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Checkbox Notificação Imediata */}
              {events.some(e => e.notify_emails && e.notify_emails.length > 0) && (
                <label className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendImmediateNotification}
                    onChange={(e) => setSendImmediateNotification(e.target.checked)}
                    className="rounded bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                    Enviar notificação por e-mail imediatamente para os contatos listados nas tarefas
                  </span>
                </label>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
          {step === 'preview' ? (
            <>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                <strong>{selectedCount}</strong> de <strong>{events.length}</strong> evento(s) selecionado(s)
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('upload')}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={importing || selectedCount === 0}
                  className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition-all"
                >
                  {importing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Criar {selectedCount} Tarefas no Calendário
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="flex justify-end w-full">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors"
              >
                Fechar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
