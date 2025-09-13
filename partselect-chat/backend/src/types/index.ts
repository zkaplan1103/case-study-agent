// Core TypeScript interfaces for PartSelect Chat Agent

// Product-related interfaces
export interface Product {
  id: string;
  partNumber: string;
  name: string;
  description: string;
  category: 'refrigerator' | 'dishwasher';
  brand: string;
  compatibleModels: string[];
  price: number;
  availability: 'in-stock' | 'out-of-stock' | 'backordered';
  imageUrl?: string;
  installationDifficulty: 'easy' | 'medium' | 'hard';
  estimatedInstallTime: number; // in minutes
  requiredTools: string[];
  safetyWarnings: string[];
  installationSteps?: InstallationStep[];
}

export interface InstallationStep {
  step: number;
  title: string;
  description: string;
  warning?: string;
  imageUrl?: string;
}

export interface ProductSearchParams {
  query?: string;
  partNumber?: string;
  category?: 'refrigerator' | 'dishwasher';
  brand?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  availability?: 'in-stock' | 'out-of-stock' | 'backordered';
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  products: Product[];
  totalCount: number;
  searchTerms: string[];
  suggestions?: string[];
}

export interface CompatibilityCheck {
  partNumber: string;
  modelNumber: string;
  isCompatible: boolean;
  confidence: number; // 0-1 scale
  reason: string;
  alternativeParts?: Product[];
}

// Chat and Agent interfaces
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    reasoning?: string[];
    toolsUsed?: string[];
    products?: Product[];
    searchParams?: ProductSearchParams;
    error?: string;
  };
}

export interface ChatRequest {
  message: string;
  sessionId?: string;
  context?: ChatMessage[];
}

export interface ChatResponse {
  message: ChatMessage;
  reasoning?: ReasoningStep[];
  products?: Product[];
  error?: string;
}

// ReAct Agent interfaces
export interface ReasoningStep {
  step: number;
  type: 'thought' | 'action' | 'observation';
  content: string;
  tool?: string;
  parameters?: Record<string, any>;
  result?: any;
  timestamp: Date;
}

export interface AgentAction {
  tool: string;
  parameters: Record<string, any>;
  reasoning: string;
}

export interface AgentObservation {
  result: any;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

// Tool interfaces
export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (parameters: Record<string, any>) => Promise<any>;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: Record<string, any>;
}

// Service interfaces
export interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface DeepSeekResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface LLMService {
  generateResponse(messages: DeepSeekMessage[]): Promise<string>;
  isAvailable(): boolean;
}

// Configuration interfaces
export interface ServerConfig {
  port: number;
  corsOrigins: string[];
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  deepseekApiKey?: string;
  deepseekBaseUrl?: string;
}

// Error interfaces
export interface AppError {
  code: string;
  message: string;
  statusCode: number;
  details?: Record<string, any>;
}

// Troubleshooting interfaces
export interface TroubleshootingSymptom {
  id: string;
  description: string;
  category: 'refrigerator' | 'dishwasher';
  commonCauses: string[];
  diagnosticSteps: DiagnosticStep[];
  recommendedParts?: string[]; // part numbers
}

export interface DiagnosticStep {
  step: number;
  description: string;
  expectedResult: string;
  nextStepIfTrue?: number;
  nextStepIfFalse?: number;
  recommendedAction?: string;
}

export interface TroubleshootingResult {
  symptom: TroubleshootingSymptom;
  suggestedSteps: DiagnosticStep[];
  recommendedParts: Product[];
  shouldContactProfessional: boolean;
  reason?: string;
}

// Validation schemas (for use with Zod)
export interface ValidationSchema {
  chatRequest: any;
  productSearch: any;
  compatibilityCheck: any;
}