/* eslint-disable @typescript-eslint/no-require-imports */
import * as fs from "fs";
import * as path from "path";

// Carregar variáveis de ambiente do .env ANTES de importar Prisma
function loadEnv() {
  const envFiles = [".env.local", ".env"];
  let loaded = false;
  
  for (const fileName of envFiles) {
    const envPath = path.join(process.cwd(), fileName);
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, "utf-8");
      envContent.split("\n").forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) return;
        const match = trimmed.match(/^([^=]+)=(.*)$/);
        if (match && !process.env[match[1]]) {
          process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
        }
      });
      console.log(`✓ Variáveis de ambiente carregadas de ${fileName}`);
      loaded = true;
      break;
    }
  }
  
  if (!loaded) {
    console.log("⚠️  Nenhum arquivo .env encontrado");
  }
}

loadEnv();

// Importar dinamicamente após carregar as variáveis de ambiente
async function run() {
  const { PrismaClient, Prisma } = require("../prisma/generated/client");
  const { PrismaPg } = require("@prisma/adapter-pg");
  const { Pool } = require("pg");
  const { PARAMETER_DEFINITIONS } = require("../src/lib/parameter-definitions");

  // Verificar DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL não está definida no arquivo .env");
    process.exit(1);
  }

  console.log("✓ Conectando ao banco de dados...");

  // Criar pool de conexão PostgreSQL
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  // Criar adapter
  const adapter = new PrismaPg(pool);

  // Inicializar PrismaClient com adapter
  const prisma = new PrismaClient({ adapter });

  const Decimal = Prisma.Decimal;

  type DecimalType = typeof Prisma.Decimal;

  // Função para gerar valor aleatório baseado no tipo do parâmetro
  function generateRandomValue(paramDef: {
    name: string;
    type: string;
    options?: string[];
  }): {
    valueText?: string | null;
    valueNumber?: DecimalType | null;
    valueBoolean?: boolean | null;
    valueRating?: number | null;
  } {
    const type = paramDef.type;
    const result: {
      valueText?: string | null;
      valueNumber?: DecimalType | null;
      valueBoolean?: boolean | null;
      valueRating?: number | null;
    } = {};

    switch (type) {
      case "boolean":
        // 70% chance de ser true, 30% de ser false
        result.valueBoolean = Math.random() > 0.3;
        break;

      case "rating":
        // Rating entre 2 e 5 estrelas
        result.valueRating = Math.floor(Math.random() * 4) + 2;
        break;

      case "currency":
        // Valores monetários realistas para apostas
        if (paramDef.name.includes("Mínimo")) {
          result.valueNumber = new Decimal((Math.random() * 50 + 5).toFixed(2));
        } else if (paramDef.name.includes("Máximo")) {
          result.valueNumber = new Decimal((Math.random() * 50000 + 10000).toFixed(2));
        } else if (paramDef.name.includes("Cashback") || paramDef.name.includes("Bônus")) {
          result.valueNumber = new Decimal((Math.random() * 500 + 50).toFixed(2));
        } else {
          result.valueNumber = new Decimal((Math.random() * 1000 + 100).toFixed(2));
        }
        break;

      case "percentage":
        // Percentuais entre 5 e 100
        result.valueNumber = new Decimal((Math.random() * 95 + 5).toFixed(2));
        break;

      case "number":
        // Números gerais
        if (paramDef.name.includes("Tempo") || paramDef.name.includes("Prazo")) {
          result.valueNumber = new Decimal(Math.floor(Math.random() * 48 + 1));
        } else if (paramDef.name.includes("Versão") || paramDef.name.includes("Número")) {
          result.valueNumber = new Decimal(Math.floor(Math.random() * 10 + 1));
        } else {
          result.valueNumber = new Decimal((Math.random() * 1000).toFixed(2));
        }
        break;

      case "select":
        // Escolhe uma opção aleatória
        if (paramDef.options && paramDef.options.length > 0) {
          const randomOption = paramDef.options[Math.floor(Math.random() * paramDef.options.length)];
          result.valueText = randomOption;
        }
        break;

      case "text":
        // Textos aleatórios baseados no nome do parâmetro
        if (paramDef.name.includes("Modelo")) {
          result.valueText = ["CPA", "Revshare", "Híbrido", "CPA + Revshare"][Math.floor(Math.random() * 4)];
        } else if (paramDef.name.includes("Melhorias")) {
          result.valueText = ["Interface mais intuitiva", "Melhor responsividade mobile", "Navegação otimizada", "Design moderno"][Math.floor(Math.random() * 4)];
        } else if (paramDef.name.includes("URL") || paramDef.name.includes("Link")) {
          result.valueText = `https://exemplo.${paramDef.name.toLowerCase().replace(/\s+/g, "")}.com`;
        } else {
          result.valueText = `Valor exemplo para ${paramDef.name}`;
        }
        break;

      default:
        // Por padrão, tenta texto
        result.valueText = "Não especificado";
    }

    return result;
  }

  console.log("🌱 Forçando criação de parâmetros para todas as casas de apostas...\n");

  try {
    // Buscar todas as casas de apostas
    const bets = await prisma.bet.findMany({
      select: {
        id: true,
        name: true,
      },
    });

    console.log(`📊 Encontradas ${bets.length} casas de apostas\n`);

    if (bets.length === 0) {
      console.log("❌ Nenhuma casa de apostas encontrada. Crie casas primeiro no painel admin.");
      return;
    }

    let totalParametersCreated = 0;
    let totalParametersUpdated = 0;

    for (const bet of bets) {
      console.log(`\n🏠 Processando: ${bet.name}`);
      
      try {
        // Deletar parâmetros existentes para esta casa
        const deleted = await prisma.parameter.deleteMany({
          where: { betId: bet.id },
        });
        
        if (deleted.count > 0) {
          console.log(`   🗑️  Removidos ${deleted.count} parâmetros antigos`);
          totalParametersUpdated += deleted.count;
        }

        // Gerar novos parâmetros para cada definição
        const parametersToCreate: Array<{
          betId: string;
          name: string;
          category: string;
          type: string;
          unit: string | null;
          description: string | null;
          options: string[];
          valueText?: string | null;
          valueNumber?: DecimalType | number | null;
          valueBoolean?: boolean | null;
          valueRating?: number | null;
        }> = [];
        
        for (const paramDef of PARAMETER_DEFINITIONS) {
          // 90% de chance de criar o parâmetro (para garantir dados suficientes)
          if (Math.random() > 0.1) {
            const randomValue = generateRandomValue(paramDef);
            
            // Só criar se tiver pelo menos um valor
            if (
              randomValue.valueText !== undefined ||
              randomValue.valueNumber !== undefined ||
              randomValue.valueBoolean !== undefined ||
              randomValue.valueRating !== undefined
            ) {
              const paramToCreate = {
                betId: bet.id,
                name: paramDef.name,
                category: paramDef.category,
                type: paramDef.type,
                unit: paramDef.unit || null,
                description: paramDef.description || null,
                options: paramDef.options || [],
                ...randomValue,
              };
              parametersToCreate.push(paramToCreate);
            }
          }
        }

        // Criar parâmetros em batch
        if (parametersToCreate.length > 0) {
          await prisma.parameter.createMany({
            data: parametersToCreate,
            skipDuplicates: true,
          });

          totalParametersCreated += parametersToCreate.length;
          
          console.log(`   ✅ Criados ${parametersToCreate.length} parâmetros`);
          
          // Mostrar amostra de categorias criadas
          const categories = [...new Set(parametersToCreate.map((p: { category: string }) => p.category))];
          console.log(`   📂 Categorias: ${categories.join(", ")}`);
        }
      } catch (error) {
        console.error(`   ❌ Erro:`, error);
      }
    }

    console.log(`\n${"=".repeat(50)}`);
    console.log(`✅ Processo concluído!`);
    console.log(`📊 Casas processadas: ${bets.length}`);
    console.log(`📝 Parâmetros criados: ${totalParametersCreated}`);
    if (totalParametersUpdated > 0) {
      console.log(`🔄 Parâmetros atualizados: ${totalParametersUpdated}`);
    }
    console.log(`${"=".repeat(50)}\n`);
    
    console.log("🔄 Agora você pode recarregar a página de comparação para ver o gráfico funcionando!");
  } catch (error) {
    console.error("❌ Erro ao popular parâmetros:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
