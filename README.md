# Bets Comparator - Plataforma SaaS de Comparação de Casas de Apostas

## 📋 Sobre o Projeto

O **Bets Comparator** é uma plataforma SaaS que permite analisar, comparar e ranquear casas de apostas regulamentadas no Brasil. O sistema permite que uma equipe técnica (admin) insira parâmetros técnicos e reputacionais, enquanto clientes podem comparar casas de apostas, aplicar filtros e receber insights automáticos gerados por IA.

## 🚀 Stack Tecnológica

- **Frontend**: Next.js 15.3 + React 19 + TailwindCSS
- **UI Components**: shadcn/ui + Radix UI
- **Backend**: Next.js API Routes
- **Banco de Dados**: PostgreSQL + Prisma ORM
- **Autenticação**: Better Auth (JWT)
- **IA**: OpenAI API (GPT-4o-mini)
- **Gráficos**: Recharts
- **Deploy**: Vercel (Frontend) + Neon/Supabase (Database)

## 📁 Estrutura do Projeto

```
bets-comparator/
├── prisma/
│   └── schema.prisma           # Schema do banco de dados
├── src/
│   ├── app/
│   │   ├── api/                # API Routes
│   │   │   ├── auth/           # Autenticação
│   │   │   ├── bets/           # CRUD de Casas de Apostas
│   │   │   ├── parameters/     # CRUD de Parâmetros
│   │   │   ├── comparisons/    # Comparações salvas
│   │   │   ├── insights/       # Geração de insights com IA
│   │   │   └── admin/          # Admin endpoints
│   │   ├── admin/              # Dashboard Admin
│   │   │   ├── bets/           # Gestão de Bets
│   │   │   ├── parameters/     # Gestão de Parâmetros
│   │   │   └── users/          # Gestão de Usuários
│   │   ├── dashboard/          # Dashboard Cliente
│   │   ├── login/              # Login
│   │   ├── signup/             # Cadastro
│   │   ├── forgot-password/    # Recuperação de senha
│   │   └── reset-password/     # Redefinição de senha
│   ├── components/
│   │   ├── Auth/               # Componentes de autenticação
│   │   ├── ui/                 # Componentes UI (shadcn)
│   │   └── admin/              # Componentes admin
│   └── lib/
│       ├── auth.ts             # Configuração Better Auth
│       ├── prisma.ts           # Cliente Prisma
│       ├── openai.ts           # Serviço OpenAI
│       ├── email.ts            # Serviço de email
│       └── schema/             # Schemas de validação
└── package.json
```

## 🗄️ Modelos do Banco de Dados

### Autenticação
- **User**: Usuários (admin ou cliente)
- **Session**: Sessões de usuário
- **Account**: Contas vinculadas (OAuth, etc)
- **Verification**: Códigos de verificação

### Bets Comparator
- **Bet**: Casas de apostas
- **Parameter**: Parâmetros de avaliação
- **ParameterHistory**: Histórico de alterações
- **Comparison**: Comparações salvas pelos usuários

## 🔑 Variáveis de Ambiente

Copie o arquivo `env.example` para `.env.local` e configure:

```bash
# Database
DATABASE_URL="postgresql://user:password@host:port/database"

# Authentication
BETTER_AUTH_SECRET="seu-secret-key-32-chars-minimo"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"

# OpenAI
OPENAI_API_KEY="sk-xxxxxx"

# Email (opcional)
RESEND_API_KEY="re_xxxxxx"
FROM_EMAIL="noreply@seudominio.com"
```

## 🛠️ Instalação e Setup

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Banco de Dados

```bash
# Gerar o cliente Prisma
npx prisma generate

# Aplicar o schema ao banco
npx prisma db push

# (Opcional) Abrir Prisma Studio
npx prisma studio
```

### 3. Criar Usuário Admin

Execute o projeto e acesse: `http://localhost:3000/api/auth/create-admin`

Ou crie manualmente via Prisma Studio com role: `ADMIN`

### 4. Executar em Desenvolvimento

```bash
npm run dev
```

Acesse: `http://localhost:3000`

## 📊 Funcionalidades Principais

### 🔐 Autenticação
- ✅ Login com email e senha
- ✅ Cadastro de novos usuários
- ✅ Recuperação de senha (email)
- ✅ Redefinição de senha
- ✅ Sessões seguras (JWT)
- ✅ Roles (ADMIN / CLIENT)

### 👨‍💼 Painel Admin
- ✅ Dashboard com estatísticas
- ✅ CRUD completo de Casas de Apostas
  - Nome, CNPJ, URL, Região, Licença
- ✅ CRUD completo de Parâmetros
  - Nome, Valor, Categoria, Unidade
  - Histórico de alterações com datas
- ✅ Gestão de usuários

### 👤 Painel Cliente
- ✅ Visualização de todas as casas de apostas
- ✅ Filtros por região e busca
- ✅ Seleção múltipla para comparação
- ✅ Geração de insights com IA (OpenAI)
  - Análise individual
  - Comparação entre múltiplas casas
  - Ranking automático
  - Pontos fortes e fracos
  - Recomendações

### 🤖 Integração com IA
- ✅ Análise individual de casas de apostas
- ✅ Comparação entre múltiplas casas
- ✅ Geração de rankings
- ✅ Identificação de pontos fortes/fracos
- ✅ Recomendações personalizadas

## 🎯 Rotas da API

### Autenticação
- `POST /api/auth/custom-login` - Login
- `POST /api/auth/signup` - Cadastro
- `POST /api/auth/create-admin` - Criar admin
- `GET /api/auth/validate-session` - Validar sessão

### Bets
- `GET /api/bets` - Listar casas de apostas
- `POST /api/bets` - Criar casa de apostas
- `GET /api/bets/[id]` - Buscar por ID
- `PATCH /api/bets/[id]` - Atualizar
- `DELETE /api/bets/[id]` - Deletar

### Parameters
- `GET /api/parameters` - Listar parâmetros
- `POST /api/parameters` - Criar/Atualizar parâmetro
- `GET /api/parameters/[id]` - Buscar por ID
- `PATCH /api/parameters/[id]` - Atualizar
- `DELETE /api/parameters/[id]` - Deletar
- `GET /api/parameters/[id]/history` - Histórico

### Comparisons
- `GET /api/comparisons` - Listar comparações
- `POST /api/comparisons` - Salvar comparação
- `GET /api/comparisons/[id]` - Buscar por ID
- `PATCH /api/comparisons/[id]` - Atualizar
- `DELETE /api/comparisons/[id]` - Deletar

### Insights (IA)
- `POST /api/insights` - Gerar insights
- `GET /api/insights/[betId]` - Insights de uma bet específica

## 🚀 Deploy

### Vercel (Frontend + API)

1. Conecte seu repositório ao Vercel
2. Configure as variáveis de ambiente
3. Deploy automático a cada push

### Banco de Dados

Recomendado: [Neon](https://neon.tech) ou [Supabase](https://supabase.com)

```bash
# Após criar o banco, atualizar DATABASE_URL e rodar:
npx prisma db push
```

## 🎨 Customização

### Cores e Tema
O projeto usa TailwindCSS. Edite `tailwind.config.js` para personalizar cores.

### Componentes UI
Os componentes estão em `src/components/ui/` e podem ser customizados.

## 📝 Scripts Disponíveis

```bash
npm run dev          # Desenvolvimento
npm run build        # Build para produção
npm run start        # Iniciar produção
npm run lint         # Lint
npm run lint:fix     # Fix lint
npm run db:push      # Push schema para DB
npm run db:studio    # Abrir Prisma Studio
npm run db:generate  # Gerar Prisma Client
```

## 🔧 Troubleshooting

### Erro: "PrismaClient is unable to run"
```bash
npx prisma generate
```

### Erro: "Module not found: Can't resolve '@/prisma/generated/client'"
```bash
npm run db:generate
```

### Erro de autenticação
Verifique se `BETTER_AUTH_SECRET` está configurado (mínimo 32 caracteres)

## 📚 Próximos Passos

- [ ] Adicionar gráficos comparativos (Recharts)
- [ ] Implementar onboarding para novos clientes
- [ ] Sistema de notificações
- [ ] Exportação de relatórios (PDF)
- [ ] Dashboard com métricas avançadas
- [ ] API pública para integrações

## 🤝 Contribuindo

Este é um projeto privado. Para contribuir, entre em contato com o time de desenvolvimento.

## 📄 Licença

Todos os direitos reservados © 2025 Bets Comparator

## 🆘 Suporte

Para suporte, entre em contato através de: admin@betscomparator.com

---

**Desenvolvido com ❤️ usando Next.js e OpenAI**
