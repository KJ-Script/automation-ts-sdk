import { z } from 'zod';
import { TaskSchema } from './agent';

// ============ CONVERSATIONAL SCHEMAS ============

export const ConversationRoleSchema = z.enum(['user', 'assistant']);

export const ConversationMessageSchema = z.object({
  id: z.string(),
  timestamp: z.date(),
  role: ConversationRoleSchema,
  content: z.string(),
  tasks: z.array(TaskSchema).optional(),
  results: z.any().optional()
});

export const ConversationContextSchema = z.object({
  currentUrl: z.string().url().optional(),
  currentPageTitle: z.string().optional(),
  lastScreenshot: z.string().optional()
});

// AI Response schemas for conversation
export const ActionDeterminationSchema = z.enum(['ACTION', 'CONVERSATION']);

export const SuggestionSchema = z.array(z.string());

// Type inference from schemas
export type ConversationMessageFromSchema = z.infer<typeof ConversationMessageSchema>;
export type ConversationContextFromSchema = z.infer<typeof ConversationContextSchema>;
export type ActionDeterminationFromSchema = z.infer<typeof ActionDeterminationSchema>;
export type SuggestionFromSchema = z.infer<typeof SuggestionSchema>; 