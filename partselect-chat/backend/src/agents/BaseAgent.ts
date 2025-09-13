import { ReasoningStep, AgentAction, AgentObservation, ChatMessage, Tool, DeepSeekMessage } from '../types';
import { LLMService } from '../types';

export abstract class BaseAgent {
  protected reasoning: ReasoningStep[] = [];
  protected maxIterations: number = 10;
  protected currentIteration: number = 0;
  
  constructor(
    protected llmService: LLMService,
    protected tools: Map<string, Tool> = new Map()
  ) {}

  /**
   * Main ReAct loop implementation
   */
  public async processQuery(userMessage: string, context: ChatMessage[] = []): Promise<{
    response: string;
    reasoning: ReasoningStep[];
    products?: any[];
    error?: string;
  }> {
    try {
      this.reasoning = [];
      this.currentIteration = 0;
      
      console.log(`🤖 Starting ReAct processing for: "${userMessage}"`);
      
      // Initialize with user query analysis
      await this.think(`User query: "${userMessage}". I need to analyze this request and determine the appropriate tools to use.`);
      
      // Main reasoning loop
      while (this.currentIteration < this.maxIterations) {
        this.currentIteration++;
        
        // Generate next action based on current reasoning
        const action = await this.generateAction(userMessage, context);
        
        if (!action) {
          // No more actions needed, generate final response
          break;
        }
        
        // Execute the action
        const observation = await this.executeAction(action);
        
        // Add observation to reasoning
        await this.observe(observation, action.tool);
        
        // Check if we have enough information to respond
        if (this.shouldFinalize(observation)) {
          break;
        }
      }
      
      // Generate final response
      const finalResponse = await this.generateFinalResponse(userMessage, context);
      
      console.log(`✅ ReAct processing completed in ${this.currentIteration} iterations`);
      
      return {
        response: finalResponse.response,
        reasoning: this.reasoning,
        products: finalResponse.products,
        error: undefined
      };
      
    } catch (error) {
      console.error('❌ Error in ReAct processing:', error);
      
      return {
        response: this.generateErrorResponse(error as Error),
        reasoning: this.reasoning,
        error: (error as Error).message
      };
    }
  }

  /**
   * Add a thought to the reasoning chain
   */
  protected async think(thought: string): Promise<void> {
    const step: ReasoningStep = {
      step: this.reasoning.length + 1,
      type: 'thought',
      content: thought,
      timestamp: new Date()
    };
    
    this.reasoning.push(step);
    console.log(`💭 Thought ${step.step}: ${thought}`);
  }

  /**
   * Add an action to the reasoning chain
   */
  protected async act(action: AgentAction): Promise<void> {
    const step: ReasoningStep = {
      step: this.reasoning.length + 1,
      type: 'action',
      content: action.reasoning,
      tool: action.tool,
      parameters: action.parameters,
      timestamp: new Date()
    };
    
    this.reasoning.push(step);
    console.log(`🔧 Action ${step.step}: Using ${action.tool} with parameters:`, action.parameters);
  }

  /**
   * Add an observation to the reasoning chain
   */
  protected async observe(observation: AgentObservation, toolName: string): Promise<void> {
    const step: ReasoningStep = {
      step: this.reasoning.length + 1,
      type: 'observation',
      content: observation.success 
        ? `Tool ${toolName} executed successfully` 
        : `Tool ${toolName} failed: ${observation.error}`,
      result: observation.result,
      tool: toolName,
      timestamp: new Date()
    };
    
    this.reasoning.push(step);
    console.log(`👁️ Observation ${step.step}: ${step.content}`);
  }

  /**
   * Execute an agent action using the specified tool
   */
  protected async executeAction(action: AgentAction): Promise<AgentObservation> {
    try {
      // Add action to reasoning chain
      await this.act(action);
      
      // Get the tool
      const tool = this.tools.get(action.tool);
      if (!tool) {
        return {
          success: false,
          error: `Tool '${action.tool}' not found`,
          result: null
        };
      }
      
      // Execute the tool
      console.log(`🔨 Executing ${action.tool}...`);
      const result = await tool.execute(action.parameters);
      
      return {
        success: true,
        result: result,
        metadata: { toolName: action.tool }
      };
      
    } catch (error) {
      console.error(`❌ Tool execution failed for ${action.tool}:`, error);
      
      return {
        success: false,
        error: (error as Error).message,
        result: null
      };
    }
  }

  /**
   * Register a tool with the agent
   */
  public registerTool(tool: Tool): void {
    this.tools.set(tool.name, tool);
    console.log(`🔧 Registered tool: ${tool.name}`);
  }

  /**
   * Get available tools
   */
  public getAvailableTools(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * Get current reasoning chain
   */
  public getReasoning(): ReasoningStep[] {
    return [...this.reasoning];
  }

  /**
   * Clear reasoning history
   */
  public clearReasoning(): void {
    this.reasoning = [];
    this.currentIteration = 0;
  }

  // Abstract methods that must be implemented by concrete agents
  
  /**
   * Generate the next action based on current state
   */
  protected abstract generateAction(userMessage: string, context: ChatMessage[]): Promise<AgentAction | null>;

  /**
   * Determine if we should finalize the response
   */
  protected abstract shouldFinalize(observation: AgentObservation): boolean;

  /**
   * Generate the final response to the user
   */
  protected abstract generateFinalResponse(userMessage: string, context: ChatMessage[]): Promise<{
    response: string;
    products?: any[];
  }>;

  /**
   * Get the system prompt for this agent
   */
  protected abstract getSystemPrompt(): string;

  /**
   * Generate messages for LLM interaction
   */
  protected generateLLMMessages(userMessage: string, context: ChatMessage[] = []): DeepSeekMessage[] {
    const messages: DeepSeekMessage[] = [];
    
    // Add system prompt
    messages.push({
      role: 'system',
      content: this.getSystemPrompt()
    });
    
    // Add context messages (limited to prevent token overflow)
    const recentContext = context.slice(-5); // Last 5 messages
    for (const msg of recentContext) {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      });
    }
    
    // Add current reasoning if available
    if (this.reasoning.length > 0) {
      const reasoningContext = this.reasoning
        .map(r => `${r.type.toUpperCase()}: ${r.content}`)
        .join('\n');
      
      messages.push({
        role: 'system',
        content: `Current reasoning chain:\n${reasoningContext}`
      });
    }
    
    // Add current user message
    messages.push({
      role: 'user',
      content: userMessage
    });
    
    return messages;
  }

  /**
   * Generate error response
   */
  protected generateErrorResponse(error: Error): string {
    console.error('Generating error response for:', error.message);
    
    return `I apologize, but I encountered an error while processing your request: ${error.message}

Please try again with a more specific question, or contact our support team if the issue persists. I can help you with:
- Finding parts by part number or description
- Checking compatibility between parts and appliance models  
- Providing installation instructions
- Troubleshooting common appliance issues

What would you like assistance with?`;
  }

  /**
   * Extract structured data from tool results
   */
  protected extractProducts(observations: AgentObservation[]): any[] {
    const products: any[] = [];
    
    for (const obs of observations) {
      if (obs.success && obs.result) {
        if (Array.isArray(obs.result.products)) {
          products.push(...obs.result.products);
        } else if (obs.result.product) {
          products.push(obs.result.product);
        } else if (obs.result.recommendedParts) {
          products.push(...obs.result.recommendedParts);
        }
      }
    }
    
    // Remove duplicates by part number
    const uniqueProducts = products.reduce((acc, product) => {
      if (product.partNumber && !acc.find((p: any) => p.partNumber === product.partNumber)) {
        acc.push(product);
      }
      return acc;
    }, []);
    
    return uniqueProducts;
  }

  /**
   * Get agent status and statistics
   */
  public getStatus() {
    return {
      currentIteration: this.currentIteration,
      maxIterations: this.maxIterations,
      reasoningSteps: this.reasoning.length,
      availableTools: this.getAvailableTools(),
      isProcessing: this.currentIteration > 0 && this.currentIteration < this.maxIterations
    };
  }
}