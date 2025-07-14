import { z } from 'zod';

// ============ BROWSER SCHEMAS ============

export const BrowserTypeSchema = z.enum(['chrome', 'firefox', 'safari']);

export const ViewportSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive()
});

export const BrowserConfigSchema = z.object({
  type: BrowserTypeSchema,
  headless: z.boolean().optional().default(false),
  viewport: ViewportSchema.optional(),
  userAgent: z.string().optional(),
  timeout: z.number().positive().optional(),
  slowMo: z.number().nonnegative().optional()
});

// Type inference from schemas
export type BrowserTypeFromSchema = z.infer<typeof BrowserTypeSchema>;
export type BrowserConfigFromSchema = z.infer<typeof BrowserConfigSchema>; 