import { z } from 'zod';

// Chat message schemas
export const ChatMessageSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  metadata: z.record(z.string(), z.any()).optional(),
  createdAt: z.date().optional(),
});

export const ChatSessionSchema = z.object({
  id: z.string(),
  userPreferences: z.record(z.string(), z.any()).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Product schemas
export const ProductSchema = z.object({
  id: z.string(),
  partNumber: z.string(),
  name: z.string(),
  description: z.string().optional(),
  category: z.enum(['refrigerator', 'dishwasher']),
  brand: z.string().optional(),
  price: z.number().optional(),
  imageUrl: z.string().optional(),
  availability: z.enum(['in_stock', 'out_of_stock', 'backorder']).optional(),
});

// API request/response schemas
export const ChatRequestSchema = z.object({
  sessionId: z.string(),
  message: z.string(),
  context: z.record(z.string(), z.any()).optional(),
});

export const ChatResponseSchema = z.object({
  id: z.string(),
  content: z.string(),
  metadata: z.record(z.string(), z.any()).optional(),
  timestamp: z.string(),
});

// Type exports
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type ChatSession = z.infer<typeof ChatSessionSchema>;
export type Product = z.infer<typeof ProductSchema>;
export type ChatRequest = z.infer<typeof ChatRequestSchema>;
export type ChatResponse = z.infer<typeof ChatResponseSchema>;