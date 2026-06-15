# Especificação de Telas e Funções
## GymTech — Sistema de Gestão de Academia de Exercícios Físicos

**Projeto:** TCC — E.E. Professor Sebastião de Castro — 3ª Série NA — Grupo 02
**Equipe:** Alisson Antonio dos Santos Faria · Cauã de Souza Sturaro · Renan Augusto de Oliveira Correa · Diego Antonio Fonseca dos Santos · Matheus Alves Gomes
**Versão:** 1.0 — Junho/2026

---

## 1. Visão Geral

### 1.1 Problema
Academias de pequeno e médio porte controlam alunos, mensalidades e treinos em papel ou planilhas soltas, o que gera perda de informação, inadimplência não detectada e dificuldade para o instrutor acompanhar os treinos dos alunos.

### 1.2 Objetivo do Sistema
O **GymTech** centraliza em um sistema web o cadastro de alunos, planos, pagamentos, fichas de treino e frequência, com painéis de indicadores para o administrador.

### 1.3 Identidade Visual

| Item | Definição |
|---|---|
| Nome | **GymTech** |
| Cor primária | Azul — sugestão: `#1565C0` (botões, cabeçalho, links, gráficos) |
| Cor secundária | Branco — `#FFFFFF` (fundos, cards, texto sobre azul) |
| Apoio | Tons de cinza claro (`#F5F7FA`) para fundos de seção; verde/vermelho apenas para status (ativo/inadimplente) |
| Logo | "GymTech" no cabeçalho de todas as telas e nos PDFs exportados |

### 1.4 Perfis de Usuário

| Perfil | Descrição | Acesso |
|---|---|---|
| **Administrador** | Dono/gerente da academia | Acesso total (cadastros, financeiro, relatórios) |
| **Recepcionista** | Funcionário da recepção | Alunos, matrículas, pagamentos, check-in |
| **Instrutor** | Professor de musculação | Fichas de treino, lista de alunos (leitura) |
| **Aluno** | Cliente da academia | Apenas seus próprios dados: treino, pagamentos, frequência |

### 1.5 Arquitetura (resumo)
- **Frontend:** aplicação web (HTML/CSS/JS ou React)
- **Backend:** API REST (Node.js/Express, Python/Flask ou PHP/Laravel)
- **Banco de dados:** MySQL ou PostgreSQL
- **Autenticação:** sessão ou JWT, com controle de permissão por perfil

### 1.6 Não-Objetivos (fora do escopo do TCC)
- Integração com catraca física ou biometria (check-in será manual no sistema)
- Pagamento online (cartão/Pix integrado) — o sistema apenas **registra** pagamentos
- Aplicativo mobile nativo (o site será responsivo)
- Agendamento de aulas coletivas (pode ser evolução futura)

---

## 2. Mapa de Telas

| # | Tela | Perfis | Sprint |
|---|---|---|---|
| T01 | Login | Todos | 1 |
| T02 | Dashboard | Admin, Recepcionista | 5 |
| T03 | Lista de Alunos | Admin, Recepcionista, Instrutor | 1 |
| T04 | Cadastro/Edição de Aluno | Admin, Recepcionista | 1 |
| T05 | Cadastro de Funcionários | Admin | 1 |
| T06 | Planos | Admin | 2 |
| T07 | Matrícula | Admin, Recepcionista | 2 |
| T08 | Financeiro (Pagamentos) | Admin, Recepcionista | 3 |
| T09 | Ficha de Treino (montagem) | Instrutor, Admin | 4 |
| T10 | Meu Treino (visão do aluno) | Aluno | 4 |
| T11 | Check-in / Frequência | Recepcionista, Admin | 4 |
| T12 | Relatórios | Admin | 5 |

---
## 3. Especificação das Telas

### T01 — Login

**Objetivo:** autenticar o usuário e direcioná-lo conforme seu perfil.

**Elementos da tela**
- Logo **GymTech** centralizada, fundo branco com destaque em azul
- Campo *E-mail* (texto, obrigatório)
- Campo *Senha* (password, obrigatório, mínimo 6 caracteres)
- Botão *Entrar*
- Link *Esqueci minha senha* (P1 — opcional na v1)

**Funções**

| Função | Descrição |
|---|---|
| `autenticar(email, senha)` | Valida credenciais no banco; senha comparada com hash (bcrypt). Cria sessão/token com o perfil do usuário. |
| `redirecionarPorPerfil(perfil)` | Admin/Recepção → Dashboard; Instrutor → Lista de Alunos; Aluno → Meu Treino. |

**Critérios de aceitação**
- [ ] Dado um e-mail e senha corretos, quando clicar em *Entrar*, então o usuário é autenticado e redirecionado para sua tela inicial
- [ ] Credenciais erradas exibem "E-mail ou senha inválidos" (sem dizer qual campo errou)
- [ ] Usuário inativo não consegue entrar, mesmo com senha correta
- [ ] Senhas nunca são gravadas em texto puro no banco
- [ ] Acessar uma URL interna sem estar logado redireciona para o Login

---

### T02 — Dashboard

**Objetivo:** visão rápida da situação da academia ao entrar no sistema.

**Elementos da tela**
- Cartões de indicadores: *Alunos ativos*, *Inadimplentes*, *Check-ins hoje*, *Receita do mês*
- Gráfico de frequência dos últimos 30 dias (barras)
- Lista "Vencimentos próximos (7 dias)" com nome do aluno e data

**Funções**

| Função | Descrição |
|---|---|
| `contarAlunosAtivos()` | Total de matrículas com status *ativo*. |
| `contarInadimplentes()` | Alunos com pagamento vencido e não quitado. |
| `contarCheckinsHoje()` | Check-ins registrados na data atual. |
| `calcularReceitaMes()` | Soma dos pagamentos recebidos no mês corrente. |
| `listarVencimentosProximos(dias)` | Mensalidades que vencem nos próximos N dias. |

**Critérios de aceitação**
- [ ] Os 4 indicadores refletem os dados reais do banco ao carregar a tela
- [ ] Clicar no cartão *Inadimplentes* leva à lista de alunos filtrada por inadimplência
- [ ] Sem dados no período, o gráfico exibe estado vazio ("Sem registros") em vez de quebrar

---

### T03 — Lista de Alunos

**Objetivo:** localizar e gerenciar alunos cadastrados.

**Elementos da tela**
- Campo de busca (nome ou CPF)
- Filtro por status: *Todos / Ativo / Inativo / Inadimplente*
- Tabela: Foto, Nome, Plano, Status, Vencimento, Ações (*Ver*, *Editar*, *Inativar*)
- Botão *+ Novo Aluno*
- Paginação (20 por página)

**Funções**

| Função | Descrição |
|---|---|
| `listarAlunos(filtro, busca, pagina)` | Retorna alunos paginados conforme busca e filtro. |
| `inativarAluno(id)` | Muda status para *inativo* (exclusão lógica — nunca apagar do banco). |
| `reativarAluno(id)` | Retorna o aluno ao status *ativo*. |

**Critérios de aceitação**
- [ ] Busca por nome parcial retorna resultados (ex.: "mar" encontra "Maria" e "Marcos")
- [ ] Status *Inadimplente* aparece destacado em vermelho
- [ ] Inativar pede confirmação ("Deseja inativar este aluno?") antes de executar
- [ ] Instrutor visualiza a lista mas não vê os botões *Editar* e *Inativar*

---

### T04 — Cadastro/Edição de Aluno

**Objetivo:** registrar dados pessoais e de contato do aluno.

**Campos**

| Campo | Tipo | Regras |
|---|---|---|
| Nome completo | texto | obrigatório, mín. 3 caracteres |
| CPF | texto com máscara | obrigatório, válido e único no sistema |
| Data de nascimento | data | obrigatório; menor de 18 exige responsável |
| Telefone/WhatsApp | texto com máscara | obrigatório |
| E-mail | texto | obrigatório, formato válido, único (será o login do aluno) |
| Endereço | texto | opcional |
| Foto | upload de imagem | opcional, JPG/PNG até 2 MB |
| Observações de saúde | texto longo | opcional (lesões, restrições) |

**Funções**

| Função | Descrição |
|---|---|
| `cadastrarAluno(dados)` | Valida campos, grava aluno e cria usuário de acesso (perfil Aluno) com senha provisória. |
| `editarAluno(id, dados)` | Atualiza dados mantendo histórico de matrícula/pagamentos. |
| `validarCPF(cpf)` | Valida dígitos verificadores e duplicidade. |
| `uploadFoto(arquivo)` | Valida tipo/tamanho e salva o caminho no banco. |

**Critérios de aceitação**
- [ ] CPF inválido ou já cadastrado bloqueia o salvamento com mensagem clara no campo
- [ ] Ao salvar com sucesso, o sistema exibe confirmação e oferece "Matricular agora"
- [ ] Campos obrigatórios vazios ficam destacados ao tentar salvar
- [ ] Foto maior que 2 MB é recusada com aviso

---

### T05 — Cadastro de Funcionários

**Objetivo:** gerenciar funcionários e seus níveis de acesso.

**Campos:** Nome, CPF, E-mail, Telefone, Cargo (*Administrador / Recepcionista / Instrutor*), CREF (obrigatório apenas para instrutor), Senha inicial.

**Funções**

| Função | Descrição |
|---|---|
| `cadastrarFuncionario(dados)` | Cria funcionário e usuário com o perfil escolhido. |
| `editarFuncionario(id, dados)` | Atualiza dados e cargo. |
| `desativarFuncionario(id)` | Bloqueia o acesso sem apagar o histórico. |

**Critérios de aceitação**
- [ ] Apenas o Administrador acessa esta tela
- [ ] Selecionar cargo *Instrutor* torna o campo CREF obrigatório
- [ ] Funcionário desativado não consegue mais fazer login
- [ ] O sistema impede desativar o único administrador ativo

---
### T06 — Planos

**Objetivo:** cadastrar os planos comercializados pela academia.

**Campos:** Nome do plano (ex.: Mensal, Trimestral, Anual), Duração em meses, Valor mensal (R$), Descrição/benefícios, Status (*ativo/inativo*).

**Funções**

| Função | Descrição |
|---|---|
| `cadastrarPlano(dados)` | Cria plano com valor e duração. |
| `editarPlano(id, dados)` | Altera valores — **não afeta matrículas já existentes** (elas guardam o valor contratado). |
| `inativarPlano(id)` | Plano some das opções de nova matrícula, mas matrículas vigentes continuam. |

**Critérios de aceitação**
- [ ] Valor aceita apenas números positivos com 2 casas decimais
- [ ] Alterar o preço de um plano não muda o valor das mensalidades de quem já está matriculado
- [ ] Plano inativo não aparece no formulário de matrícula

---

### T07 — Matrícula

**Objetivo:** vincular um aluno a um plano e gerar as cobranças.

**Elementos da tela**
- Seleção do aluno (busca por nome/CPF)
- Seleção do plano (somente ativos)
- Data de início
- Dia de vencimento da mensalidade (1–28)
- Resumo: valor mensal, duração, data de término calculada

**Funções**

| Função | Descrição |
|---|---|
| `matricular(alunoId, planoId, dataInicio, diaVencimento)` | Cria a matrícula com status *ativo* e grava o valor contratado. |
| `gerarMensalidades(matricula)` | Gera automaticamente uma cobrança *pendente* para cada mês da duração do plano. |
| `cancelarMatricula(id, motivo)` | Encerra a matrícula; mensalidades futuras pendentes são canceladas. |
| `renovarMatricula(id)` | Cria nova matrícula a partir do término da anterior, com o plano/valor atual. |

**Regras de negócio**
- Um aluno só pode ter **uma matrícula ativa** por vez
- Status do aluno deriva da matrícula: *ativo* → vira *inadimplente* se houver mensalidade vencida não paga; *inativo* sem matrícula vigente

**Critérios de aceitação**
- [ ] Dado um aluno já com matrícula ativa, quando tentar matricular de novo, então o sistema bloqueia e informa o motivo
- [ ] Matrícula trimestral gera exatamente 3 mensalidades com os vencimentos corretos
- [ ] Cancelamento exige motivo e registra data/usuário responsável

---

### T08 — Financeiro (Pagamentos)

**Objetivo:** registrar pagamentos e controlar a inadimplência.

**Elementos da tela**
- Filtros: período, status (*pendente / pago / vencido / cancelado*), aluno
- Tabela: Aluno, Competência (mês), Valor, Vencimento, Status, Ações
- Botão *Registrar pagamento* em cada cobrança pendente/vencida
- Totalizador do filtro aplicado

**Funções**

| Função | Descrição |
|---|---|
| `listarCobrancas(filtros)` | Lista mensalidades conforme filtros. |
| `registrarPagamento(cobrancaId, dataPgto, formaPgto)` | Marca como *paga* (Dinheiro, Pix, Cartão), grava data e usuário. |
| `estornarPagamento(cobrancaId, motivo)` | Reverte para *pendente* — apenas Administrador. |
| `atualizarVencidas()` | Rotina diária: cobranças pendentes com vencimento passado viram *vencidas* e o aluno vira *inadimplente*. |
| `listarInadimplentes()` | Alunos com ao menos uma cobrança vencida, com dias de atraso. |

**Critérios de aceitação**
- [ ] Registrar pagamento exige forma de pagamento e não permite data futura
- [ ] Ao quitar todas as cobranças vencidas, o aluno volta automaticamente ao status *ativo*
- [ ] Estorno é restrito ao perfil Administrador e exige motivo
- [ ] O totalizador soma apenas as cobranças visíveis no filtro atual

---

### T09 — Ficha de Treino (montagem pelo instrutor)

**Objetivo:** o instrutor monta e atualiza o treino de cada aluno.

**Elementos da tela**
- Seleção do aluno
- Divisões do treino (A, B, C...) em abas
- Por exercício: Nome (busca na biblioteca de exercícios), Grupo muscular, Séries, Repetições, Carga sugerida, Descanso, Observação
- Validade da ficha (ex.: 60 dias)
- Botões *Adicionar exercício*, *Remover*, *Reordenar*, *Salvar ficha*

**Funções**

| Função | Descrição |
|---|---|
| `criarFicha(alunoId, validade)` | Cria nova ficha; a anterior fica arquivada como histórico. |
| `adicionarExercicio(fichaId, divisao, dados)` | Insere exercício na divisão escolhida. |
| `listarBibliotecaExercicios(busca, grupo)` | Catálogo pré-cadastrado de exercícios por grupo muscular. |
| `arquivarFicha(fichaId)` | Encerra a ficha sem apagar (histórico de evolução). |

**Critérios de aceitação**
- [ ] Uma ficha precisa de ao menos 1 divisão com 1 exercício para ser salva
- [ ] Criar nova ficha arquiva a anterior automaticamente, mantendo o histórico consultável
- [ ] Ficha com validade vencida exibe alerta para o instrutor e para o aluno
- [ ] Somente Instrutor e Administrador editam fichas

---

### T10 — Meu Treino (visão do aluno)

**Objetivo:** o aluno consulta seu treino atual pelo celular dentro da academia.

**Elementos da tela**
- Nome da divisão do dia (A/B/C) selecionável
- Lista de exercícios: nome, séries × repetições, carga, descanso, observação do instrutor
- Indicador de validade da ficha
- Atalhos: *Meus pagamentos* e *Minha frequência* (somente leitura)

**Funções**

| Função | Descrição |
|---|---|
| `obterFichaAtual(alunoLogado)` | Retorna a ficha ativa do aluno autenticado. |
| `obterMeusPagamentos(alunoLogado)` | Histórico de cobranças e status do próprio aluno. |
| `obterMinhaFrequencia(alunoLogado)` | Check-ins do aluno no mês. |

**Critérios de aceitação**
- [ ] O aluno só enxerga os **próprios** dados — tentar acessar dados de outro aluno pela URL retorna erro de permissão
- [ ] Sem ficha cadastrada, exibe "Procure seu instrutor para montar seu treino"
- [ ] Layout responsivo legível em tela de celular (375 px)

---

### T11 — Check-in / Frequência

**Objetivo:** registrar a entrada dos alunos e bloquear inadimplentes.

**Elementos da tela**
- Campo de busca rápida (nome ou CPF) com foco automático
- Cartão do aluno encontrado: foto, nome, plano, status
- Botão grande *Confirmar entrada*
- Lista dos últimos check-ins do dia

**Funções**

| Função | Descrição |
|---|---|
| `buscarAlunoCheckin(termo)` | Localiza o aluno e retorna status da matrícula. |
| `registrarCheckin(alunoId)` | Grava data/hora da entrada. |
| `verificarLiberacao(alunoId)` | *Ativo* → liberado (verde); *inadimplente* → alerta (vermelho) com aviso à recepção; *inativo* → bloqueado. |

**Critérios de aceitação**
- [ ] Check-in de aluno ativo é confirmado em até 2 cliques
- [ ] Aluno inadimplente gera alerta visual, mas a recepção pode liberar manualmente (fica registrado quem liberou)
- [ ] Aluno inativo não pode ter check-in registrado
- [ ] Check-in duplicado no mesmo dia exibe aviso "Entrada já registrada hoje"

---

### T12 — Relatórios

**Objetivo:** dados consolidados para gestão e para a apresentação do TCC.

**Relatórios disponíveis**

| Relatório | Conteúdo | Filtros |
|---|---|---|
| Receita | Total recebido, por forma de pagamento | Período |
| Inadimplência | Alunos devedores, valor e dias de atraso | Período |
| Frequência | Check-ins por dia e horário de pico | Período |
| Alunos | Novas matrículas × cancelamentos | Período |

**Funções**

| Função | Descrição |
|---|---|
| `gerarRelatorio(tipo, filtros)` | Consulta e consolida os dados do período. |
| `exportarPDF(relatorio)` | Gera PDF com logo **GymTech** (cabeçalho azul), período e data de emissão. |

**Critérios de aceitação**
- [ ] Os números dos relatórios batem com os registros das telas de origem (Financeiro, Check-in)
- [ ] O PDF exportado abre corretamente e traz o período filtrado no cabeçalho
- [ ] Apenas o Administrador acessa esta tela

---

## 4. Requisitos Não-Funcionais

| Código | Requisito |
|---|---|
| RNF-01 | Senhas armazenadas com hash (bcrypt) — nunca em texto puro |
| RNF-02 | Controle de permissão verificado **no backend** em toda rota, não só escondendo botões |
| RNF-03 | Exclusão lógica (status) em vez de apagar registros — preserva histórico |
| RNF-04 | Interface responsiva (desktop para recepção, celular para o aluno) |
| RNF-05 | Mensagens de erro claras em português, apontando o campo com problema |
| RNF-06 | Respostas das telas principais em até 2 segundos com 1.000 alunos cadastrados |
| RNF-07 | Identidade visual consistente: paleta azul e branco em todas as telas, conforme seção 1.3 |

---

## 5. Modelo de Dados (entidades principais)

```
USUARIO (id, nome, email, senha_hash, perfil, ativo)
ALUNO (id, usuario_id, cpf, nascimento, telefone, endereco, foto, obs_saude)
FUNCIONARIO (id, usuario_id, cpf, cargo, cref)
PLANO (id, nome, duracao_meses, valor_mensal, ativo)
MATRICULA (id, aluno_id, plano_id, valor_contratado, data_inicio,
           data_fim, dia_vencimento, status)
COBRANCA (id, matricula_id, competencia, valor, vencimento, status,
          data_pagamento, forma_pagamento, recebido_por)
FICHA_TREINO (id, aluno_id, instrutor_id, validade, status)
EXERCICIO_FICHA (id, ficha_id, divisao, exercicio_id, series,
                 repeticoes, carga, descanso, observacao, ordem)
EXERCICIO (id, nome, grupo_muscular)
CHECKIN (id, aluno_id, data_hora, liberado_por)
```

**Relacionamentos-chave:** Aluno 1—N Matrícula · Matrícula 1—N Cobrança · Aluno 1—N FichaTreino · Ficha 1—N ExercícioFicha · Aluno 1—N Check-in

---

## 6. Questões em Aberto (decidir com o grupo)

1. **Stack:** qual linguagem o grupo domina melhor para o backend? *(decisão bloqueante — Sprint 1)*
2. **Senha provisória do aluno:** enviada por WhatsApp manualmente ou impressa na recepção?
3. **Biblioteca de exercícios:** cadastrar ~50 exercícios básicos como carga inicial do banco?
4. **Tolerância de inadimplência:** quantos dias de atraso antes de bloquear o check-in?

---

## 7. Rastreabilidade Tela × Sprint

| Sprint | Entrega demonstrável |
|---|---|
| 1 | T01 Login + T03/T04 Alunos + T05 Funcionários |
| 2 | T06 Planos + T07 Matrícula |
| 3 | T08 Financeiro completo |
| 4 | T09/T10 Treinos + T11 Check-in |
| 5 | T02 Dashboard + T12 Relatórios + ajustes finais |