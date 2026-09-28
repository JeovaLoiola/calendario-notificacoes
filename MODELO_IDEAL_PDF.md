# 📄 Modelo Ideal de Documento PDF para o Calendário

Este guia apresenta o **formato padrão e ideal** para elaborar arquivos PDF (cronogramas, listas de tarefas, editais ou planos de trabalho) garantindo que o sistema reconheça automaticamente **100% dos eventos, horários, categorias, prioridades e e-mails de notificação**.

---

## 📥 Arquivo de Exemplo Pronto para Download

Você pode baixar diretamente o arquivo PDF modelo pronto:
- **No Sistema:** Acesse o botão **"Importar PDF"** na barra superior e clique em **"Baixar Modelo PDF"**.
- **No Projeto:** O arquivo está localizado em [`modelo_ideal_cronograma.pdf`](file:///c:/Users/jeova/OneDrive/Documentos/calendario-notificacoes/modelo_ideal_cronograma.pdf).

---

## 🏆 Formatos Recomendados de Estrutura

### 📋 Opção 1: Formato em Lista de Tópicos (Mais simples e direto)

```text
CRONOGRAMA DE ATIVIDADES E COMPROMISSOS
Responsável Geral: coordenacao@empresa.com

1. Data: 05/09/2026 | Horário: 09:00 às 10:30 | Reunião de Alinhamento Semanal
   Descrição: Alinhamento das metas e entregas da sprint com a equipe técnica.
   Notificar: ana.silva@empresa.com, carlos.oliveira@empresa.com

2. Data: 10/09/2026 | Horário: 14:00 às 16:00 | Entrega do Protótipo do Sistema (Urgente)
   Descrição: Apresentação executiva para validação com stakeholders.
   Notificar: carlos.oliveira@empresa.com, diretoria@empresa.com

3. Data: 15/09/2026 | Horário: 10:00 às 12:00 | Workshop de Treinamento UI/UX
   Descrição: Capacitação interna sobre interfaces e acessibilidade.
   Notificar: juliana.costa@empresa.com

4. Data: 22/09/2026 | Horário: 15:30 às 17:00 | Auditoria de Qualidade e Segurança
   Descrição: Verificação de processos internos, políticas de segurança e logs.
   Notificar: auditoria@empresa.com, ana.silva@empresa.com

5. Data: 28/09/2026 | Horário: 08:30 às 11:30 | Planejamento Estratégico do Trimestre
   Descrição: Definição dos objetivos OKRs no Auditório Principal.
   Notificar: diretoria@empresa.com
```

---

### 📊 Opção 2: Formato em Tabela (Word, Google Docs, Excel)

| Data | Horário | Categoria | Atividade / Evento | E-mails de Notificação | Observações |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **05/09/2026** | 09:00 - 10:30 | Reunião | Reunião de Alinhamento Semanal | ana.silva@empresa.com | Revisão de sprint |
| **10/09/2026** | 14:00 - 16:00 | Projeto | Entrega do Protótipo (Urgente) | carlos@empresa.com | Validação com cliente |
| **15/09/2026** | 10:00 - 12:00 | Estudos | Workshop de Design UI/UX | juliana@empresa.com | Sala de treinamento |
| **22/09/2026** | 15:30 - 17:00 | Trabalho | Auditoria Interna | auditoria@empresa.com | Relatório final |
| **28/09/2026** | 08:30 - 11:30 | Trabalho | Planejamento Trimestral | diretoria@empresa.com | Auditório |

---

## 🎯 Regras e Dicas para Preenchimento Perfeito

1. **📅 Datas Suportadas**:
   - `DD/MM/AAAA` (ex: `05/09/2026`, `25/12/2026`)
   - `DD/MM` (ex: `05/09`, `12/out`)
   - Por extenso: `15 de Setembro de 2026`, `22 de Outubro`
   - Períodos: `08 a 10 de setembro de 2026`

2. **⏰ Horários**:
   - Faixa de início e fim: `09:00 às 10:30`, `09:00 - 10:30`, `14h às 16h`
   - Horário único: `14:00`, `14h30min`, `às 09:00`

3. **✉️ E-mails para Notificação**:
   - Qualquer e-mail no formato `nome@dominio.com` inserido na linha ou no bloco da tarefa é capturado automaticamente como destinatário.

4. **⚡ Prioridades e Categorias Automáticas**:
   - Adicione `(Urgente)` ou `(Alta Prioridade)` no título para destacar o evento em vermelho.
   - Categorias detectadas automaticamente: `Reunião`, `Projeto`, `Estudos`, `Pessoal`, `Trabalho`, `Urgente`.
