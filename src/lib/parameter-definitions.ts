// Parameter definitions with new 8-category structure
// This file contains all parameter categories, types, and options

export const PARAMETER_CATEGORIES = [
  "Mercado e Acesso",
  "Pagamentos & Financeiro",
  "Plataforma & Experiência do Usuário",
  "Produtos & Entretenimento",
  "Gamificação & Fidelização",
  "Marketing & Comunidade",
  "Tráfego & Performance",
  "CRM",
] as const;

export type ParameterCategory = (typeof PARAMETER_CATEGORIES)[number];

export interface ParameterDefinition {
  name: string;
  category: ParameterCategory;
  type:
    | "text"
    | "number"
    | "currency"
    | "percentage"
    | "boolean"
    | "rating"
    | "select";
  unit?: string;
  options?: string[]; // For select type
  description?: string;
  min?: number;
  max?: number;
}

export const PARAMETER_DEFINITIONS: ParameterDefinition[] = [
  // ===== 1. MERCADO E ACESSO =====
  {
    name: "Só Brasil ou + países",
    category: "Mercado e Acesso",
    type: "select",
    options: ["Brasil", "Mundial"],
  },
  {
    name: "KYC",
    category: "Mercado e Acesso",
    type: "select",
    options: ["Registro", "Depósito", "Na hora de jogar", "Não"],
    description: "KYC (Registro, Deposito ou na hora de jogar)",
  },
  {
    name: "Login pelo Google",
    category: "Mercado e Acesso",
    type: "boolean",
  },
  {
    name: "Tem aplicativo",
    category: "Mercado e Acesso",
    type: "boolean",
  },

  // ===== 2. PAGAMENTOS & FINANCEIRO =====
  {
    name: "Saque mínimo",
    category: "Pagamentos & Financeiro",
    type: "currency",
    unit: "R$",
  },
  {
    name: "Depósito mínimo",
    category: "Pagamentos & Financeiro",
    type: "currency",
    unit: "R$",
  },
  {
    name: "Saque máximo",
    category: "Pagamentos & Financeiro",
    type: "currency",
    unit: "R$",
  },
  {
    name: "Aceita Crypto",
    category: "Pagamentos & Financeiro",
    type: "boolean",
  },
  {
    name: "Pagamento instantâneo",
    category: "Pagamentos & Financeiro",
    type: "boolean",
  },

  // ===== 3. PLATAFORMA & EXPERIÊNCIA DO USUÁRIO =====
  {
    name: "Plataforma",
    category: "Plataforma & Experiência do Usuário",
    type: "text",
    description: "Fornecedor",
  },
  {
    name: "Usabilidade",
    category: "Plataforma & Experiência do Usuário",
    type: "rating",
    min: 0,
    max: 5,
    description: "Nota",
  },
  {
    name: "Layout",
    category: "Plataforma & Experiência do Usuário",
    type: "rating",
    min: 0,
    max: 5,
    description: "Nota",
  },
  {
    name: "Multi Slots simultâneos",
    category: "Plataforma & Experiência do Usuário",
    type: "boolean",
  },
  {
    name: "Tempo médio no site",
    category: "Plataforma & Experiência do Usuário",
    type: "text",
    description: "Formato: mm'ss",
  },
  {
    name: "Melhorias necessárias (UX/UI)",
    category: "Plataforma & Experiência do Usuário",
    type: "text",
  },
  {
    name: "Melhorias necessárias (Performance)",
    category: "Plataforma & Experiência do Usuário",
    type: "text",
  },

  // ===== 4. PRODUTOS & ENTRETENIMENTO =====
  {
    name: "Torneio de cassino",
    category: "Produtos & Entretenimento",
    type: "rating",
    min: 0,
    max: 5,
    description: "Nota",
  },
  {
    name: "Descrição Torneio de cassino",
    category: "Produtos & Entretenimento",
    type: "text",
  },
  {
    name: "Torneio ao vivo",
    category: "Produtos & Entretenimento",
    type: "rating",
    min: 0,
    max: 5,
    description: "Nota",
  },
  {
    name: "Descrição Torneio ao vivo",
    category: "Produtos & Entretenimento",
    type: "text",
  },
  {
    name: "Torneio esportivo",
    category: "Produtos & Entretenimento",
    type: "rating",
    min: 0,
    max: 5,
    description: "Nota",
  },
  {
    name: "Descrição Torneio esportivo",
    category: "Produtos & Entretenimento",
    type: "text",
  },
  {
    name: "Cashback",
    category: "Produtos & Entretenimento",
    type: "rating",
    min: 0,
    max: 5,
    description: "Nota",
  },
  {
    name: "Descrição Cashback",
    category: "Produtos & Entretenimento",
    type: "text",
  },
  {
    name: "Pagamento antecipado",
    category: "Produtos & Entretenimento",
    type: "boolean",
  },
  {
    name: "Indique um amigo",
    category: "Produtos & Entretenimento",
    type: "rating",
    min: 0,
    max: 5,
    description: "Nota",
  },
  {
    name: "Descrição Indique um amigo",
    category: "Produtos & Entretenimento",
    type: "text",
  },
  {
    name: "Afiliação pelo site",
    category: "Produtos & Entretenimento",
    type: "boolean",
  },
  {
    name: "Modelo de afiliação",
    category: "Produtos & Entretenimento",
    type: "text",
  },

  // ===== 5. GAMIFICAÇÃO & FIDELIZAÇÃO =====
  {
    name: "Programa de fidelidade",
    category: "Gamificação & Fidelização",
    type: "rating",
    min: 0,
    max: 5,
    description: "Nota",
  },
  {
    name: "Vantagens Programa de fidelidade",
    category: "Gamificação & Fidelização",
    type: "text",
  },
  {
    name: "Missões",
    category: "Gamificação & Fidelização",
    type: "rating",
    min: 0,
    max: 5,
    description: "Nota",
  },
  {
    name: "Descrição Missões",
    category: "Gamificação & Fidelização",
    type: "text",
  },
  {
    name: "Raspadinha",
    category: "Gamificação & Fidelização",
    type: "rating",
    min: 0,
    max: 5,
    description: "Nota",
  },
  {
    name: "Descrição Raspadinha",
    category: "Gamificação & Fidelização",
    type: "text",
  },
  {
    name: "Bolão",
    category: "Gamificação & Fidelização",
    type: "rating",
    min: 0,
    max: 5,
    description: "Nota",
  },
  {
    name: "Descrição Bolão",
    category: "Gamificação & Fidelização",
    type: "text",
  },
  {
    name: "Quiz",
    category: "Gamificação & Fidelização",
    type: "rating",
    min: 0,
    max: 5,
    description: "Nota",
  },
  {
    name: "Descrição Quiz",
    category: "Gamificação & Fidelização",
    type: "text",
  },
  {
    name: "Roleta premiada",
    category: "Gamificação & Fidelização",
    type: "rating",
    min: 0,
    max: 5,
    description: "Nota",
  },
  {
    name: "Descrição Roleta premiada",
    category: "Gamificação & Fidelização",
    type: "text",
  },
  {
    name: "Loja / Store",
    category: "Gamificação & Fidelização",
    type: "rating",
    min: 0,
    max: 5,
    description: "Nota",
  },
  {
    name: "Descrição Loja / Store",
    category: "Gamificação & Fidelização",
    type: "text",
  },

  // ===== 6. MARKETING & COMUNIDADE =====
  {
    name: "Instagram",
    category: "Marketing & Comunidade",
    type: "text",
    description: "N° Seguidores",
  },
  {
    name: "Canal Telegram",
    category: "Marketing & Comunidade",
    type: "text",
    description: "N° Seguidores",
  },
  {
    name: "Canal WhatsApp",
    category: "Marketing & Comunidade",
    type: "text",
    description: "N° Seguidores",
  },
  {
    name: "Garoto(a) propaganda",
    category: "Marketing & Comunidade",
    type: "text",
  },
  {
    name: "Patrocínio de times",
    category: "Marketing & Comunidade",
    type: "text",
  },
  {
    name: "Promoções Macros",
    category: "Marketing & Comunidade",
    type: "text",
  },
  {
    name: "Campanha da semana",
    category: "Marketing & Comunidade",
    type: "text",
  },
  {
    name: "Nota Reclame Aqui",
    category: "Marketing & Comunidade",
    type: "text",
    description: "Ex: 8.9/10",
  },

  // ===== 7. TRÁFEGO & PERFORMANCE =====
  {
    name: "Acessos por mês",
    category: "Tráfego & Performance",
    type: "number",
  },
  {
    name: "Tráfego mensal",
    category: "Tráfego & Performance",
    type: "currency",
    unit: "R$",
  },
  {
    name: "Principais canais de aquisição",
    category: "Tráfego & Performance",
    type: "text",
    description: "Ex: Google/Meta",
  },
  {
    name: "Bounce rate",
    category: "Tráfego & Performance",
    type: "percentage",
    unit: "%",
  },
  {
    name: "Tempo médio no site",
    category: "Tráfego & Performance",
    type: "text",
    description: "Formato: mm'ss",
  },

  // ===== 8. CRM =====
  {
    name: "CRM Canais",
    category: "CRM",
    type: "text",
  },
  {
    name: "CRM Frequência",
    category: "CRM",
    type: "text",
  },
  {
    name: "Principais ofertas",
    category: "CRM",
    type: "text",
    description: "Conectar com Produtos & Entretenimento",
  },
];

// Helper to get parameters by category
export function getParametersByCategory(category: ParameterCategory) {
  return PARAMETER_DEFINITIONS.filter((p) => p.category === category);
}

// Helper to get parameter definition by name
export function getParameterDefinition(name: string) {
  return PARAMETER_DEFINITIONS.find((p) => p.name === name);
}

// All status options (kept for backward compatibility)
export const STATUS_OPTIONS = [
  "Funcionando",
  "Fora do ar",
  "Redirect Pro Principal",
  "Anunciado pra entrar no Ar",
  "A definir",
] as const;

// All platform type options (kept for backward compatibility)
export const PLATFORM_TYPE_OPTIONS = ["Casino", "Sports", "Ambos"] as const;

// All KYC options
export const KYC_OPTIONS = ["Registro", "Depósito", "Na hora de jogar", "Não"] as const;

// All scope options
export const SCOPE_OPTIONS = ["Brasil", "Mundial"] as const;
