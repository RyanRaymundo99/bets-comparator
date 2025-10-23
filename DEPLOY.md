# BS Market - Deploy no Vercel

## 🚀 Deploy Rápido

### 1. Preparação do Banco de Dados

**Opção 1: Neon Database (Recomendado)**
1. Acesse [neon.tech](https://neon.tech)
2. Crie uma nova conta e projeto
3. Copie a string de conexão PostgreSQL
4. Use no Vercel como `DATABASE_URL`

**Opção 2: Supabase**
1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Vá em Settings > Database
4. Copie a connection string

### 2. Deploy no Vercel

#### Método 1: Deploy via GitHub (Recomendado)
1. Faça push do código para GitHub
2. Acesse [vercel.com](https://vercel.com)
3. Conecte sua conta GitHub
4. Importe o repositório BS Market
5. Configure as variáveis de ambiente
6. Deploy automático!

#### Método 2: Deploy via Vercel CLI
```bash
npm i -g vercel
vercel login
vercel --prod
```

### 3. Variáveis de Ambiente Obrigatórias

Configure estas variáveis no painel do Vercel:

#### 🔑 Essenciais
```env
DATABASE_URL="postgresql://user:pass@host:port/db"
BETTER_AUTH_SECRET="seu-secret-minimo-32-caracteres"
BETTER_AUTH_URL="https://seu-dominio.vercel.app"
NEXT_PUBLIC_BASE_URL="https://seu-dominio.vercel.app"
```

#### 📧 Email (Recomendado: Resend)
```env
RESEND_API_KEY="re_sua-chave-resend"
FROM_EMAIL="noreply@seu-dominio.com"
```

#### 💰 Pagamentos (Mercado Pago)
```env
MERCADO_PAGO_ACCESS_TOKEN="APP_USR-sua-chave"
MERCADO_PAGO_PUBLIC_KEY="sua-chave-publica"
MERCADO_PAGO_PIX_KEY="sua-chave-pix"
DEMO_MODE=false
```

#### 🪙 Crypto (Binance)
```env
BINANCE_API_KEY="sua-chave-binance"
BINANCE_SECRET_KEY="seu-secret-binance"
BINANCE_TESTNET=false
```

#### 📱 SMS (Opcional)
```env
TEXTBELT_API_KEY="textbelt"
```

### 4. Pós-Deploy

#### Configurar Banco de Dados
```bash
# Após o deploy, execute no terminal do Vercel:
npx prisma db push
```

#### Criar Admin
1. Acesse `/admin/login`
2. Use as credenciais padrão ou crie via API
3. Configure 2FA se necessário

### 5. Domínio Personalizado

1. No painel do Vercel, vá em Settings > Domains
2. Adicione seu domínio personalizado
3. Configure DNS conforme instruções
4. Atualize `BETTER_AUTH_URL` e `NEXT_PUBLIC_BASE_URL`

### 6. Monitoramento

#### Logs
- Acesse Vercel Dashboard > Functions
- Monitore logs em tempo real
- Configure alertas para erros

#### Performance
- Use Vercel Analytics
- Configure Web Vitals
- Monitore Core Web Vitals

### 7. Backup e Segurança

#### Backup do Banco
```bash
# Backup automático (Neon/Supabase)
# Configure backup automático no painel
```

#### Segurança
- ✅ HTTPS automático
- ✅ Headers de segurança configurados
- ✅ Middleware de autenticação
- ✅ Validação de entrada
- ✅ Rate limiting (Vercel Pro)

### 8. Troubleshooting

#### Erro de Build
```bash
# Verifique logs no Vercel Dashboard
# Teste build local: npm run build
```

#### Erro de Banco
```bash
# Verifique DATABASE_URL
# Teste conexão: npx prisma db push
```

#### Erro de Auth
```bash
# Verifique BETTER_AUTH_SECRET
# Verifique BETTER_AUTH_URL
```

### 9. Otimizações de Produção

#### Performance
- ✅ Next.js 15 com otimizações
- ✅ Image optimization
- ✅ Bundle splitting
- ✅ Tree shaking

#### SEO
- ✅ Meta tags dinâmicas
- ✅ Sitemap automático
- ✅ Robots.txt

#### Analytics
- ✅ Vercel Analytics
- ✅ Core Web Vitals
- ✅ Performance monitoring

## 📞 Suporte

Para problemas específicos:
1. Verifique logs no Vercel Dashboard
2. Teste localmente primeiro
3. Consulte documentação do Vercel
4. Verifique status do serviço

## 🎯 Checklist de Deploy

- [ ] Banco de dados configurado
- [ ] Variáveis de ambiente definidas
- [ ] Build local funcionando
- [ ] Deploy realizado
- [ ] Banco sincronizado (`prisma db push`)
- [ ] Admin criado
- [ ] Domínio configurado
- [ ] SSL funcionando
- [ ] Testes básicos realizados

---

**BS Market** - Plataforma de Trading Crypto 🚀
