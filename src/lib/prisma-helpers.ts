import prisma from "./prisma";
import { notFoundResponse } from "./api-response";
import { logger } from "./logger";

/**
 * Find a resource by ID or return 404 response
 */
export async function findByIdOr404<T>(
  model: {
    findUnique: (args: { where: { id: string } }) => Promise<T | null>;
  },
  id: string,
  resourceName: string = "Resource"
): Promise<T | globalThis.Response> {
  try {
    const resource = await model.findUnique({ where: { id } });
    if (!resource) {
      return notFoundResponse(resourceName);
    }
    return resource;
  } catch (error) {
    logger.error(`Error finding ${resourceName}`, error);
    return notFoundResponse(resourceName);
  }
}

/**
 * Find a resource by unique field or return 404
 */
export async function findByUniqueOr404<T>(
  findFn: () => Promise<T | null>,
  resourceName: string = "Resource"
): Promise<T | globalThis.Response> {
  try {
    const resource = await findFn();
    if (!resource) {
      return notFoundResponse(resourceName);
    }
    return resource;
  } catch (error) {
    logger.error(`Error finding ${resourceName}`, error);
    return notFoundResponse(resourceName);
  }
}

/**
 * Check if resource exists
 */
export async function resourceExists(
  findFn: () => Promise<unknown>
): Promise<boolean> {
  try {
    const resource = await findFn();
    return resource !== null;
  } catch {
    return false;
  }
}

/**
 * Common Prisma query patterns
 */
export const prismaQueries = {
  /**
   * Get user with session
   */
  getUserWithSession: (sessionToken: string) =>
    prisma.session.findFirst({
      where: {
        token: sessionToken,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    }),

  /**
   * Get bet with parameters
   */
  getBetWithParameters: (betId: string) =>
    prisma.bet.findUnique({
      where: { id: betId },
      include: {
        parameters: {
          orderBy: { name: "asc" },
        },
      },
    }),

  /**
   * Get parameter with history
   */
  getParameterWithHistory: (parameterId: string) =>
    prisma.parameter.findUnique({
      where: { id: parameterId },
      include: {
        bet: true,
        history: {
          orderBy: { createdAt: "desc" },
        },
      },
    }),
};

