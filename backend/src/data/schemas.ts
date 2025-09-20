import { z } from 'zod';

// Validation schemas using Zod for runtime type checking

// Product-related schemas
export const ProductSchema = z.object({
  id: z.string(),
  partNumber: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.enum(['refrigerator', 'dishwasher']),
  brand: z.string(),
  compatibleModels: z.array(z.string()),
  price: z.number().positive(),
  availability: z.enum(['in-stock', 'out-of-stock', 'backordered']),
  imageUrl: z.string().url().optional(),
  installationDifficulty: z.enum(['easy', 'medium', 'hard']),
  estimatedInstallTime: z.number().positive(),
  requiredTools: z.array(z.string()),
  safetyWarnings: z.array(z.string()),
  installationSteps: z.array(z.object({
    step: z.number().positive(),
    title: z.string(),
    description: z.string(),
    warning: z.string().optional(),
    imageUrl: z.string().url().optional()
  })).optional()
});

export const ProductSearchParamsSchema = z.object({
  query: z.string().optional(),
  partNumber: z.string().optional(),
  category: z.enum(['refrigerator', 'dishwasher']).optional(),
  brand: z.string().optional(),
  priceRange: z.object({
    min: z.number().nonnegative(),
    max: z.number().positive()
  }).optional(),
  availability: z.enum(['in-stock', 'out-of-stock', 'backordered']).optional(),
  limit: z.number().positive().max(50).default(10),
  offset: z.number().nonnegative().default(0)
});

// Chat-related schemas
export const ChatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1, "Message content cannot be empty"),
  timestamp: z.date(),
  metadata: z.object({
    reasoning: z.array(z.string()).optional(),
    toolsUsed: z.array(z.string()).optional(),
    products: z.array(ProductSchema).optional(),
    searchParams: ProductSearchParamsSchema.optional(),
    error: z.string().optional()
  }).optional()
});

export const ChatRequestSchema = z.object({
  message: z.string().min(1, "Message cannot be empty").max(1000, "Message too long"),
  sessionId: z.string().optional(),
  context: z.array(ChatMessageSchema).max(20, "Too many context messages").optional()
});

export const ChatResponseSchema = z.object({
  message: ChatMessageSchema,
  reasoning: z.array(z.object({
    step: z.number().positive(),
    type: z.enum(['thought', 'action', 'observation']),
    content: z.string(),
    tool: z.string().optional(),
    parameters: z.record(z.any()).optional(),
    result: z.any().optional(),
    timestamp: z.date()
  })).optional(),
  products: z.array(ProductSchema).optional(),
  error: z.string().optional()
});

// Tool parameter schemas
export const ProductSearchToolSchema = z.object({
  query: z.string().optional(),
  partNumber: z.string().optional(),
  category: z.enum(['refrigerator', 'dishwasher']).optional(),
  brand: z.string().optional(),
  limit: z.number().positive().max(20).default(5)
});

export const CompatibilityToolSchema = z.object({
  partNumber: z.string().min(1, "Part number is required"),
  modelNumber: z.string().min(1, "Model number is required")
});

export const InstallationToolSchema = z.object({
  partNumber: z.string().min(1, "Part number is required")
});

export const TroubleshootingToolSchema = z.object({
  symptom: z.string().min(1, "Symptom description is required"),
  category: z.enum(['refrigerator', 'dishwasher']).optional(),
  brand: z.string().optional(),
  modelNumber: z.string().optional()
});

// DeepSeek/LLM schemas
export const DeepSeekMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string().min(1, "Message content cannot be empty")
});

export const DeepSeekRequestSchema = z.object({
  model: z.string().default('deepseek-chat'),
  messages: z.array(DeepSeekMessageSchema).min(1, "At least one message required"),
  temperature: z.number().min(0).max(2).default(0.3),
  max_tokens: z.number().positive().max(4000).default(2000),
  stream: z.boolean().default(false)
});

// Agent-related schemas
export const AgentActionSchema = z.object({
  tool: z.string().min(1, "Tool name is required"),
  parameters: z.record(z.any()),
  reasoning: z.string().min(1, "Reasoning is required")
});

export const ToolResultSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

// Configuration schemas
export const ServerConfigSchema = z.object({
  port: z.number().positive().default(3001),
  corsOrigins: z.array(z.string()).default(['http://localhost:3000']),
  rateLimitWindowMs: z.number().positive().default(900000), // 15 minutes
  rateLimitMaxRequests: z.number().positive().default(100),
  deepseekApiKey: z.string().optional(),
  deepseekBaseUrl: z.string().url().default('https://api.deepseek.com')
});

// Environment variable validation
export const EnvironmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).pipe(z.number().positive()).default('3001'),
  DEEPSEEK_API_KEY: z.string().optional(),
  DEEPSEEK_BASE_URL: z.string().url().default('https://api.deepseek.com'),
  CORS_ORIGINS: z.string().optional().transform(val => 
    val ? val.split(',').map(origin => origin.trim()) : ['http://localhost:3000']
  ),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).pipe(z.number().positive()).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).pipe(z.number().positive()).default('100')
});

// Error response schema
export const ErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.any()).optional()
  }),
  timestamp: z.date(),
  path: z.string(),
  method: z.string(),
  statusCode: z.number()
});

// Type exports for use in other files
export type ProductSearchParams = z.infer<typeof ProductSearchParamsSchema>;
export type ChatRequest = z.infer<typeof ChatRequestSchema>;
export type ChatResponse = z.infer<typeof ChatResponseSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type DeepSeekMessage = z.infer<typeof DeepSeekMessageSchema>;
export type DeepSeekRequest = z.infer<typeof DeepSeekRequestSchema>;
export type AgentAction = z.infer<typeof AgentActionSchema>;
export type ToolResult = z.infer<typeof ToolResultSchema>;
export type ServerConfig = z.infer<typeof ServerConfigSchema>;
export type EnvironmentConfig = z.infer<typeof EnvironmentSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

// Validation helper functions
export function validateEnvironment() {
  try {
    const config = EnvironmentSchema.parse(process.env);
    return { success: true, data: config };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: `Environment validation failed: ${error.errors.map(e => e.message).join(', ')}`
      };
    }
    return { success: false, error: 'Unknown environment validation error' };
  }
}

export function validateChatRequest(data: unknown) {
  try {
    const validated = ChatRequestSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      };
    }
    return { success: false, error: 'Validation failed' };
  }
}

export function validateProductSearchParams(data: unknown) {
  try {
    const validated = ProductSearchParamsSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      };
    }
    return { success: false, error: 'Search parameters validation failed' };
  }
}