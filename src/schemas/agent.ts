import { z } from 'zod';

// ============ AI RESPONSE SCHEMAS ============

export const TaskTypeSchema = z.enum(['navigate', 'click', 'clickByText', 'type', 'extract', 'analyze', 'wait', 'custom']);

export const AITaskResponseSchema = z.object({
  id: z.string().optional(),
  description: z.string(),
  type: TaskTypeSchema,
  selector: z.string().optional(),
  clickText: z.string().optional(),
  text: z.string().optional(),
  url: z.string().url().optional(),
  reasoning: z.string().optional()
});

export const GoalAchievementSchema = z.object({
  achieved: z.boolean(),
  reasoning: z.string(),
  confidence: z.number().min(0).max(1)
});

export const CustomActionSchema = z.object({
  action: z.enum(['click', 'clickByText', 'type', 'navigate', 'extract']),
  selector: z.string().optional(),
  clickText: z.string().optional(),
  text: z.string().optional(),
  url: z.string().url().optional(),
  reasoning: z.string().optional()
});

// Type inference from schemas
export type AITaskResponseFromSchema = z.infer<typeof AITaskResponseSchema>;
export type GoalAchievementFromSchema = z.infer<typeof GoalAchievementSchema>;
export type CustomActionFromSchema = z.infer<typeof CustomActionSchema>; 