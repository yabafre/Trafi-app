/**
 * @trafi/zod
 *
 * Shared Zod instance for the Trafi monorepo.
 * All packages MUST import from here to ensure a single Zod instance.
 *
 * Usage:
 *   import { z } from '@trafi/zod'
 */
export { z } from 'zod'
export type { ZodTypeAny, ZodType, ZodSchema, infer as ZodInfer } from 'zod'
