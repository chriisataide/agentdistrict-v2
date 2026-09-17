# Agent District

Uma interface 3D para acompanhar agentes que trabalham com suas notas, Claude e Codex. A interface, os agentes padrão e os comandos principais estão em português brasileiro.

Marca: `icodev.tech`. Site da iCodev: [icodev.com.br](https://icodev.com.br).

## Iniciar

Requer Node.js 20 ou superior, Git e Claude Code conectado à sua conta (ou uma `ANTHROPIC_API_KEY`). Para usar OpenAI, instale o Codex CLI e conecte sua conta com `codex login`. O Codex CLI aceita login ChatGPT ou chave de API; o app reutiliza esse login.

```bash
./setup
npm start
```

Abra [http://localhost:4520](http://localhost:4520). Sem o script de configuração, execute `npm install && npm run build && npm start`.

## Primeiros passos

1. Escolha um departamento na barra do painel à direita.
2. Descreva uma tarefa em português e clique em **Adicionar**. O Claude escolhe o agente adequado.
3. Acompanhe o andamento no painel. Clique em um agente para conversar e ver sua atividade.
4. Se um resultado precisar de mudanças, escreva `revisar: ...` na conversa do agente.
5. Quando uma ação externa pedir sua autorização, use **Aprovar** ou **Rejeitar**.

O painel indica **AO VIVO · CLAUDE + CODEX** quando ambos estão conectados. Abrir `dist/command-centre-v2.html` diretamente mostra uma demonstração local.

## Claude e Codex

No seletor de modelo da barra de tarefas, escolha **Sonnet**, **Opus** ou **Fable** para usar Claude, ou **Codex** para usar sua conta OpenAI. A escolha também funciona em rotinas, no campo `model` de cada agente em `office.agents.local.json` e como padrão do escritório com `"model": "codex"` em `office.config.local.json`. A precedência é tarefa, rotina, agente e padrão do escritório.

O Claude faz a distribuição inicial das tarefas e mantém seus conectores MCP. O Codex produz resultados em um ambiente isolado de leitura, sem os conectores do Claude. Em tarefas que precisam enviar ou alterar algo fora do app, o Codex prepara o material e, após sua aprovação, o Claude executa a ação com os conectores disponíveis. O indicador de uso na barra superior continua mostrando apenas o plano Claude. O ícone Codex mostra se o login OpenAI está ativo.

## Comandos em português

- **Rotina:** `todo dia útil às 8h, revisar a caixa de entrada` ou `toda segunda-feira às 9h, preparar o resumo`.
- **Equipe:** comece a tarefa com `em equipe, ...` ou ative **Equipe** na barra.
- **Conversa:** `adicionar tarefa: ...`, `revisar: ...`, `rotinas`, `pausar ...`, `retomar ...`, `executar ...` e `excluir ...`.
- **Configurar um departamento:** abra a conversa com a liderança e escreva `configurar`. Ela fará cinco perguntas para registrar como sua equipe trabalha. Durante a entrevista, use `pular`, `concluir` ou `cancelar`.

As rotinas estão disponíveis para E-mails, Contabilidade e Vendas nesta versão. O servidor deve permanecer ligado para executá-las no horário, mesmo que a página esteja fechada.

## Navegação

| Tecla | Ação |
| --- | --- |
| `P` | Abrir o calendário |
| `G` | Abrir o Cérebro, com o grafo de notas |
| `B` | Abrir o quadro de tarefas |
| `D` | Alternar o modo escuro |
| `Esc` | Fechar a tela ou o painel atual |

O calendário permite agendar tarefas em uma data e criar rotinas a partir dela com **Repetir**.

## Ajustar o escritório

Em `office.config.json`, altere o nome do negócio e o caminho da pasta de notas (`brain`). O projeto inclui notas de exemplo. Personalize nomes, funções e instruções dos agentes em `office.agents.local.json`; esse arquivo local não é sobrescrito pelo Git.

Para abrir a interface original em inglês, use `http://localhost:4520/?lang=en`.

Após alterar o código da interface, execute `npm run build` e recarregue a página. Para verificar o projeto, execute `npm run check`.
