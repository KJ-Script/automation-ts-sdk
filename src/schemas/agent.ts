import { z } from 'zod';
import { BrowserConfigSchema } from './browser';

// ============ AGENT SCHEMAS ============

export const TaskTypeSchema = z.enum(['navigate', 'click', 'clickByText', 'type', 'extract', 'analyze', 'wait', 'custom']);

export const TaskSchema = z.object({
  id: z.string(),
  description: z.string(),
  type: TaskTypeSchema,
  selector: z.string().optional(),
  text: z.string().optional(),
  clickText: z.string().optional(),
  url: z.string().url().optional(),
  completed: z.boolean(),
  result: z.any().optional(),
  screenshot: z.string().optional()
});

export const AgentConfigSchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
  model: z.string().optional(),
  browserConfig: BrowserConfigSchema.partial().optional(),
  maxRetries: z.number().int().min(0).max(10).optional(),
  debugMode: z.boolean().optional(),
  screenshotDir: z.string().optional(),
  enableScreenshots: z.boolean().optional()
});

export const AgentResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  tasks: z.array(TaskSchema),
  finalResult: z.any().optional(),
  screenshots: z.array(z.string()).optional()
});

// AI Response schemas for parsing AI-generated tasks
export const AITaskResponseSchema = z.object({
  id: z.string(),
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
export type TaskFromSchema = z.infer<typeof TaskSchema>;
export type AgentConfigFromSchema = z.infer<typeof AgentConfigSchema>;
export type AgentResponseFromSchema = z.infer<typeof AgentResponseSchema>;
export type AITaskResponseFromSchema = z.infer<typeof AITaskResponseSchema>;
export type GoalAchievementFromSchema = z.infer<typeof GoalAchievementSchema>;
export type CustomActionFromSchema = z.infer<typeof CustomActionSchema>; 