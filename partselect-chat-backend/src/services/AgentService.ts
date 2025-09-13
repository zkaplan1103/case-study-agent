import { PartSelectAgent } from '../agents/PartSelectAgent';
import { DeepSeekService } from './DeepSeekService';
import { AgentResponse } from '../agents/BaseAgent';
import { z } from 'zod';

// Chat processing request schema
export const ChatRequestSchema = z.object({
  message: z.string(),
  sessionId: z.string(),
  context: z.record(z.string(), z.any()).optional(),
  userPreferences: z.record(z.string(), z.any()).optional(),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;

/**
 * Main service orchestrating the ReAct agent for chat interactions
 * Handles session management and agent coordination
 */
export class AgentService {
  private agent: PartSelectAgent;
  private deepSeekService: DeepSeekService;
  private sessionContexts = new Map<string, any>();

  constructor() {
    this.deepSeekService = new DeepSeekService();
    this.agent = new PartSelectAgent(this.deepSeekService);
  }

  /**
   * Process a chat message through the ReAct agent
   */
  async processMessage(request: ChatRequest): Promise<AgentResponse> {
    try {
      // Validate request
      const validatedRequest = ChatRequestSchema.parse(request);
      
      // Get or create session context
      const sessionContext = this.getSessionContext(validatedRequest.sessionId);
      
      // Merge user preferences and context
      const fullContext = {
        ...sessionContext,
        ...validatedRequest.context,
        userPreferences: validatedRequest.userPreferences,
        sessionId: validatedRequest.sessionId,
      };

      // Process through ReAct agent
      const startTime = Date.now();
      const response = await this.agent.process(validatedRequest.message, fullContext);
      const processingTime = Date.now() - startTime;

      // Update session context with interaction
      this.updateSessionContext(validatedRequest.sessionId, {
        lastMessage: validatedRequest.message,
        lastResponse: response.finalAnswer,
        lastInteractionTime: new Date().toISOString(),
        processingTime,
      });

      // Add processing metadata
      response.metadata = {
        ...response.metadata,
        processingTime,
        sessionId: validatedRequest.sessionId,
        agentName: this.agent.getName(),
      };

      return response;
    } catch (error: any) {
      console.error('Error processing message:', error);
      
      return {
        finalAnswer: 'I encountered an error while processing your request. Please try again or rephrase your question.',
        reasoning: [],
        confidence: 0.1,
        metadata: {
          error: error.message,
          processingTime: 0,
        }
      };
    }
  }

  /**
   * Get available tools for debugging/monitoring
   */
  getAvailableTools(): Array<{ name: string; description: string }> {
    // Get tools from the agent's internal tools map
    return [
      { name: 'search_parts', description: 'Search for appliance parts by part number, model number, or description' },
      { name: 'check_compatibility', description: 'Check if a specific part is compatible with an appliance model' },
      { name: 'get_installation_guide', description: 'Retrieve step-by-step installation instructions for appliance parts' },
      { name: 'diagnose_issue', description: 'Diagnose appliance issues through systematic troubleshooting' }
    ];
  }

  /**
   * Get agent information
   */
  getAgentInfo(): { name: string; description: string; status: string } {
    return {
      name: this.agent.getName(),
      description: this.agent.getDescription(),
      status: 'active'
    };
  }

  /**
   * Health check for the entire agent system
   */
  async healthCheck(): Promise<{
    agent: { name: string; status: string };
    deepseek: { status: string; model: string; hasApiKey: boolean };
    tools: { count: number; available: string[] };
    sessions: { active: number };
  }> {
    const deepseekHealth = await this.deepSeekService.healthCheck();
    const tools = this.getAvailableTools();

    return {
      agent: {
        name: this.agent.getName(),
        status: 'ready'
      },
      deepseek: deepseekHealth,
      tools: {
        count: tools.length,
        available: tools.map((t: { name: string; description: string }) => t.name)
      },
      sessions: {
        active: this.sessionContexts.size
      }
    };
  }

  /**
   * Get session context or create new one
   */
  private getSessionContext(sessionId: string): any {
    if (!this.sessionContexts.has(sessionId)) {
      this.sessionContexts.set(sessionId, {
        createdAt: new Date().toISOString(),
        messageCount: 0,
        userPreferences: {},
      });
    }
    
    return this.sessionContexts.get(sessionId);
  }

  /**
   * Update session context with new information
   */
  private updateSessionContext(sessionId: string, updates: any): void {
    const current = this.getSessionContext(sessionId);
    
    this.sessionContexts.set(sessionId, {
      ...current,
      ...updates,
      messageCount: (current.messageCount || 0) + 1,
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Clear old sessions (basic cleanup)
   */
  cleanupOldSessions(maxAgeHours = 24): void {
    const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);
    
    for (const [sessionId, context] of this.sessionContexts) {
      const lastActivity = context.lastInteractionTime || context.createdAt;
      if (new Date(lastActivity).getTime() < cutoffTime) {
        this.sessionContexts.delete(sessionId);
      }
    }
  }

  /**
   * Get session statistics for monitoring
   */
  getSessionStats(): {
    totalSessions: number;
    activeSessions: number;
    averageMessagesPerSession: number;
  } {
    const sessions = Array.from(this.sessionContexts.values());
    const totalMessages = sessions.reduce((sum, ctx) => sum + (ctx.messageCount || 0), 0);
    
    return {
      totalSessions: sessions.length,
      activeSessions: sessions.filter(ctx => {
        const lastActivity = new Date(ctx.lastInteractionTime || ctx.createdAt);
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        return lastActivity.getTime() > oneHourAgo;
      }).length,
      averageMessagesPerSession: sessions.length > 0 ? totalMessages / sessions.length : 0
    };
  }

  /**
   * Test the agent with the required Instalily test cases
   */
  async runTestCases(): Promise<Array<{ query: string; response: AgentResponse; passed: boolean }>> {
    const testCases = [
      'How can I install part number PS11752778?',
      'Is this part compatible with my WDT780SAEM1 model?',
      'The ice maker on my Whirlpool fridge is not working. How can I fix it?'
    ];

    const results = [];
    
    for (const testQuery of testCases) {
      try {
        const response = await this.processMessage({
          message: testQuery,
          sessionId: `test_${Date.now()}`,
          context: { isTest: true }
        });

        // Basic validation - in production would have more sophisticated checks
        const passed = response.finalAnswer.length > 10 && 
                      response.confidence > 0.3 && 
                      response.reasoning.length > 0;

        results.push({
          query: testQuery,
          response,
          passed
        });
      } catch (error: any) {
        results.push({
          query: testQuery,
          response: {
            finalAnswer: `Error: ${error.message}`,
            reasoning: [],
            confidence: 0,
            metadata: { error: true }
          },
          passed: false
        });
      }
    }

    return results;
  }
}