/**
 * Prisma Extension for Prefixed IDs
 *
 * Automatically generates prefixed IDs for all create operations.
 * Uses Prisma 7's native $extends API for compatibility.
 *
 * Format: {prefix}_{base62id} (e.g., prod_abc123xyz...)
 *
 * @see Story 3.R2 - Prefixed IDs Foundation
 */
import { Prisma } from '@generated/prisma/client';
import { randomBytes } from 'crypto';
import { getIdPrefix } from './id-prefixes.config';

/**
 * Base62 alphabet for URL-safe IDs
 */
const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const ALPHABET_SIZE = ALPHABET.length; // 62

/**
 * Generate a random base62 string of given length
 * Uses crypto.randomBytes for cryptographic randomness
 *
 * @param length - Length of the random string
 * @returns Random base62 string
 */
function randomBase62(length: number): string {
  const bytes = randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += ALPHABET[bytes[i] % ALPHABET_SIZE];
  }
  return result;
}

/**
 * Generate a prefixed ID for a model
 *
 * @param modelName - The Prisma model name (e.g., 'Product')
 * @returns Prefixed ID string or null if no prefix configured
 */
export function generatePrefixedId(modelName: string): string | null {
  const prefix = getIdPrefix(modelName);
  if (!prefix) {
    return null;
  }
  // 21 character base62 gives ~125 bits of entropy
  // Similar to nanoid default length
  return `${prefix}_${randomBase62(21)}`;
}

/**
 * Check if data needs an ID to be generated
 */
function needsIdGeneration(modelName: string, data: Record<string, unknown>): boolean {
  return (data.id === undefined || data.id === null) && getIdPrefix(modelName) !== null;
}

/**
 * Process a single record, adding prefixed ID if needed
 */
function addPrefixedId<T extends Record<string, unknown>>(modelName: string, record: T): T {
  if (needsIdGeneration(modelName, record)) {
    const id = generatePrefixedId(modelName);
    if (id) {
      return { ...record, id } as T;
    }
  }
  return record;
}

/**
 * Process array data for createMany operations
 */
function processArrayData<T extends Record<string, unknown>>(modelName: string, data: T[]): T[] {
  return data.map((item) => addPrefixedId(modelName, item));
}

/**
 * Create Prisma extension for prefixed IDs
 *
 * Uses type assertions to work around Prisma's complex generics.
 * The actual data transformation is type-safe at runtime.
 *
 * Usage:
 * ```typescript
 * const prisma = new PrismaClient().$extends(prefixedIdsExtension);
 * ```
 */
export const prefixedIdsExtension = Prisma.defineExtension({
  name: 'prefixed-ids',
  query: {
    $allModels: {
      async create({ model, args, query }) {
        if (args.data) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const data = args.data as any;
          const processed = addPrefixedId(model, data);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return query({ ...args, data: processed } as any);
        }
        return query(args);
      },

      async createMany({ model, args, query }) {
        if (args.data) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const data = args.data as any;
          const processed = Array.isArray(data)
            ? processArrayData(model, data)
            : addPrefixedId(model, data);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return query({ ...args, data: processed } as any);
        }
        return query(args);
      },

      async createManyAndReturn({ model, args, query }) {
        if (args.data) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const data = args.data as any;
          const processed = Array.isArray(data)
            ? processArrayData(model, data)
            : addPrefixedId(model, data);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return query({ ...args, data: processed } as any);
        }
        return query(args);
      },

      async upsert({ model, args, query }) {
        if (args.create) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const create = args.create as any;
          const processed = addPrefixedId(model, create);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return query({ ...args, create: processed } as any);
        }
        return query(args);
      },
    },
  },
});
