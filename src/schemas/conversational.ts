import { z } from 'zod';

// ============ AI RESPONSE SCHEMAS ============

// AI Response schemas for conversation
export const ActionDeterminationSchema = z.enum(['ACTION', 'CONVERSATION']);

// Type inference from schemas
export type ActionDeterminationFromSchema = z.infer<typeof ActionDeterminationSchema>; 