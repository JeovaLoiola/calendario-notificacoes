import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Send,
  Copy,
  Check,
  RefreshCw,
  Gift,
  Cake,
  Mail,
  Share2,
  Calendar,
  Heart,
  Edit3,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../UI/Toast';

export default function BirthdayCelebrationModal({
  isOpen,
  onClose,
  contact,
  onWishesSent
}) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);

  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [variations, setVariations] = useState([]);
  const [activeVariationId, setActiveVariationId] = useState(null);
  const [additionalEmails, setAdditionalEmails] = useState('');
  const [customSeed, setCustomSeed] = useState(0);

  // Inicializar quando o modal abrir com um contato
  useEffect(() => {
    if (isOpen && contact) {
      setCopied(false);
      setSubject(`🎂🎉 Feliz Aniversário, ${contact.name}! - Homenagem Especial`);
      loadMessage();
    }
  }, [isOpen, contact]);

  const loadMessage = async (seedOverride = null) => {
    if (!contact) return;
    try {
      setGenerating(true);
      const seedToUse = seedOverride !== null ? seedOverride : Math.floor(Math.random() * 10000);
      const data = await api.generateBirthdayMessage({
        contactId: contact.id,
        name: contact.name,
        role: contact.role,
        department: contact.department,
        seed: seedToUse,
        count: 4
      });

      setMessage(data.message || '');
      setVariations(data.variations || []);
      setActiveVariationId(1);
    } catch (err) {
      toast.error('Erro ao gerar mensagem: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleRegenerate = () => {
    const newSeed = customSeed + 13 + Math.floor(Math.random() * 50);
    setCustomSeed(newSeed);
    loadMessage(newSeed);
    toast.info('Nova variação de mensagem gerada! ✨');
  };

  const handleSelectVariation = (varObj) => {
    setMessage(varObj.text);
    setActiveVariationId(varObj.id);
  };

  const handleCopyForWhatsApp = () => {
    if (!message) return;
    const formattedText = `🎂 *FELIZ ANIVERSÁRIO, ${contact.name.toUpperCase()}!* 🎉\n\n${message}\n\n🎈 _Com muito carinho de toda a nossa equipe escolar!_ ✨`;
    navigator.clipboard.writeText(formattedText);
    setCopied(true);
    toast.success('Mensagem formatada copiada para a área de transferência! Pronta para WhatsApp.');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSendEmail = async () => {
    if (!contact?.email) {
      toast.warning('Este aniversariante não possui um e-mail cadastrado.');
      return;
    }

    if (!message.trim()) {
      toast.warning('A mensagem de parabéns não pode estar vazia.');
      return;
    }

    try {
      setSending(true);
      const additional = additionalEmails
        .split(',')
        .map(e => e.trim())
        .filter(e => e && e.includes('@'));

      const res = await api.sendBirthdayWishes(contact.id, {
        customMessage: message,
        customSubject: subject,
        additionalRecipients: additional
      });

      toast.success('🎉 E-mail festivo de aniversário enviado com sucesso!');
      if (onWishesSent) onWishesSent(res);
      onClose();
    } catch (err) {
      toast.error('Erro ao enviar e-mail: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  if (!isOpen || !contact) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 dark:bg-black/80 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-pink-200 dark:border-pink-900/40 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up">
        
        {/* Cabeçalho Festivo */}
        <div className="relative overflow-hidden px-6 py-5 bg-gradient-to-r from-pink-500 via-purple-600 to-amber-500 text-white flex items-center justify-between shadow-md">
          {/* Efeitos de Fundo */}
          <div className="absolute -top-10 -right-10 w-36 h-36 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-white/10 rounded-full blur-xl pointer-events-none" />
          
          <div className="relative z-10 flex items-center gap-3">
            <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 text-white shadow-inner flex items-center justify-center">
              <Cake className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/20 backdrop-blur-md border border-white/30 text-white">
                  Homenagem Especial 🎂
                </span>
                {contact.isToday && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-300 text-amber-950 animate-pulse">
                    HOJE! 🎉
                  </span>
                )}
              </div>
              <h2 className="text-xl font-extrabold text-white tracking-tight mt-0.5">
                {contact.name}
              </h2>
              <p className="text-xs text-white/90 font-medium">
                {contact.role || 'Funcionário(a) da Escola'} {contact.formattedDayMonth ? `• Aniversário em ${contact.formattedDayMonth}` : ''}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="relative z-10 p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-6 flex-1 overflow-y-auto space-y-5 bg-slate-50/50 dark:bg-slate-950/40">
          
          {/* Barra de Ações Rápidas de Geração */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span>Mensagem gerada com personalização para o cargo</span>
            </div>

            <button
              onClick={handleRegenerate}
              disabled={generating}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
              Gerar Outra Mensagem
            </button>
          </div>

          {/* Variações Prontas para Escolher */}
          {variations.length > 0 && (
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Escolha um estilo ou variação:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {variations.map((v, idx) => (
                  <button
                    key={v.id}
                    onClick={() => handleSelectVariation(v)}
                    className={`px-3 py-2 text-xs font-semibold rounded-xl border text-center transition-all truncate ${
                      activeVariationId === v.id
                        ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-400 dark:border-purple-500 text-purple-700 dark:text-purple-300 shadow-xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    Opção #{idx + 1}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Editor da Mensagem de Aniversário */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-pink-500" />
                Texto da Mensagem (Você pode editar livremente):
              </label>
              <span className="text-[11px] text-slate-400">
                {message.length} caracteres
              </span>
            </div>

            <textarea
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite ou personalize a mensagem de parabéns..."
              className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all font-sans leading-relaxed resize-y shadow-inner"
            />
          </div>

          {/* Detalhes de Envio do E-mail */}
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 shadow-xs">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-500" />
              Opções de Envio por E-mail
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Destinatário Principal (Aniversariante)
                </label>
                <div className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                  {contact.email || <span className="text-rose-500">Sem e-mail cadastrado</span>}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Assunto do E-mail
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                E-mails adicionais em cópia (opcional, separados por vírgula):
              </label>
              <input
                type="text"
                value={additionalEmails}
                onChange={(e) => setAdditionalEmails(e.target.value)}
                placeholder="coordenacao@escola.com, direcao@escola.com"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

        </div>

        {/* Rodapé com Botões de Ação */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          
          <button
            onClick={handleCopyForWhatsApp}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 dark:text-emerald-300 dark:border-emerald-800'
            }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copiado para WhatsApp!' : 'Copiar p/ WhatsApp'}
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>

            <button
              onClick={handleSendEmail}
              disabled={sending || !contact?.email}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-pink-500/25 transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {sending ? 'Enviando E-mail...' : 'Enviar E-mail Festivo'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
