import React, { useState, useEffect } from 'react';
import { X, Bell, Trash2, Mail, ExternalLink, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../UI/Toast';

export default function NotificationHistoryModal({ isOpen, onClose }) {
  const toast = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await api.getNotificationLogs(50);
      setLogs(data);
    } catch (err) {
      toast.error('Erro ao carregar histórico: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadLogs();
    }
  }, [isOpen]);

  const handleClearLogs = async () => {
    if (!confirm('Deseja realmente limpar todo o histórico de notificações?')) return;
    try {
      await api.clearNotificationLogs();
      toast.success('Histórico limpo com sucesso.');
      loadLogs();
    } catch (err) {
      toast.error('Erro ao limpar histórico: ' + err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden transition-colors duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-200 dark:border-amber-500/20">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Histórico de Notificações</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Registro de todos os e-mails disparados pelo sistema</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadLogs}
              title="Atualizar"
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-3">
          {loading ? (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-sm">Carregando logs de notificação...</div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              <Mail className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Nenhum histórico registrado</p>
              <p className="text-xs text-slate-400 dark:text-slate-600 mt-1">Ao enviar lembretes ou notificações de tarefas, os registros aparecerão aqui.</p>
            </div>
          ) : (
            logs.map(log => {
              const statusBadges = {
                sent: {
                  label: 'Enviado',
                  color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                },
                simulated: {
                  label: 'Simulado',
                  color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20'
                },
                failed: {
                  label: 'Falhou',
                  color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'
                }
              };

              const stageBadges = {
                '7_days': {
                  label: '1 Semana Antes (7d)',
                  color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30'
                },
                '5_days': {
                  label: '5 Dias Antes',
                  color: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30'
                },
                '3_days': {
                  label: '3 Dias Antes',
                  color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30'
                },
                'day_of_event': {
                  label: 'No Dia do Evento',
                  color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30'
                },
                'immediate': {
                  label: 'Agendamento Inicial',
                  color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30'
                },
                'manual': {
                  label: 'Disparo Manual',
                  color: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                }
              };

              const badge = statusBadges[log.status] || statusBadges.sent;
              const stageBadge = log.stage ? (stageBadges[log.stage] || { label: log.stage, color: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' }) : null;

              return (
                <div
                  key={log.id}
                  className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 space-y-2 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${badge.color}`}>
                          {badge.label}
                        </span>
                        {stageBadge && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${stageBadge.color}`}>
                            {stageBadge.label}
                          </span>
                        )}
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date(log.sent_at).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <h4 className="font-semibold text-sm text-slate-900 dark:text-white mt-1.5">{log.subject}</h4>
                    </div>

                    {log.preview_url && (
                      <a
                        href={log.preview_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-500/20 shrink-0"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Ver Ethereal
                      </a>
                    )}
                  </div>

                  <div className="text-xs text-slate-700 dark:text-slate-300">
                    <span className="text-slate-500 dark:text-slate-400">Destinatários:</span> <strong>{log.recipients}</strong>
                  </div>

                  {log.message && (
                    <div className="text-xs text-slate-700 dark:text-slate-400 bg-white dark:bg-slate-900 p-2.5 rounded-lg font-mono break-words border border-slate-200 dark:border-slate-800/50">
                      {log.message}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50/80 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
          <span>Total: <strong>{logs.length}</strong> registros</span>
          <div className="flex items-center gap-2">
            {logs.length > 0 && (
              <button
                onClick={handleClearLogs}
                className="flex items-center gap-1.5 px-3 py-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Limpar Logs
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 rounded-xl font-medium transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
