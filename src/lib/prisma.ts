import { PrismaClient } from '../../prisma/generated/client'
import type { Decimal as DecimalType } from '../../prisma/generated/client/runtime/library'

// Import Decimal dynamically to avoid module resolution issues
let Decimal: typeof DecimalType;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const DecimalModule = require('../../prisma/generated/client/runtime/library.js') as { Decimal: typeof DecimalType };
  Decimal = DecimalModule.Decimal;
} catch {
  // Fallback: try importing from the default export
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const DecimalModule = require('../../prisma/generated/client/runtime/library') as { Decimal: typeof DecimalType } | typeof DecimalType;
  Decimal = (DecimalModule as { Decimal: typeof DecimalType }).Decimal || (DecimalModule as typeof DecimalType);
}

const prismaClientSingleton = () => {
  return new PrismaClient();
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