import { PrismaClient } from "../prisma/generated/client";
import { PARAMETER_DEFINITIONS } from "../src/lib/parameter-definitions";
import { Decimal } from "@prisma/client/runtime/library";

const prisma = new PrismaClient();

// Função para gerar valor aleatório baseado no tipo do parâmetro
function generateRandomValue(paramDef: typeof PARAMETER_DEFINITIONS[0]): {
  valueText?: string | null;
  valueNumber?: Decimal | null;
  valueBoolean?: boolean | null;
  valueRating?: number | null;
} {
  const type = paramDef.type;
  const result: {
    valueText?: string | null;
    valueNumber?: Decimal | null;
    valueBoolean?: boolean | null;
    valueRating?: number | null;
  } = {};

  switch (type) {
    case "boolean":
      // 70% chance de ser true, 30% de ser false
      result.valueBoolean = Math.random() > 0.3;
      break;

    case "rating":
      // Rating entre 3 e 5 estrelas (mais comum)
      result.valueRating = Math.floor(Math.random() * 3) + 3;
      break;

    case "currency":
      // Valores monetários realistas para apostas
      if (paramDef.name.includes("Mínimo")) {
        result.valueNumber = new Decimal((Math.random() * 50 + 10).toFixed(2)); // 10-60 R$
      } else if (paramDef.name.includes("Máximo")) {
        result.valueNumber = new Decimal((Math.random() * 50000 + 10000).toFixed(2)); // 10k-60k R$
      } else if (paramDef.name.includes("Cashback") || paramDef.name.includes("Bônus")) {
        result.valueNumber = new Decimal((Math.random() * 100 + 10).toFixed(2)); // 10-110 R$
      } else {
        result.valueNumber = new Decimal((Math.random() * 1000 + 50).toFixed(2)); // 50-1050 R$
      }
      break;

    case "percentage":
      // Percentuais entre 0 e 100
      result.valueNumber = new Decimal((Math.random() * 100).toFixed(2));
      break;

    case "number":
      // Números gerais
      if (paramDef.name.includes("Tempo") || paramDef.name.includes("Prazo")) {
        result.valueNumber = new Decimal(Math.floor(Math.random() * 48 + 1)); // 1-48 horas
      } else if (paramDef.name.includes("Versão") || paramDef.name.includes("Número")) {
        result.valueNumber = new Decimal(Math.floor(Math.random() * 10 + 1)); // 1-10
      } else {
        result.valueNumber = new Decimal((Math.random() * 1000).toFixed(2)); // 0-1000
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

async function main() {
  console.log("🌱 Starting to seed random parameters for all bets...");

  try {
    // Buscar todas as casas de apostas
    const bets = await prisma.bet.findMany({
      select: {
        id: true,
        name: true,
      },
    });

    console.log(`📊 Found ${bets.length} betting houses`);

    let totalParametersCreated = 0;
    let betsProcessed = 0;

    for (const bet of bets) {
      try {
        // Verificar se já tem parâmetros
        const existingParams = await prisma.parameter.count({
          where: { betId: bet.id },
        });

        // Se já tiver parâmetros, pular (ou você pode remover esta verificação para re-popular)
        if (existingParams > 0) {
          console.log(`⏭️  ${bet.name} already has ${existingParams} parameters, skipping...`);
          continue;
        }

        // Gerar parâmetros aleatórios para cada definição
        const parametersToCreate: Array<{
          betId: string;
          name: string;
          category: string;
          type: string;
          unit: string | null;
          description: string | null;
          options: string[];
          valueText?: string | null;
          valueNumber?: Decimal | number | null;
          valueBoolean?: boolean | null;
          valueRating?: number | null;
        }> = [];
        
        for (const paramDef of PARAMETER_DEFINITIONS) {
          // 80% de chance de criar o parâmetro (não todos, para parecer mais realista)
          if (Math.random() > 0.2) {
            const randomValue = generateRandomValue(paramDef);
            
            // Só criar se tiver pelo menos um valor
            if (
              randomValue.valueText !== undefined ||
              randomValue.valueNumber !== undefined ||
              randomValue.valueBoolean !== undefined ||
              randomValue.valueRating !== undefined
            ) {
              const paramToCreate: {
                betId: string;
                name: string;
                category: string;
                type: string;
                unit: string | null;
                description: string | null;
                options: string[];
                valueText?: string | null;
                valueNumber?: Decimal | null;
                valueBoolean?: boolean | null;
                valueRating?: number | null;
              } = {
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

          // Criar histórico para cada parâmetro
          const createdParams = await prisma.parameter.findMany({
            where: {
              betId: bet.id,
              name: { in: parametersToCreate.map((p) => p.name) },
            },
          });

          const historyPromises = createdParams.map((param) => {
            const paramData = parametersToCreate.find((p) => p.name === param.name) || null;
            if (!paramData) return null;

            return prisma.parameterHistory.create({
              data: {
                parameterId: param.id,
                valueText: paramData.valueText || null,
                valueNumber: paramData.valueNumber || null,
                valueBoolean: paramData.valueBoolean || null,
                valueRating: paramData.valueRating || null,
                notes: "Valor inicial gerado automaticamente",
              },
            });
          });

          await Promise.all(historyPromises.filter(Boolean));

          totalParametersCreated += parametersToCreate.length;
          betsProcessed++;
          
          console.log(`✅ ${bet.name}: Created ${parametersToCreate.length} parameters`);
        }
      } catch (error) {
        console.error(`❌ Error processing ${bet.name}:`, error);
      }
    }

    console.log(`\n✅ Completed!`);
    console.log(`📊 Processed ${betsProcessed} betting houses`);
    console.log(`📝 Created ${totalParametersCreated} total parameters`);
  } catch (error) {
    console.error("❌ Error seeding parameters:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

