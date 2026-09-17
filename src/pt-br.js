// Portuguese presentation layer. The app's task states, API fields and commands stay stable.
// ?lang=en keeps the original English interface (also used by the legacy smoke tests).
export const ptBR = typeof location !== 'undefined' && !/^en(?:-|$)/i.test(new URLSearchParams(location.search).get('lang') || 'pt-BR');

const words = {
  'Agents Office v3 (Beta)': 'Agent District',
  'Agents Office': 'Agent District', "Today's board": 'Quadro de hoje',
  'AGENTS OFFICE': 'AGENT DISTRICT',
  'Collapse task panel': 'Recolher painel de tarefas', 'Open task panel': 'Abrir painel de tarefas',
  'CALENDAR': 'CALENDÁRIO', 'WEEK': 'SEMANA', 'MONTH': 'MÊS', 'TODAY': 'HOJE',
  'CHAT': 'CONVERSA', 'ACTIVITY': 'ATIVIDADE', 'SEND': 'ENVIAR', 'ADD': 'ADICIONAR',
  'OVERVIEW': 'VISÃO GERAL', 'ROUTINES': 'ROTINAS', 'ROUTINE': 'ROTINA',
  'REPEAT': 'REPETIR', 'TEAM': 'EQUIPE', 'PIECE': 'PARTE',
  'TASK STATUS': 'STATUS DAS TAREFAS', 'TASK FOR': 'TAREFA PARA', 'WHOLE OFFICE': 'TODO O ESCRITÓRIO',
  'ALL': 'TODAS', 'SCHEDULED': 'AGENDADAS', 'BACKLOG': 'PENDENTES', 'IN PROGRESS': 'EM ANDAMENTO',
  'DOING': 'FAZENDO', 'NEXT': 'PRÓXIMAS', 'DONE': 'CONCLUÍDAS', 'WAITING': 'AGUARDANDO',
  'WAITING APPROVAL': 'AGUARDANDO APROVAÇÃO', 'WAITING ON APPROVAL': 'AGUARDANDO APROVAÇÃO', 'APPROVE': 'APROVAR', 'REJECT': 'REJEITAR',
  'Approved': 'Aprovado', 'Rejected': 'Rejeitado', 'PAUSED': 'PAUSADA', 'PAUSE': 'PAUSAR',
  'RESUME': 'RETOMAR', 'RUN NOW': 'EXECUTAR AGORA', 'DELETE': 'EXCLUIR',
  'CANCEL IT': 'CANCELAR', 'OPEN THE AGENT': 'ABRIR AGENTE', 'ONLY THIS': 'SÓ ESTA',
  'CANCEL': 'CANCELAR',
  'ONLY THIS ROUTINE': 'SÓ ESTA ROTINA', 'SCHEDULE FOR': 'AGENDAR PARA',
  'SCHEDULED TASK': 'TAREFA AGENDADA', 'NOTES': 'NOTAS', 'LINKS': 'LINKS',
  'KNOWLEDGE': 'CONHECIMENTO', 'AGENTS': 'AGENTES', 'THE BRAIN': 'O CÉREBRO',
  'EMAILS': 'E-MAILS', 'DELIVERY': 'ENTREGAS', 'SALES': 'VENDAS', 'MARKETING': 'MARKETING',
  'FINANCE': 'FINANÇAS', 'OPERATIONS': 'OPERAÇÕES',
  'EMAILS SENT': 'E-MAILS ENVIADOS', 'REPORTS SENT': 'RELATÓRIOS ENVIADOS',
  'LEADS ENRICHED': 'LEADS ENRIQUECIDOS', 'CALL HRS ROUTED': 'HORAS DE LIGAÇÕES',
  'AD SPEND TODAY': 'GASTO EM ANÚNCIOS HOJE', 'PROPOSALS SENT': 'PROPOSTAS ENVIADAS',
  'INVOICES ISSUED': 'FATURAS EMITIDAS', 'NOTES INDEXED': 'NOTAS INDEXADAS',
  'CONNECTED TO': 'CONECTADO A', 'CONNECTORS': 'CONECTORES',
  'RUNS HEADLESS ON': 'EXECUTA EM', 'SESSION': 'SESSÃO',
  'THIS WINDOW': 'NESTA JANELA', 'TOKENS': 'TOKENS', 'RUNS': 'EXECUÇÕES',
  'RESETS': 'REINICIA', 'USAGE UNAVAILABLE': 'USO INDISPONÍVEL', 'LIMIT': 'LIMITE',
  'AUTO': 'AUTOMÁTICO', 'LOW': 'BAIXO', 'MEDIUM': 'MÉDIO', 'HIGH': 'ALTO',
  'XHIGH': 'MUITO ALTO', 'MAX': 'MÁXIMO',
  'Every weekday': 'Todos os dias úteis', 'Every day': 'Todos os dias',
  'Mondays': 'Segundas-feiras', 'Tuesdays': 'Terças-feiras', 'Wednesdays': 'Quartas-feiras',
  'Thursdays': 'Quintas-feiras', 'Fridays': 'Sextas-feiras', 'Saturdays': 'Sábados',
  'Sundays': 'Domingos', 'Every hour, 9–5, weekdays': 'A cada hora, das 9h às 17h, em dias úteis',
  'Mon': 'Seg', 'Tue': 'Ter', 'Wed': 'Qua', 'Thu': 'Qui', 'Fri': 'Sex', 'Sat': 'Sáb', 'Sun': 'Dom',
  'January': 'janeiro', 'February': 'fevereiro', 'March': 'março', 'April': 'abril',
  'May': 'maio', 'June': 'junho', 'July': 'julho', 'August': 'agosto',
  'September': 'setembro', 'October': 'outubro', 'November': 'novembro', 'December': 'dezembro',
  'needs my OK': 'precisa da minha aprovação', 'waits for your OK': 'aguarda sua aprovação',
  'read-only': 'somente leitura', 'next': 'próxima', 'last ran': 'última execução',
  'new today': 'nova hoje', 'New today': 'Novas hoje', 'Written by': 'Escrito por',
  'Last read by': 'Última leitura por', 'Last read': 'Última leitura', 'more': 'mais',
  'Links': 'Links', 'wiki links': 'links entre notas', 'nothing read yet': 'nenhuma nota lida ainda',
  'by': 'por', 'from the task': 'da tarefa',
  'now': 'agora', 'today': 'hoje', 'tomorrow': 'amanhã',
  'Nothing yet': 'Nada por enquanto', 'No routines yet.': 'Ainda não há rotinas.',
  'That day has passed — pick today or a day after it.': 'Esse dia já passou. Escolha hoje ou uma data futura.',
  'What should happen that day?': 'O que deve acontecer nesse dia?',
  'A task for this day — it runs at that time and lands in the panel. REPEAT makes it a routine from this date.': 'A tarefa será executada no horário escolhido e aparecerá no painel. REPETIR cria uma rotina a partir desta data.',
  'Click a note to read it. Hover to see its neighbours.': 'Clique em uma nota para lê-la. Passe o cursor para ver as notas relacionadas.',
  'Click any day to schedule a task for it, or switch on REPEAT to start a routine from that date. Click a routine here to see only its days.': 'Clique em um dia para agendar uma tarefa ou ative REPETIR para criar uma rotina a partir dessa data. Clique em uma rotina para ver os dias dela.',
  'Click a day, write what should happen, switch on REPEAT.': 'Clique em um dia, descreva a tarefa e ative REPETIR.',
  'Search the Brain…': 'Buscar no Cérebro…', 'Search tasks and routines…': 'Buscar tarefas e rotinas…',
  'Type a task…': 'Descreva a tarefa…', 'Write the task, or a whole brief…': 'Descreva a tarefa ou escreva um briefing completo…',
  'Message this agent… (add task: … · every weekday at 8am, … · approve / reject)': 'Envie uma mensagem… (adicionar tarefa: … · todo dia útil às 8h, … · aprovar / rejeitar)',
  'the calendar — tasks and routines on their days (P)': 'calendário — tarefas e rotinas em seus dias (P)',
  'close (Esc)': 'fechar (Esc)', 'close (Esc · P)': 'fechar (Esc · P)',
  'previous (←)': 'anterior (←)', 'next (→)': 'próximo (→)', 'today (T)': 'hoje (T)',
  'department': 'departamento', 'which model runs this (the office default unless you change it)': 'modelo usado nesta tarefa (padrão do escritório, salvo alteração)',
  "how hard it thinks: Auto is the model's own level (Opus runs at high); Low to Max as Claude Code names them": 'intensidade do raciocínio: Automático usa o nível do modelo; Baixo a Máximo seguem os níveis do Claude Code',
  'repeat on a schedule (or just say when: every weekday at 8am, …)': 'repetir em um horário (ou escreva: todo dia útil às 8h, …)',
  'a team: the department lead splits the task across its desks, they work at the same time, the lead writes the final (or just say “as a team”)': 'equipe: a liderança distribui a tarefa, os agentes trabalham em paralelo e a liderança reúne o resultado',
  'how often': 'frequência', "at what time (this machine's clock)": 'horário (relógio deste computador)',
  'the result waits for your approval before anything is sent': 'o resultado aguarda sua aprovação antes de qualquer envio',
  'open the big editor (⌘⇧E)': 'abrir o editor ampliado (⌘⇧E)',
  'zoom in (+)': 'aumentar zoom (+)', 'zoom out (−)': 'diminuir zoom (−)', 'overview (0)': 'visão geral (0)',
  'open the Brain (G)': 'abrir o Cérebro (G)',
  'nothing yet — connect in claude.ai or run: claude mcp add': 'nenhum ainda — conecte em claude.ai ou execute: claude mcp add',
  'licence': 'licença',
  'Sponsored': 'Patrocinado', 'Start your free trial': 'Comece seu teste grátis', 'SIGN UP': 'CADASTRAR',
  'All': 'Todas', 'Scheduled': 'Agendadas', 'Backlog': 'Pendentes', 'In progress': 'Em andamento',
  'LIVE': 'AO VIVO',
  'Waiting': 'Aguardando', 'Done': 'Concluídas', 'just now': 'agora mesmo',
  'Routine': 'Rotina', 'Team': 'Equipe', 'Routine ·': 'Rotina ·', 'Team ·': 'Equipe ·',
  'routine runs': 'execuções de rotinas', 'scheduled': 'agendadas', 'done': 'concluídas',
  'YOUR NOTES': 'SUAS NOTAS', 'META': 'METADADOS', 'BUSINESS': 'NEGÓCIO',
  'BRAND': 'MARCA', 'CUSTOMERS': 'CLIENTES',
  'Task for': 'Tarefa para', 'Goes to': 'Vai para', 'Probably': 'Provavelmente',
  'starts after their current job': 'começa após a tarefa atual',
  'starts straight away': 'começa imediatamente',
  'say more and I’ll pick a specialist': 'dê mais detalhes para eu escolher uma pessoa especialista',
  'Claude confirms when you press Add': 'Claude confirma ao clicar em Adicionar',
  'Claude names the agent when you press Add': 'Claude escolhe o agente ao clicar em Adicionar',
  'what time? add "at 8am"': 'qual horário? escreva "às 8h"',
  'which day? say "every Monday …"': 'qual dia? escreva "toda segunda-feira…"',
  'Added —': 'Adicionada —', 'has it.': 'recebeu a tarefa.',
  'has it': 'recebeu a tarefa', 'has it with': 'recebeu a tarefa junto com',
  'has it and is splitting it across the team': 'recebeu a tarefa e está distribuindo entre a equipe',
  'Routing through Claude —': 'Encaminhando pelo Claude —',
  'session attached — live work stream below': 'sessão conectada — acompanhe o trabalho abaixo',
  'goes to': 'vai para',
  'is reading it for the team…': 'está lendo a tarefa para a equipe…',
  'is reading it…': 'está lendo a tarefa…',
  'every week': 'toda semana', 'first run': 'primeira execução',
  'Claude names the agent': 'Claude escolhe o agente',
  'This run:': 'Esta execução:',
  'in the backlog': 'na lista de pendentes', 'in progress': 'em andamento',
  'waiting for your OK': 'aguardando sua aprovação',
  'just added': 'recém-adicionada', 'added by you': 'adicionada por você',
  'added by you · live': 'adicionada por você · ao vivo',
  'sent back to revise': 'devolvida para revisão', 'sending with Claude': 'enviando com Claude',
  'leading the team with Claude': 'liderando a equipe com Claude',
  'routine': 'rotina', 'routine draft': 'rascunho da rotina',
  'approved': 'aprovada', 'ran late': 'executada com atraso',
  'APPROVED ·': 'APROVADA ·', 'IN BACKLOG': 'PENDENTE',
  'ON APPROVAL': 'APROVAÇÃO',
  'Claude names the agent now, runs it then': 'Claude escolhe o agente agora e executa no horário',
  'RENDER ·': 'RENDERIZANDO ·',
  'for this task': 'para esta tarefa', 'for this routine': 'para esta rotina',
  'A task for': 'Uma tarefa para',
  'from the Brain': 'do Cérebro', 'rendering': 'renderizando', 'working with Claude': 'trabalhando com Claude',
  'waiting on the pieces': 'aguardando as partes', 'result ready →': 'resultado pronto →',
  'failed': 'falhou', 'sent after your OK': 'enviado após sua aprovação',
  'REPLIES DRAFTED': 'RESPOSTAS REDIGIDAS', 'CALLS S·A·J': 'LIGAÇÕES S·A·J',
  'NEW MANAGERS': 'NOVOS GERENTES', 'AUTO-ONBOARDED': 'INTEGRADOS AUTOMATICAMENTE',
  'NEW INSIGHTS': 'NOVAS DESCOBERTAS', 'COST PER USER': 'CUSTO POR USUÁRIO',
  'PROPOSALS MADE': 'PROPOSTAS CRIADAS', 'BILLS PAID': 'CONTAS PAGAS', 'ON TRACK': 'NO PRAZO',
  'Esc closes · scroll zooms · drag pans · click a note to read it': 'Esc fecha · role para ampliar · arraste para mover · clique em uma nota para ler',
  'move ·': 'mover ·', 'view ·': 'visualizar ·', 'today ·': 'hoje ·', 'close': 'fechar',
  'EMAILS LEAD': 'LIDERANÇA DE E-MAILS', 'CLIENT EMAILS': 'E-MAILS DE CLIENTES',
  'INTERNAL EMAILS': 'E-MAILS INTERNOS', 'VENDOR EMAILS': 'E-MAILS DE FORNECEDORES',
  'CONTRACTOR EMAILS': 'E-MAILS DE PRESTADORES', 'SALES LEAD': 'LIDERANÇA DE VENDAS',
  'LEAD ENRICHER': 'ENRIQUECIMENTO DE LEADS', 'INBOUND LEADS MANAGER': 'GESTÃO DE LEADS RECEBIDOS',
  'PROSPECTOR': 'PROSPECÇÃO', 'PROPOSALS': 'PROPOSTAS', 'FOLLOW UPS': 'ACOMPANHAMENTO',
  'MARKETING LEAD': 'LIDERANÇA DE MARKETING', 'RESEARCH': 'PESQUISA', 'NEWSLETTER': 'NEWSLETTER',
  'GRAPHICS DESIGNER': 'DESIGN GRÁFICO', 'META ADS': 'ANÚNCIOS META',
  'INSTAGRAM ORGANIC': 'INSTAGRAM ORGÂNICO', 'VIDEO EDITOR': 'EDIÇÃO DE VÍDEO',
  'OPERATIONS LEAD': 'LIDERANÇA DE OPERAÇÕES', 'INTEL': 'INTELIGÊNCIA',
  'LEGAL REVIEW': 'REVISÃO JURÍDICA', 'COMPLIANCE CHECKER': 'CONFORMIDADE',
  'INTERNAL REPORTING': 'RELATÓRIOS INTERNOS', 'INTERNAL DASHBOARDS': 'PAINÉIS INTERNOS',
  'ACCOUNTING LEAD': 'LIDERANÇA CONTÁBIL', 'INVOICING': 'FATURAMENTO',
  'ACCOUNTS PAYABLE': 'CONTAS A PAGAR', 'RECONCILIATION': 'CONCILIAÇÃO',
  'DELIVERY LEAD': 'LIDERANÇA DE ENTREGAS', 'PROJECT CO-ORDINATOR': 'COORDENAÇÃO DE PROJETOS',
  'QUALITY ASSURANCE CHECKER': 'GARANTIA DE QUALIDADE', 'CLIENT REPORTS': 'RELATÓRIOS DE CLIENTES',
  'CLIENT ASSETS': 'MATERIAIS DE CLIENTES', 'DESIGNER ASSISTANT': 'ASSISTÊNCIA DE DESIGN',
  'ONBOARDER': 'INTEGRAÇÃO DE CLIENTES',
  'INVOICE AUDIT — #218': 'AUDITORIA DA FATURA — Nº 218',
  'Design contractor': 'Prestador de design', 'Invoiced': 'Faturado',
  'Contract rate': 'Valor contratado', 'Variance': 'Diferença', 'Scope': 'Escopo',
  'matches the brief ✓': 'confere com o briefing ✓',
  'Hours and scope check out — only the rate is off, and there\'s no signed variation covering it. Recommend holding payment and querying the rate before it\'s paid.': 'Horas e escopo conferem; apenas o valor diverge e não há aditivo assinado. Recomendo reter o pagamento e questionar o preço antes de pagar.',
  'AGENT DISTRICT — PROPOSAL': 'AGENT DISTRICT — PROPOSTA',
  'Seats': 'Usuários', 'Plan': 'Plano', 'Price': 'Preço',
  'Proof point: Auckland roofing co — 0 → 40 tracked calls/week in 14 days. Sign-online link included.': 'Exemplo: empresa de telhados de Auckland passou de 0 a 40 ligações acompanhadas por semana em 14 dias. Link para assinatura eletrônica incluído.',
  'REFUND VERIFICATION': 'VERIFICAÇÃO DE REEMBOLSO', 'Reason': 'Motivo',
  'double payment, two cards': 'pagamento duplicado em dois cartões',
  'verified ✓ / duplicate ✓': 'verificado ✓ / duplicado ✓',
  'Account': 'Conta', '14 months, good standing': '14 meses, sem pendências',
  'Legit case. Above my $500 limit — releases the moment you approve.': 'Pedido válido. Acima do meu limite de US$ 500; o reembolso será liberado após sua aprovação.',
  '“calls before 10am are a trap”': '“ligações antes das 10h não funcionam”',
  'connect rates nearly double 10:00–11:30am — across 40,000 dials': 'a taxa de conexão quase dobra entre 10h e 11h30 — em 40 mil ligações',
  '↗ share': '↗ compartilhar',
  'Cold call anxiety? Your first 5 dials decide your whole day…': 'Ansiedade para ligar? As primeiras 5 chamadas influenciam todo o seu dia…',
  '“the 10am rule — call when they answer”': '“regra das 10h — ligue quando atendem”',
  'CPA $29 · best performer · scaling to $180/day': 'CPA US$ 29 · melhor resultado · aumentando para US$ 180/dia',
  'SUBJECT A': 'ASSUNTO A', 'SUBJECT B': 'ASSUNTO B',
  'calls before 10am are a trap': 'ligações antes das 10h não funcionam',
  'we looked at 40,000 calls — call at this time': 'analisamos 40 mil ligações — este é o melhor horário',
  'OPPORTUNITY MEMO': 'NOTA DE OPORTUNIDADE', 'CallForge +8% price rise': 'CallForge: aumento de preço de 8%',
  'Window': 'Prazo', 'Play': 'Plano', 'Briefed': 'Agentes envolvidos',
  '2–3 weeks': '2 a 3 semanas', 'comparison page + retargeting': 'página comparativa + remarketing',
  'Their G2 reviews already flag value-for-money. Talk-track: 12-month price lock.': 'As avaliações no G2 já questionam o custo-benefício. Argumento: preço fixo por 12 meses.',
  'PURCHASE ORDER': 'PEDIDO DE COMPRA', 'FullEnrich — 500 credits': 'FullEnrich — 500 créditos',
  'Cost': 'Custo', 'Current balance': 'Saldo atual', 'Burn rate': 'Consumo',
  '38 credits — out tomorrow': '38 créditos — acabam amanhã', '~90/week': '~90 por semana',
  'Same card as last month. Without credits, enrichment stops and the Sales Lead runs dry.': 'Mesmo cartão do mês passado. Sem créditos, o enriquecimento de leads para e a equipe de vendas fica sem dados.',
};

const patterns = [
  [/^Type a task for (.+)…$/i, (_, dept) => `Digite uma tarefa para ${dept}…`],
  [/^([◷◂]) (CALENDAR|OVERVIEW)$/i, (_, icon, label) => `${icon} ${words[label]}`],
  [/^(\d+) NOTES$/, (_, n) => `${n} NOTAS`],
  [/^(\d+) LINKS$/, (_, n) => `${n} LINKS`],
  [/^Task for (.+)$/i, (_, day) => `Tarefa para ${translate(day)}`],
  [/^· (.+)$/, (_, rest) => `· ${translate(rest)}`],
  [/^splits it across up to (\d+) desks, they work at the same time, the lead writes the final$/i, (_, n) => `distribui entre até ${n} agentes; eles trabalham ao mesmo tempo, e a liderança reúne o resultado`],
  [/^Claude couldn't take it \((.+)\)\. Kept it on the board\.$/i, (_, reason) => `Claude não conseguiu assumir a tarefa (${reason}). Ela ficou no painel.`],
  [/^done (\d{2}:\d{2})$/i, (_, time) => `concluída às ${time}`],
  [/^waiting (.+) for your tick$/i, (_, t) => `aguardando sua aprovação há ${t}`],
  [/^WAITING (.+)$/, (_, t) => `AGUARDANDO ${t}`],
  [/^waiting (.+)$/i, (_, t) => `aguardando há ${t}`],
  [/^done (.+)$/i, (_, t) => `concluída às ${t}`],
  [/^runs (.+)$/i, (_, t) => `executa ${t}`],
  [/^team piece from (.+)$/i, (_, name) => `parte da equipe de ${name}`],
  [/^next (.+)$/i, (_, t) => `próxima ${t}`],
  [/^New today · (\d+)$/i, (_, n) => `Novas hoje · ${n}`],
  [/^(.+?)( · .+)$/, (_, first, rest) => {
    const parts = rest.slice(3).split(' · ');
    return [translate(first), ...parts.map(p => translate(p))].join(' · ');
  }],
  [/^(\d+) more$/i, (_, n) => `mais ${n}`],
  [/^\+(\d+) more$/i, (_, n) => `+${n} mais`],
  [/^(\d+) agents$/i, (_, n) => `${n} agentes`],
  [/^(.+) IN BACKLOG$/, (_, duration) => `${duration} PENDENTE`],
  [/^(\d+) links?$/i, (_, n) => `${n} links`],
  [/^(\d+) notes?$/i, (_, n) => `${n} notas`],
  [/^\+(\d+) notes? today$/i, (_, n) => `+${n} notas hoje`],
  [/^(\d+) routine runs?$/i, (_, n) => `${n} execuções de rotinas`],
  [/^(\d+) scheduled$/i, (_, n) => `${n} agendadas`],
  [/^(\d+) done$/i, (_, n) => `${n} concluídas`],
  [/^(\d+)m ago$/i, (_, n) => `há ${n} min`],
  [/^(\d+)h ago$/i, (_, n) => `há ${n} h`],
  [/^in (\d+) min$/i, (_, n) => `em ${n} min`],
  [/^at (\d{2}:\d{2})$/i, (_, t) => `às ${t}`],
  [/^tomorrow (\d{2}:\d{2})$/i, (_, t) => `amanhã às ${t}`],
  [/^([A-Za-z]{3}) (\d{2}:\d{2})$/, (_, d, t) => `${words[d] || d} às ${t}`],
  [/^schedule something on (.+)$/i, (_, d) => `agendar algo para ${d}`],
  [/^show (.+) in the task panel$/i, (_, d) => `mostrar ${d} no painel de tarefas`],
  [/^Claude is naming the agent…$/i, () => 'Claude está escolhendo o agente…'],
  [/^Adding…$/i, () => 'Adicionando…'],
  [/^Could not add it\.$/i, () => 'Não foi possível adicionar.'],
  [/^LIVE · (.+)$/i, (_, s) => `AO VIVO · ${s}`],
  [/^([\s\S]+) by (.+) · (.+)$/i, (_, x, by, rest) => `${x} por ${by} · ${rest}`],
];

function translate(value) {
  const match = /^(\s*)(.*?)(\s*)$/s.exec(value);
  const key = match[2];
  let result = words[key];
  if (result === undefined) {
    for (const [re, fn] of patterns) {
      const parts = re.exec(key);
      if (parts) { result = fn(...parts); break; }
    }
  }
  return result === undefined ? value : match[1] + result + match[3];
}
export const tr = value => ptBR ? translate(value) : value;

function visit(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    if (!node.parentElement?.closest('script,style')) {
      const next = translate(node.nodeValue);
      if (next !== node.nodeValue) node.nodeValue = next;
    }
    return;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return;
  for (const attr of ['title', 'placeholder', 'aria-label']) {
    if (node.hasAttribute(attr)) {
      const value = node.getAttribute(attr), next = translate(value);
      if (value !== next) node.setAttribute(attr, next);
    }
  }
  for (const child of node.childNodes) visit(child);
}

export function localizeUI() {
  document.documentElement.lang = ptBR ? 'pt-BR' : 'en';
  if (!ptBR) return;
  document.body.classList.add('pt-br');
  document.title = translate(document.title);
  visit(document.body);
  new MutationObserver(changes => {
    for (const change of changes) {
      if (change.type === 'characterData') visit(change.target);
      else if (change.type === 'attributes') visit(change.target);
      else for (const node of change.addedNodes) visit(node);
    }
  }).observe(document.body, { childList: true, characterData: true, attributes: true, attributeFilter: ['title', 'placeholder', 'aria-label'], subtree: true });
}
