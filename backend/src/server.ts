// backend/src/server.ts
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config } from 'dotenv';

import { DeepSeekService } from './services/DeepSeekService';
import { PartSelectAgent } from './agents/PartSelectAgent';
import { SearchService } from './services/SearchService';
import { 
  ChatRequest, 
  ChatResponse, 
  ChatMessage, 
  ServerConfig 
} from './types';
import { 
  validateEnvironment, 
  validateChatRequest,
} from './data/schemas';

/**
 * ========================================
 * SERVER INITIALIZATION & CONFIGURATION
 * ========================================
 */

// Load environment variables
config();

// Validate environment configuration
const envValidation = validateEnvironment();
if (!envValidation.success) {
  console.error('Environment validation failed:', envValidation.error);
  process.exit(1);
}

const envConfig = envValidation.data!;

// Server configuration
const serverConfig: ServerConfig = {
  port: envConfig.PORT,
  corsOrigins: envConfig.CORS_ORIGINS,
  rateLimitWindowMs: envConfig.RATE_LIMIT_WINDOW_MS,
  rateLimitMaxRequests: envConfig.RATE_LIMIT_MAX_REQUESTS,
  deepseekApiKey: envConfig.DEEPSEEK_API_KEY,
  deepseekBaseUrl: envConfig.DEEPSEEK_BASE_URL
};

// Initialize services with dependency injection
const deepSeekService = new DeepSeekService({
  apiKey: serverConfig.deepseekApiKey,
  baseUrl: serverConfig.deepseekBaseUrl
});
const searchService = new SearchService();
const partSelectAgent = new PartSelectAgent(deepSeekService, searchService);

// Create Express app
const app = express();

/**
 * ========================================
 * MIDDLEWARE SETUP
 * ========================================
 */

// General middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS configuration for controlled access
app.use(cors({
  origin: serverConfig.corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} ${req.method} ${req.path} - ${req.ip || 'unknown'}`);
  
  if (req.method === 'POST' && req.body) {
    const logBody = { ...req.body };
    if (logBody.message) logBody.message = logBody.message.substring(0, 100) + '...';
    console.log('Request body:', logBody);
  }
  
  next();
});

// Simple in-memory rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Periodic cleanup of expired rate limit entries to prevent memory leaks
const cleanupRateLimit = () => {
  const now = Date.now();
  for (const [clientId, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(clientId);
    }
  }
};

// Run cleanup every 5 minutes
setInterval(cleanupRateLimit, 5 * 60 * 1000);

// Rate limiting middleware to prevent abuse
const rateLimit = (req: Request, res: Response, next: NextFunction) => {
  const clientId = req.ip || 'unknown';
  const now = Date.now();
  
  let clientData = rateLimitStore.get(clientId);
  
  if (!clientData || now > clientData.resetTime) {
    clientData = {
      count: 0,
      resetTime: now + serverConfig.rateLimitWindowMs
    };
  }
  
  clientData.count++;
  rateLimitStore.set(clientId, clientData);
  
  if (clientData.count > serverConfig.rateLimitMaxRequests) {
    return res.status(429).json({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.',
        details: {
          limit: serverConfig.rateLimitMaxRequests,
          windowMs: serverConfig.rateLimitWindowMs,
          resetTime: new Date(clientData.resetTime)
        }
      }
    });
  }
  
  res.setHeader('X-RateLimit-Limit', serverConfig.rateLimitMaxRequests);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, serverConfig.rateLimitMaxRequests - clientData.count));
  res.setHeader('X-RateLimit-Reset', Math.ceil(clientData.resetTime / 1000));
  
  next();
};

app.use('/api/', rateLimit);

/**
 * ========================================
 * API ENDPOINTS
 * ========================================
 */

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: envConfig.NODE_ENV,
    services: {
      deepSeek: deepSeekService.getStatus(),
    }
  };
  
  res.json(health);
});

// Main chat endpoint
app.post('/api/chat', async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('Processing chat request...');
    
    const validation = validateChatRequest(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: {
          code: 'INVALID_REQUEST',
          message: 'Request validation failed',
          details: { validationError: validation.error }
        }
      });
    }
    
    const chatRequest = validation.data as ChatRequest;
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    const agentResponse = await partSelectAgent.processQuery(
      chatRequest.message,
      chatRequest.context || []
    );
    
    const responseMessage: ChatMessage = {
      id: messageId,
      role: 'assistant',
      content: agentResponse.response,
      timestamp: new Date(),
      metadata: {
        reasoning: agentResponse.reasoning?.map(r => r.content) || [],
        toolsUsed: agentResponse.reasoning?.filter(r => r.tool).map(r => r.tool!) || [],
        products: agentResponse.products || [],
        error: agentResponse.error
      }
    };
    
    const chatResponse: ChatResponse = {
      message: responseMessage,
      reasoning: agentResponse.reasoning,
      products: agentResponse.products,
      error: agentResponse.error
    };
    
    console.log(`Chat request processed successfully - ${responseMessage.metadata?.toolsUsed?.length || 0} tools used`);
    
    res.json(chatResponse);
    
  } catch (error) {
    console.error('Chat endpoint error:', error);
    next(error);
  }
});

// Product search endpoint
app.get('/api/products/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const searchParams = {
      query: req.query.q as string,
      partNumber: req.query.partNumber as string,
      category: req.query.category as 'refrigerator' | 'dishwasher',
      brand: req.query.brand as string,
      limit: parseInt(req.query.limit as string) || 10,
      offset: parseInt(req.query.offset as string) || 0
    };
    
    const results = await searchService.searchProducts(searchParams);
    res.json(results);
    
  } catch (error) {
    console.error('Product search error:', error);
    next(error);
  }
});

// Product details endpoint
app.get('/api/products/:partNumber', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { partNumber } = req.params;
    const product = await searchService.getProductByPartNumber(partNumber);
    
    if (!product) {
      return res.status(404).json({
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: `Product with part number ${partNumber} not found`
        }
      });
    }
    
    res.json(product);
    
  } catch (error) {
    console.error('Product details error:', error);
    next(error);
  }
});

// Compatibility check endpoint
app.post('/api/compatibility', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { partNumber, modelNumber } = req.body;
    
    if (!partNumber || !modelNumber) {
      return res.status(400).json({
        error: {
          code: 'MISSING_PARAMETERS',
          message: 'Both partNumber and modelNumber are required'
        }
      });
    }
    
    const result = await searchService.checkCompatibility(partNumber, modelNumber);
    res.json(result);
    
  } catch (error) {
    console.error('Compatibility check error:', error);
    next(error);
  }
});

// Installation instructions endpoint
app.get('/api/installation/:partNumber', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { partNumber } = req.params;
    const instructions = await searchService.getInstallationInstructions(partNumber);
    
    if (!instructions) {
      return res.status(404).json({
        error: {
          code: 'INSTRUCTIONS_NOT_FOUND',
          message: `Installation instructions not found for part ${partNumber}`
        }
      });
    }
    
    res.json(instructions);
    
  } catch (error) {
    console.error('Installation instructions error:', error);
    next(error);
  }
});

// Statistics endpoint
app.get('/api/stats', (req: Request, res: Response) => {
  const stats = {
    server: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: envConfig.NODE_ENV
    },
    deepSeek: deepSeekService.getStatus()
  };
  
  res.json(stats);
});

/**
 * ========================================
 * ERROR HANDLING & SHUTDOWN
 * ========================================
 */

// Error handling middleware
app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  console.error('Server error:', err);
  
  let statusCode = 500;
  let errorCode = 'INTERNAL_SERVER_ERROR';
  let message = 'An internal server error occurred';
  
  if (err instanceof Error) {
    message = err.message;
    
    if (err.name === 'ValidationError') {
      statusCode = 400;
      errorCode = 'VALIDATION_ERROR';
    }
  }
  
  if (err && typeof err === 'object' && 'code' in err && err.code === 'ECONNREFUSED') {
    statusCode = 503;
    errorCode = 'SERVICE_UNAVAILABLE';
    message = 'External service unavailable';
  }
  
  res.status(statusCode).json({
    error: {
      code: errorCode,
      message,
      details: envConfig.NODE_ENV === 'development' ? {
        stack: err instanceof Error ? err.stack : undefined,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
      } : undefined
    },
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    statusCode
  });
});

// Handle 404 errors
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`
    },
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    statusCode: 404
  });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');  
  process.exit(0);
});

/**
 * ========================================
 * SERVER START
 * ========================================
 */

app.listen(serverConfig.port, () => {
  console.log('PartSelect Chat Backend Server Started');
  console.log('=====================================');
  console.log(`Port: ${serverConfig.port}`);
  console.log(`Environment: ${envConfig.NODE_ENV}`);
  console.log(`DeepSeek API: ${serverConfig.deepseekApiKey ? 'Configured' : 'Not configured'}`);
  console.log(`CORS Origins: ${serverConfig.corsOrigins.join(', ')}`);
  console.log(`Rate Limit: ${serverConfig.rateLimitMaxRequests} requests per ${serverConfig.rateLimitWindowMs/1000}s`);
  console.log('=====================================');
  console.log('Available Tools:', partSelectAgent.getAvailableTools().join(', '));
  console.log('=====================================');
  console.log('API Endpoints:');
  console.log('  POST /api/chat - Main chat interface');
  console.log('  GET  /api/products/search - Product search');
  console.log('  GET  /api/products/:partNumber - Product details');
  console.log('  POST /api/compatibility - Compatibility check');
  console.log('  GET  /api/installation/:partNumber - Installation guide');
  console.log('  GET  /health - Health check');
  console.log('  GET  /api/stats - System statistics');
  console.log('=====================================');
  console.log('Server ready to accept connections');
});

export default app;