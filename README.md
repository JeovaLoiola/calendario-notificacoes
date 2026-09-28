# 📅 CALENDÁRIO

Aplicação web completa e moderna para gerenciamento de compromissos diários, calendário mensal/semanal/diário, importação automática de eventos a partir de arquivos PDF, catálogo de contatos e disparo de notificações automáticas e manuais por e-mail (via Nodemailer com suporte a Gmail, Outlook e SMTP personalizado).

---

## ✨ Funcionalidades

- **📄 Importação Automática de Eventos de PDF (Novo)**:
  - Envie qualquer documento PDF (cronogramas, editais, pautas de reunião, agendas).
  - O sistema extrai automaticamente datas (`DD/MM/AAAA`, `DD de Mês`, `AAAA-MM-DD`), horários (`14:00`, `09:00 às 11:30`), títulos, categorias, prioridades e e-mails.
  - **Tela de Pré-visualização Interativa**: Edite campos, desmarque eventos indesejados, atribua e-mails a todos os itens com 1 clique e confirme a criação em lote.

- **📅 Calendário Interativo**:
  - Visualizações por **Mês**, **Semana** e **Dia**.
  - Destaque do dia atual, navegação intuitiva entre datas e botão "Hoje".
  - Chips de tarefas coloridos com horário, prioridade e status de conclusão.
  - Seleção de dia com listagem e criação rápida.

- **✅ Gerenciamento de Tarefas**:
  - Criação, edição, exclusão e conclusão de tarefas.
  - Campos: Título, Descrição, Data, Horário (Início/Fim), Prioridade (*Baixa, Média, Alta, Urgente*), Categoria/Tag (*Trabalho, Reunião, Projeto, Pessoal, etc.*) e Cor personalizada.
  - Filtros avançados por busca em tempo real, status e prioridade.

- **👥 Catálogo de Contatos Salvos**:
  - Salve nomes, e-mails, telefones e cargos para seleção rápida com 1 clique ao criar tarefas.
  - Busca rápida e gerenciamento completo (CRUD).

- **✉️ Motor de Notificações por E-mail**:
  - **Disparo Manual Instantâneo**: Notifique os contatos de qualquer tarefa a qualquer momento com mensagens personalizadas.
  - **Envio Automático Agendado**: O backend verifica periodicamente as tarefas agendadas para o dia e dispara o aviso antes do horário definido.
  - **Template HTML Elegante**: E-mails formatados com design moderno, cores da prioridade, data/hora e detalhes da atividade.
  - **Modo Simulação & Teste Seguro**: Permite testar todo o fluxo de notificações mesmo sem configurar um servidor SMTP real.
  - **Histórico / Log de Envios**: Acompanhe o status (Enviado, Simulado, Falha), data/hora e destinatários de cada disparo.

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
- **Node.js** (versão 18 ou superior)
- **npm**

### Passo 1: Iniciar o Sistema (Backend + Frontend)
```bash
# Iniciar backend e frontend simultaneamente:
npm run dev
```

Abra seu navegador em [http://localhost:3001](http://localhost:3001) ou [http://localhost:5173](http://localhost:5173).

---

## 📄 Como Usar a Importação de PDF

1. No cabeçalho superior da aplicação, clique no botão **"Importar PDF"**.
2. Arraste ou selecione o arquivo PDF desejado.
3. O sistema fará a leitura e abrirá a tela de **Pré-visualização**, exibindo todos os eventos encontrados com suas respectivas datas e horários.
4. Revise os eventos, faça ajustes se necessário ou adicione contatos para receberem e-mails.
5. Clique em **"Criar X Tarefas no Calendário"**. Todos os eventos aparecerão imediatamente na sua grade de calendário!
