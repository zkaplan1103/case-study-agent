import { z } from 'zod';

// Core ReAct Agent Schema following ALM research patterns
export const ReasoningTraceSchema = z.object({
  thought: z.string(),
  action: z.string(),
  actionInput: z.record(z.string(), z.any()).optional(),
  observation: z.string().optional(),
  timestamp: z.string(),
});

export const AgentResponseSchema = z.object({
  finalAnswer: z.string(),
  reasoning: z.array(ReasoningTraceSchema),
  confidence: z.number().min(0).max(1),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type ReasoningTrace = z.infer<typeof ReasoningTraceSchema>;
export type AgentResponse = z.infer<typeof AgentResponseSchema>;

export abstract class BaseAgent {
  protected name: string;
  protected description: string;
  protected maxIterations: number;

  constructor(name: string, description: string, maxIterations = 5) {
    this.name = name;
    this.description = description;
    this.maxIterations = maxIterations;
  }

  /**
   * Main ReAct loop following the pattern:
   * Thought -> Action -> Observation -> ... -> Final Answer
   */
  async process(query: string, context?: Record<string, any>): Promise<AgentResponse> {
    const reasoning: ReasoningTrace[] = [];
    let currentQuery = query;
    let iteration = 0;

    try {
      while (iteration < this.maxIterations) {
        // Generate reasoning step
        const thought = await this.generateThought(currentQuery, reasoning, context);
        
        // Determine next action
        const action = await this.determineAction(thought, reasoning);
        
        // Record reasoning step
        const trace: ReasoningTrace = {
          thought,
          action: action.name,
          actionInput: action.input,
          timestamp: new Date().toISOString(),
        };

        // Execute action and get observation
        if (action.name === 'final_answer') {
          // Agent has decided to provide final answer
          return {
            finalAnswer: action.input?.answer || thought,
            reasoning,
            confidence: this.calculateConfidence(reasoning),
            metadata: { iterations: iteration + 1 }
          };
        }

        // Execute tool/action
        const observation = await this.executeAction(action);
        trace.observation = observation;
        reasoning.push(trace);

        // Update query for next iteration
        currentQuery = this.updateQuery(currentQuery, observation, reasoning);
        iteration++;
      }

      // Max iterations reached - provide best answer
      return {
        finalAnswer: this.synthesizeFinalAnswer(reasoning),
        reasoning,
        confidence: this.calculateConfidence(reasoning),
        metadata: { iterations: this.maxIterations, maxIterationsReached: true }
      };
    } catch (error: any) {
      console.error(`Agent processing error: ${error.message}`);
      return {
        finalAnswer: error.message.includes('AI reasoning service') 
          ? error.message 
          : 'I encountered an error while processing your request. Please try again or contact support.',
        reasoning,
        confidence: 0.1,
        metadata: { 
          iterations: iteration, 
          error: true, 
          errorMessage: error.message 
        }
      };
    }
  }

  // Abstract methods to be implemented by specific agents
  protected abstract generateThought(
    query: string, 
    reasoning: ReasoningTrace[], 
    context?: Record<string, any>
  ): Promise<string>;

  protected abstract determineAction(
    thought: string, 
    reasoning: ReasoningTrace[]
  ): Promise<{ name: string; input?: Record<string, any> }>;

  protected abstract executeAction(
    action: { name: string; input?: Record<string, any> }
  ): Promise<string>;

  // Helper methods
  protected updateQuery(
    originalQuery: string, 
    observation: string, 
    reasoning: ReasoningTrace[]
  ): string {
    // Default: keep original query, but can be overridden for dynamic queries
    return originalQuery;
  }

  protected synthesizeFinalAnswer(reasoning: ReasoningTrace[]): string {
    const lastObservation = reasoning[reasoning.length - 1]?.observation;
    return lastObservation || "I need more information to provide a complete answer.";
  }

  protected calculateConfidence(reasoning: ReasoningTrace[]): number {
    // Simple confidence calculation - can be enhanced with more sophisticated metrics
    if (reasoning.length === 0) return 0.1;
    if (reasoning.length >= 3) return 0.9;
    return 0.6;
  }

  // Getters
  getName(): string {
    return this.name;
  }

  getDescription(): string {
    return this.description;
  }
}