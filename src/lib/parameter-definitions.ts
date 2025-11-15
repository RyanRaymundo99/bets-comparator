// Parameter definitions extracted from Excel spreadsheet
// This file contains all parameter categories, types, and options

export const PARAMETER_CATEGORIES = [
  "Informações Básicas",
  "Plataforma",
  "Cashback",
  "Pagamentos",
  "Torneios",
  "Fidelidade e Gamificação",
  "Marketing e Tráfego",
  "Social Media",
  "Reputação",
  "CRM e Promoções",
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
  // ===== INFORMAÇÕES BÁSICAS =====
  {
    name: "Status",
    category: "Informações Básicas",
    type: "select",
    options: [
      "Funcionando",
      "Fora do ar",
      "Redirect Pro Principal",
      "Anunciado pra entrar no Ar",
      "A definir",
    ],
  },
  {
    name: "Abrangência",
    category: "Informações Básicas",
    type: "select",
    options: ["Brasil", "Mundial"],
    description: "Só Brasil ou + Países",
  },
  {
    name: "Tipo de Plataforma",
    category: "Informações Básicas",
    type: "select",
    options: ["Casino", "Sports", "Ambos"],
    description: "Capa Principal",
  },

  // ===== PLATAFORMA =====
  {
    name: "KYC",
    category: "Plataforma",
    type: "select",
    options: ["Single", "Registro", "Depósito", "Não"],
  },
  {
    name: "Login pelo Google",
    category: "Plataforma",
    type: "boolean",
  },
  {
    name: "Afiliação pelo Site",
    category: "Plataforma",
    type: "boolean",
  },
  {
    name: "Modelo Afiliação",
    category: "Plataforma",
    type: "text",
  },
  {
    name: "Depósito Mínimo",
    category: "Plataforma",
    type: "currency",
    unit: "R$",
  },
  {
    name: "Saque Máximo",
    category: "Plataforma",
    type: "currency",
    unit: "R$",
  },
  {
    name: "Aceita Crypto",
    category: "Plataforma",
    type: "boolean",
  },
  {
    name: "Usabilidade Plataforma",
    category: "Plataforma",
    type: "rating",
    min: 0,
    max: 5,
    description: "Avaliação em estrelas",
  },
  {
    name: "Melhorias Usabilidade",
    category: "Plataforma",
    type: "text",
  },
  {
    name: "Layout Plataforma",
    category: "Plataforma",
    type: "rating",
    min: 0,
    max: 5,
  },
  {
    name: "Melhorias Layout",
    category: "Plataforma",
    type: "text",
  },
  {
    name: "Tem Aplicativo",
    category: "Plataforma",
    type: "boolean",
  },
  {
    name: "Multi Slots Simultâneos",
    category: "Plataforma",
    type: "boolean",
  },

  // ===== CASHBACK =====
  {
    name: "Cashback Casino",
    category: "Cashback",
    type: "boolean",
  },
  {
    name: "Nota Cashback Casino",
    category: "Cashback",
    type: "rating",
    min: 0,
    max: 5,
  },
  {
    name: "Melhorias Cashback Casino",
    category: "Cashback",
    type: "text",
  },
  {
    name: "Cashback Sports",
    category: "Cashback",
    type: "boolean",
  },
  {
    name: "Nota Cashback Sports",
    category: "Cashback",
    type: "rating",
    min: 0,
    max: 5,
  },
  {
    name: "Melhorias Cashback Sports",
    category: "Cashback",
    type: "text",
  },

  // ===== PAGAMENTOS =====
  {
    name: "Pagamento Antecipado Esportes",
    category: "Pagamentos",
    type: "boolean",
  },
  {
    name: "Descrição Pagamento Antecipado",
    category: "Pagamentos",
    type: "text",
  },
  {
    name: "Cashout",
    category: "Pagamentos",
    type: "boolean",
  },

  // ===== TORNEIOS =====
  {
    name: "Torneios Casino",
    category: "Torneios",
    type: "boolean",
  },
  {
    name: "Descrição Torneios Casino",
    category: "Torneios",
    type: "text",
  },
  {
    name: "Nota Torneios Casino",
    category: "Torneios",
    type: "rating",
    min: 0,
    max: 5,
  },
  {
    name: "Melhorias Torneios Casino",
    category: "Torneios",
    type: "text",
  },
  {
    name: "Torneio Casino ao Vivo",
    category: "Torneios",
    type: "boolean",
  },
  {
    name: "Descrição Torneio Casino Vivo",
    category: "Torneios",
    type: "text",
  },
  {
    name: "Nota Torneio Casino Vivo",
    category: "Torneios",
    type: "rating",
    min: 0,
    max: 5,
  },
  {
    name: "Melhorias Torneio Casino Vivo",
    category: "Torneios",
    type: "text",
  },
  {
    name: "Torneio Esportes",
    category: "Torneios",
    type: "boolean",
  },
  {
    name: "Descrição Torneio Esportes",
    category: "Torneios",
    type: "text",
  },
  {
    name: "Nota Torneio Esportes",
    category: "Torneios",
    type: "rating",
    min: 0,
    max: 5,
  },
  {
    name: "Melhorias Torneio Esportes",
    category: "Torneios",
    type: "text",
  },

  // ===== FIDELIDADE E GAMIFICAÇÃO =====
  {
    name: "Programa Fidelidade",
    category: "Fidelidade e Gamificação",
    type: "boolean",
  },
  {
    name: "Vantagens Fidelidade",
    category: "Fidelidade e Gamificação",
    type: "text",
  },
  {
    name: "Nota Fidelidade",
    category: "Fidelidade e Gamificação",
    type: "rating",
    min: 0,
    max: 5,
  },
  {
    name: "Melhorias Fidelidade",
    category: "Fidelidade e Gamificação",
    type: "text",
  },
  {
    name: "Loja",
    category: "Fidelidade e Gamificação",
    type: "text",
  },
  {
    name: "Descrição Loja",
    category: "Fidelidade e Gamificação",
    type: "text",
  },
  {
    name: "Nota Loja",
    category: "Fidelidade e Gamificação",
    type: "rating",
    min: 0,
    max: 5,
  },
  {
    name: "Melhorias Loja",
    category: "Fidelidade e Gamificação",
    type: "text",
  },
  {
    name: "Missões",
    category: "Fidelidade e Gamificação",
    type: "boolean",
  },
  {
    name: "Descrição Missões",
    category: "Fidelidade e Gamificação",
    type: "text",
  },
  {
    name: "Nota Missões",
    category: "Fidelidade e Gamificação",
    type: "rating",
    min: 0,
    max: 5,
  },
  {
    name: "Melhorias Missões",
    category: "Fidelidade e Gamificação",
    type: "text",
  },
  {
    name: "Indique um Amigo",
    category: "Fidelidade e Gamificação",
    type: "boolean",
  },
  {
    name: "Descrição Indique Amigo",
    category: "Fidelidade e Gamificação",
    type: "text",
  },
  {
    name: "Promoções",
    category: "Fidelidade e Gamificação",
    type: "boolean",
  },
  {
    name: "Bolão",
    category: "Fidelidade e Gamificação",
    type: "boolean",
  },
  {
    name: "Descrição Bolão",
    category: "Fidelidade e Gamificação",
    type: "text",
  },
  {
    name: "Nota Bolão",
    category: "Fidelidade e Gamificação",
    type: "rating",
    min: 0,
    max: 5,
  },
  {
    name: "Melhorias Bolão",
    category: "Fidelidade e Gamificação",
    type: "text",
  },
  {
    name: "Gamificação",
    category: "Fidelidade e Gamificação",
    type: "boolean",
  },
  {
    name: "Raspadinha",
    category: "Fidelidade e Gamificação",
    type: "boolean",
  },
  {
    name: "Descrição Raspadinha",
    category: "Fidelidade e Gamificação",
    type: "text",
  },
  {
    name: "Nota Raspadinha",
    category: "Fidelidade e Gamificação",
    type: "rating",
    min: 0,
    max: 5,
  },
  {
    name: "Melhorias Raspadinha",
    category: "Fidelidade e Gamificação",
    type: "text",
  },
  {
    name: "Roleta Premiada",
    category: "Fidelidade e Gamificação",
    type: "boolean",
  },
  {
    name: "Descrição Roleta Premiada",
    category: "Fidelidade e Gamificação",
    type: "text",
  },
  {
    name: "Nota Roleta Premiada",
    category: "Fidelidade e Gamificação",
    type: "rating",
    min: 0,
    max: 5,
  },
  {
    name: "Melhorias Roleta Premiada",
    category: "Fidelidade e Gamificação",
    type: "text",
  },

  // ===== MARKETING E TRÁFEGO =====
  {
    name: "Acessos Mês",
    category: "Marketing e Tráfego",
    type: "number",
  },
  {
    name: "Usuários Únicos Mês",
    category: "Marketing e Tráfego",
    type: "number",
  },
  {
    name: "Tempo Médio no Site",
    category: "Marketing e Tráfego",
    type: "text",
    description: "Formato: mm'ss",
  },
  {
    name: "Ranking Acessos",
    category: "Marketing e Tráfego",
    type: "text",
    description: "Posição no ranking (ex: 30°)",
  },
  {
    name: "Tráfego Mês",
    category: "Marketing e Tráfego",
    type: "currency",
    unit: "R$",
  },
  {
    name: "Principais Canais",
    category: "Marketing e Tráfego",
    type: "text",
    description: "Ex: Google/Meta",
  },
  {
    name: "Bounce Rate",
    category: "Marketing e Tráfego",
    type: "percentage",
    unit: "%",
  },
  {
    name: "Garoto(a) Propaganda",
    category: "Marketing e Tráfego",
    type: "text",
  },
  {
    name: "Patrocínio de Times",
    category: "Marketing e Tráfego",
    type: "text",
  },

  // ===== SOCIAL MEDIA =====
  {
    name: "Seguidores Instagram",
    category: "Social Media",
    type: "text",
    description: "Ex: 120 mil Seguidores",
  },
  {
    name: "Canal Telegram",
    category: "Social Media",
    type: "boolean",
  },
  {
    name: "Canal WhatsApp",
    category: "Social Media",
    type: "boolean",
  },

  // ===== REPUTAÇÃO =====
  {
    name: "Nota Reclame Aqui",
    category: "Reputação",
    type: "text",
    description: "Ex: 8.9/10",
  },
  {
    name: "Nota Final",
    category: "Reputação",
    type: "rating",
    min: 0,
    max: 5,
  },
  {
    name: "Melhorias Gerais",
    category: "Reputação",
    type: "text",
  },

  // ===== CRM E PROMOÇÕES =====
  {
    name: "CRM Canais",
    category: "CRM e Promoções",
    type: "text",
  },
  {
    name: "CRM Frequência",
    category: "CRM e Promoções",
    type: "text",
  },
  {
    name: "Principais Ofertas",
    category: "CRM e Promoções",
    type: "text",
  },
  {
    name: "Campanha Semana",
    category: "CRM e Promoções",
    type: "text",
  },
  {
    name: "Diferenciais",
    category: "CRM e Promoções",
    type: "text",
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

// All status options
export const STATUS_OPTIONS = [
  "Funcionando",
  "Fora do ar",
  "Redirect Pro Principal",
  "Anunciado pra entrar no Ar",
  "A definir",
] as const;

// All platform type options
export const PLATFORM_TYPE_OPTIONS = ["Casino", "Sports", "Ambos"] as const;

// All KYC options
export const KYC_OPTIONS = ["Single", "Registro", "Depósito", "Não"] as const;

// All scope options
export const SCOPE_OPTIONS = ["Brasil", "Mundial"] as const;
