import {
  ReasoningStep,
  AgentAction,
  AgentObservation,
  ChatMessage,
  Tool,
  LLMService
} from '../types';

/**
 * An abstract base class for creating agents that follow a simplified
 * ReAct (Reason+Act) pattern. It orchestrates a single-turn loop:
 * Think (LLM decides tool) -> Act (execute tool) -> Observe (get result) -> Synthesize (LLM creates final response).
 */
export abstract class BaseAgent {
  protected readonly tools: Map<string, Tool> = new Map();
  protected reasoning: ReasoningStep[] = [];

  constructor(protected llmService: LLMService) {}

  /**
   * The main entry point for processing a user's query.
   * @param userMessage The message from the user.
   * @param context The history of the conversation.
   * @returns A promise that resolves to the agent's final response.
   */
  public async processQuery(userMessage: string, context: ChatMessage[] = []): Promise<{
    response: string;
    reasoning: ReasoningStep[];
    products?: any[];
    error?: string;
  }> {
    this.clearReasoning();

    try {
      this.think('Determining the appropriate tool to use based on the user\'s message.');
      const action = await this.generateAction(userMessage, context);

      if (!action || action.tool === 'null') {
        const finalResponse = await this.generateFinalResponse(userMessage, context);
        return {
          ...finalResponse,
          reasoning: this.reasoning
        };
      }

      const observation = await this.executeAction(action);
      this.observe(observation, action.tool);

      const finalResponse = await this.generateFinalResponse(userMessage, context, observation);

      return {
        ...finalResponse,
        reasoning: this.reasoning
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      this.reasoning.push({ step: this.reasoning.length + 1, type: 'observation', content: `An error occurred: ${errorMessage}`, result: null, tool: 'agent', timestamp: new Date() });
      return {
        response: this.generateErrorResponse(errorMessage),
        reasoning: this.reasoning,
        error: errorMessage
      };
    }
  }

  /**
   * Executes a tool based on the provided action and returns the result.
   * @param action The action specifying which tool to use and with what parameters.
   * @returns An observation containing the result of the tool execution.
   */
  protected async executeAction(action: AgentAction): Promise<AgentObservation> {
    this.act(action);
    const tool = this.tools.get(action.tool);

    if (!tool) {
      const errorMsg = `Tool '${action.tool}' not found.`;
      return { success: false, error: errorMsg, result: null };
    }

    try {
      const result = await tool.execute(action.parameters);
      return { success: true, result: result };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown tool execution error occurred.';
      return { success: false, error: errorMessage, result: null };
    }
  }

  /**
   * Registers a new tool for the agent to use.
   * @param tool The tool to register.
   */
  public registerTool(tool: Tool): void {
    if (this.tools.has(tool.name)) {
      // In a production environment, this might be an error instead of a warning
    }
    this.tools.set(tool.name, tool);
  }

  public getAvailableTools(): string[] {
    return Array.from(this.tools.keys());
  }

  public getReasoning(): ReasoningStep[] {
    return [...this.reasoning];
  }

  public clearReasoning(): void {
    this.reasoning = [];
  }

  protected think(thought: string): void {
    this.reasoning.push({ step: this.reasoning.length + 1, type: 'thought', content: thought, timestamp: new Date() });
  }

  protected act(action: AgentAction): void {
    this.reasoning.push({ step: this.reasoning.length + 1, type: 'action', content: action.reasoning, tool: action.tool, parameters: action.parameters, timestamp: new Date() });
  }

  protected observe(observation: AgentObservation, toolName: string): void {
    this.reasoning.push({ step: this.reasoning.length + 1, type: 'observation', content: observation.success ? `Tool ${toolName} executed successfully.` : `Tool ${toolName} failed: ${observation.error}`, result: observation.result, tool: toolName, timestamp: new Date() });
  }

  protected abstract generateAction(userMessage: string, context: ChatMessage[]): Promise<AgentAction | null>;
  protected abstract generateFinalResponse(userMessage: string, context: ChatMessage[], observation?: AgentObservation): Promise<{ response: string; products?: any[]; }>;
  protected abstract getSystemPrompt(): string;

  protected generateErrorResponse(_errorMessage: string): string {
    return `I apologize, but I encountered an error and am unable to complete your request at this time. Please try again later.`;
  }
}