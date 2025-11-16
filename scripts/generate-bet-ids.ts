import { PrismaClient } from "../prisma/generated/client";

const prisma = new PrismaClient();

// Generate a random Bet ID like UF87F
function generateBetId(): string {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const letter1 = letters[Math.floor(Math.random() * letters.length)];
  const letter2 = letters[Math.floor(Math.random() * letters.length)];
  const num1 = numbers[Math.floor(Math.random() * numbers.length)];
  const num2 = numbers[Math.floor(Math.random() * numbers.length)];
  const letter3 = letters[Math.floor(Math.random() * letters.length)];
  return `${letter1}${letter2}${num1}${num2}${letter3}`;
}

async function generateBetIds() {
  try {
    console.log("Fetching bets without Bet ID...");
    
    // Get all bets that don't have a betId
    const betsWithoutId = await prisma.bet.findMany({
      where: {
        betId: null,
      },
      select: {
        id: true,
        name: true,
      },
    });

    console.log(`Found ${betsWithoutId.length} bets without Bet ID`);

    if (betsWithoutId.length === 0) {
      console.log("All bets already have Bet IDs!");
      return;
    }

    // Get all existing betIds to avoid duplicates
    const existingBetIds = await prisma.bet.findMany({
      where: {
        betId: {
          not: null,
        },
      },
      select: {
        betId: true,
      },
    });

    const existingIdsSet = new Set(
      existingBetIds.map((b) => b.betId).filter(Boolean) as string[]
    );

    console.log(`Found ${existingIdsSet.size} existing Bet IDs`);

    let successCount = 0;
    let errorCount = 0;

    for (const bet of betsWithoutId) {
      let attempts = 0;
      let newBetId: string | undefined;
      let isUnique = false;

      // Generate unique Bet ID (try up to 100 times)
      while (!isUnique && attempts < 100) {
        newBetId = generateBetId();
        if (!existingIdsSet.has(newBetId)) {
          isUnique = true;
          existingIdsSet.add(newBetId);
        }
        attempts++;
      }

      if (!isUnique || !newBetId) {
        console.error(`Failed to generate unique Bet ID for bet: ${bet.name} (${bet.id})`);
        errorCount++;
        continue;
      }

      try {
        await prisma.bet.update({
          where: { id: bet.id },
          data: { betId: newBetId },
        });
        console.log(`✓ Generated Bet ID "${newBetId}" for "${bet.name}"`);
        successCount++;
      } catch (error) {
        console.error(`✗ Failed to update bet "${bet.name}":`, error);
        errorCount++;
      }
    }

    console.log("\n=== Summary ===");
    console.log(`Total bets processed: ${betsWithoutId.length}`);
    console.log(`Successfully updated: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
  } catch (error) {
    console.error("Error generating Bet IDs:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

generateBetIds()
  .then(() => {
    console.log("\nDone!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });

