import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AgentService, ChatRequest } from '../services/AgentService';
import { DeepSeekService } from '../services/DeepSeekService';
import { z } from 'zod';

// API request schemas
const ChatMessageSchema = z.object({
  message: z.string(),
  sessionId: z.string(),
  context: z.record(z.string(), z.any()).optional(),
  userPreferences: z.record(z.string(), z.any()).optional(),
});

const TestAgentSchema = z.object({
  runTests: z.boolean().default(true)
});

/**
 * Chat API routes for the PartSelect ReAct agent
 */
export async function chatRoutes(fastify: FastifyInstance) {
  const agentService = new AgentService();
  const deepSeekService = new DeepSeekService();

  // Main chat endpoint
  fastify.post<{
    Body: ChatRequest;
  }>('/api/v1/chat', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const validatedRequest = ChatMessageSchema.parse(request.body);
      
      const response = await agentService.processMessage(validatedRequest);
      
      return {
        success: true,
        data: response,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      fastify.log.error('Chat endpoint error:', error);
      
      reply.code(400);
      return {
        success: false,
        error: error?.message || 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  });

  // Agent health check
  fastify.get('/api/v1/chat/health', async (request, reply) => {
    try {
      const health = await agentService.healthCheck();
      
      return {
        success: true,
        data: health,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      fastify.log.error('Agent health check error:', error);
      
      reply.code(500);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  });

  // Get available tools
  fastify.get('/api/v1/chat/tools', async (request, reply) => {
    try {
      const tools = agentService.getAvailableTools();
      
      return {
        success: true,
        data: {
          tools,
          count: tools.length
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      fastify.log.error('Tools endpoint error:', error);
      
      reply.code(500);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  });

  // Agent information
  fastify.get('/api/v1/chat/agent', async (request, reply) => {
    try {
      const agentInfo = agentService.getAgentInfo();
      
      return {
        success: true,
        data: agentInfo,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      fastify.log.error('Agent info endpoint error:', error);
      
      reply.code(500);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  });

  // Session statistics
  fastify.get('/api/v1/chat/stats', async (request, reply) => {
    try {
      const stats = agentService.getSessionStats();
      
      return {
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      fastify.log.error('Stats endpoint error:', error);
      
      reply.code(500);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  });

  // Test endpoint for Instalily required test cases
  fastify.post('/api/v1/chat/test', async (request, reply) => {
    try {
      const testResults = await agentService.runTestCases();
      
      const summary = {
        totalTests: testResults.length,
        passed: testResults.filter(r => r.passed).length,
        failed: testResults.filter(r => !r.passed).length,
        passRate: testResults.length > 0 
          ? (testResults.filter(r => r.passed).length / testResults.length) * 100 
          : 0
      };
      
      return {
        success: true,
        data: {
          summary,
          results: testResults
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      fastify.log.error('Test endpoint error:', error);
      
      reply.code(500);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  });

  // Cleanup endpoint (for maintenance)
  fastify.post('/api/v1/chat/cleanup', async (request, reply) => {
    try {
      agentService.cleanupOldSessions(24); // Clean sessions older than 24 hours
      
      return {
        success: true,
        data: { message: 'Session cleanup completed' },
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      fastify.log.error('Cleanup endpoint error:', error);
      
      reply.code(500);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  });

  // DeepSeek Integration Endpoints (Phase 2.2)

  // DeepSeek health check
  fastify.get('/api/v1/deepseek/health', async (request, reply) => {
    try {
      const health = await deepSeekService.healthCheck();
      
      return {
        success: true,
        data: health,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      fastify.log.error('DeepSeek health check error:', error);
      
      reply.code(500);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  });

  // DeepSeek usage statistics
  fastify.get('/api/v1/deepseek/stats', async (request, reply) => {
    try {
      const stats = await deepSeekService.getUsageStats();
      
      return {
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      fastify.log.error('DeepSeek stats error:', error);
      
      reply.code(500);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  });

  // Test DeepSeek integration with Instalily test cases
  fastify.post('/api/v1/deepseek/test', async (request, reply) => {
    try {
      const testResults = await deepSeekService.testIntegration();
      
      return {
        success: true,
        data: testResults,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      fastify.log.error('DeepSeek test error:', error);
      
      reply.code(500);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  });

  // Direct DeepSeek completion endpoint (for testing)
  fastify.post('/api/v1/deepseek/complete', async (request, reply) => {
    try {
      const { prompt, options } = request.body as any;
      
      if (!prompt) {
        reply.code(400);
        return {
          success: false,
          error: 'Prompt is required',
          timestamp: new Date().toISOString(),
        };
      }

      const response = await deepSeekService.generateCompletion(prompt, options || {});
      
      return {
        success: true,
        data: {
          prompt,
          response,
          options: options || {}
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      fastify.log.error('DeepSeek completion error:', error);
      
      reply.code(500);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  });
}