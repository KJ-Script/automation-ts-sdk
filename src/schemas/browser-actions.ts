import { z } from 'zod';

// ============ BROWSER ACTIONS SCHEMAS ============

export const ClickButtonSchema = z.enum(['left', 'right', 'middle']);

export const PositionSchema = z.object({
  x: z.number(),
  y: z.number()
});

export const ClickOptionsSchema = z.object({
  timeout: z.number().positive().optional(),
  force: z.boolean().optional(),
  delay: z.number().nonnegative().optional(),
  button: ClickButtonSchema.optional(),
  clickCount: z.number().positive().optional(),
  position: PositionSchema.optional()
});

export const TypeOptionsSchema = z.object({
  delay: z.number().nonnegative().optional(),
  timeout: z.number().positive().optional(),
  clear: z.boolean().optional()
});

export const ScrollBehaviorSchema = z.enum(['auto', 'smooth']);

export const ScrollOptionsSchema = z.object({
  behavior: ScrollBehaviorSchema.optional(),
  timeout: z.number().positive().optional()
});

export const WaitStateSchema = z.enum(['attached', 'detached', 'visible', 'hidden']);

export const WaitOptionsSchema = z.object({
  timeout: z.number().positive().optional(),
  state: WaitStateSchema.optional()
});

export const ScreenshotTypeSchema = z.enum(['png', 'jpeg']);

export const ScreenshotOptionsSchema = z.object({
  path: z.string().optional(),
  fullPage: z.boolean().optional(),
  quality: z.number().min(0).max(100).optional(),
  type: ScreenshotTypeSchema.optional()
});

export const ScreenshotFullPageOptionsSchema = ScreenshotOptionsSchema.extend({
  fullPage: z.boolean().optional()
});

// Type inference from schemas
export type ClickOptionsFromSchema = z.infer<typeof ClickOptionsSchema>;
export type TypeOptionsFromSchema = z.infer<typeof TypeOptionsSchema>;
export type ScrollOptionsFromSchema = z.infer<typeof ScrollOptionsSchema>;
export type WaitOptionsFromSchema = z.infer<typeof WaitOptionsSchema>;
export type ScreenshotOptionsFromSchema = z.infer<typeof ScreenshotOptionsSchema>;
export type ScreenshotFullPageOptionsFromSchema = z.infer<typeof ScreenshotFullPageOptionsSchema>; 