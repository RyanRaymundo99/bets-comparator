import { PrismaClient } from '../../prisma/generated/client'

// Import Decimal - using require to avoid module resolution issues
let Decimal: any;
try {
  const DecimalModule = require('../../prisma/generated/client/runtime/library.js');
  Decimal = DecimalModule.Decimal;
} catch (e) {
  // Fallback: try importing from the default export
  const DecimalModule = require('../../prisma/generated/client/runtime/library');
  Decimal = DecimalModule.Decimal || DecimalModule;
}

const prismaClientSingleton = () => {
  return new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
  });
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

// Export Decimal for use in API routes
export { Decimal };

// Ensure the prisma instance is reused across hot reloads in development
if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;