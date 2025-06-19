# ALEXDEVELOPER30 - Vale Cashback System

## Sistema Completo de Cashback e Indicações

Este é um backup completo do sistema Vale Cashback com todas as funcionalidades implementadas e banco de dados com dados reais.

### Características do Sistema

- **Frontend**: React.js com TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Express.js com TypeScript, PostgreSQL, Drizzle ORM
- **Autenticação**: Sistema completo de login/logout com sessões
- **Banco de Dados**: PostgreSQL com 130+ usuários reais (91 clientes, 36 lojistas, 3 admins).

Banco de dados usado é o neon https://neon.com/ usa postgres com recursos extras CDN online com websocket, o sistema é totalmente dependente do neon, não funciona em sua totalidade só com postgresql puro. 

### Funcionalidades Principais

#### Sistema de Usuários
- 3 tipos de usuário: Cliente, Lojista, Administrador
- Cadastro e login funcionais
- Perfis personalizados por tipo de usuário

#### Sistema de Indicações
- Códigos de convite únicos para cada usuário
- Status dinâmico: "Pendente" → "Aprovado" quando indicado faz primeira compra
- Comissão de 1% sobre gastos dos indicados
- Bônus de R$10 para novos cadastros

#### Sistema de Transações
- Processamento de vendas pelos lojistas
- Cashback de 2% para clientes
- Taxa de 5% cobrada automaticamente dos lojistas
- Histórico completo de transações

#### Painel Administrativo
- Gestão completa de usuários
- Relatórios detalhados
- Configuração de taxas e comissões
- Análise de indicações e vendas

### Estrutura do Backup

```
ALEXDEVELOPER30_BACKUP/
├── client/                     # Frontend React
├── server/                     # Backend Express
├── shared/                     # Esquemas compartilhados
├── backup_alexdeveloper30_database.sql  # Dump completo do banco
├── package.json               # Dependências
├── vite.config.ts            # Configuração Vite
├── tailwind.config.ts        # Configuração Tailwind
├── drizzle.config.ts         # Configuração ORM
└── README.md                 # Este arquivo
```

### Instalação e Configuração

1. **Restaurar arquivos**:
```bash
# Extrair backup e entrar na pasta
cd ALEXDEVELOPER30_BACKUP

# Instalar dependências
npm install
```

2. **Configurar banco de dados**:
```bash
# Criar banco PostgreSQL
createdb valecashback_db

# Restaurar dados
psql valecashback_db < backup_alexdeveloper30_database.sql
```

3. **Configurar variáveis de ambiente**:
```bash
# Criar arquivo .env
echo "DATABASE_URL=postgresql://usuario:senha@localhost:5432/valecashback_db" > .env
echo "SESSION_SECRET=seu_secret_aqui" >> .env
```

4. **Executar aplicação**:
```bash
npm run dev
```

### Credenciais de Acesso

#### Administrador Principal
- Email: admin@valecashback.com
- Senha: senha123

#### Cliente Demo
- Email: cliente@valecashback.com
- Senha: senha123

#### Lojista Demo
- Email: lojista@valecashback.com
- Senha: senha123

### Status das Funcionalidades

✅ **Completamente Implementado**:
- Sistema de login/logout
- Cadastro de usuários via código de convite
- Painéis diferenciados por tipo de usuário
- Sistema de indicações com status dinâmico
- Processamento de transações e cashback
- Cálculo automático de comissões
- Relatórios administrativos
- Interface responsiva e moderna

✅ **Sistema de Indicações**:
- Códigos únicos por usuário (ex: INVITE002)
- Status automático: Pendente → Aprovado
- Comissão de 1% sobre gastos dos indicados
- Visualização completa na interface

✅ **Banco de Dados Real**:
- 130+ usuários autênticos
- Transações reais processadas
- Histórico completo de atividades
- Sistema de sessões configurado

### Tecnologias Utilizadas

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, React Query
- **Backend**: Node.js, Express, TypeScript, Drizzle ORM
- **Banco**: PostgreSQL com esquemas otimizados
- **Autenticação**: Express Session com store PostgreSQL
- **Validação**: Zod schemas compartilhados

### Arquitetura

O sistema segue uma arquitetura full-stack moderna com:
- Separação clara entre frontend e backend
- Esquemas compartilhados para consistência
- Queries otimizadas com relacionamentos
- Interface reativa com atualizações em tempo real
- Sistema de cache inteligente

### Notas de Desenvolvimento

- Sistema operando em USD ($) com formatação americana
- Taxas configuráveis via painel administrativo
- Códigos de convite gerados automaticamente
- Status das indicações baseado em atividade real
- Comissões calculadas automaticamente

### Backup Criado em

Data: 17 de Junho de 2025
Versão: Completa com todas as funcionalidades
Tamanho do banco: ~7.4MB (130+ usuários)