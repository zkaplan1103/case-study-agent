import { DeepSeekMessage, DeepSeekResponse, LLMService, ServiceStatus, AgentAction, Tool, DeepSeekErrorResponse } from '../types';

interface DeepSeekConfig {
  apiKey?: string;
  baseUrl?: string;
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
}

/**
 * A type guard to check if an unknown object conforms to the DeepSeekErrorResponse interface.
 * @param data The object to check.
 */
function isDeepSeekErrorResponse(data: unknown): data is DeepSeekErrorResponse {
  return typeof data === 'object' && data !== null && 'error' in data;
}

/**
 * A service to handle all interactions with the DeepSeek language model.
 * It encapsulates API calls, handles configuration, and provides a clear
 * interface for agents to use.
 */
export class DeepSeekService implements LLMService {
  private config: Required<DeepSeekConfig>;
  
  constructor(config: DeepSeekConfig = {}) {
    this.config = {
      apiKey: config.apiKey || process.env.DEEPSEEK_API_KEY || '',
      baseUrl: config.baseUrl || process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
      maxTokens: config.maxTokens || 1000,
      temperature: config.temperature || 0.1,
      timeout: config.timeout || 30000
    };
  }

  /**
   * Checks if the LLM service is available for use.
   * @returns A boolean indicating service availability.
   */
  public isAvailable(): boolean {
    return !!this.config.apiKey;
  }

  /**
   * Generates a natural language response from the DeepSeek model.
   * @param messages The conversation history and prompt.
   * @returns A promise that resolves to the generated response string.
   */
  public async generateResponse(messages: DeepSeekMessage[]): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('AI service is not configured. An API key is required.');
    }
    
    try {
      const response = await this.callDeepSeekApi(messages);
      return response;
    } catch (error) {
      throw new Error('AI service is temporarily unavailable. Please try again later.');
    }
  }

  /**
   * Instructs the LLM to select a tool and its parameters based on a user's query.
   * @param userMessage The user's message.
   * @param tools An array of available tools with their descriptions and parameters.
   * @returns A promise that resolves to an AgentAction object or null.
   */
  public async generateToolAction(userMessage: string, tools: Tool[]): Promise<AgentAction | null> {
    const systemPrompt = this.getToolSelectionPrompt(tools);
    
    const messages: DeepSeekMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ];

    try {
      const response = await this.callDeepSeekApi(messages);
      const toolDecision = JSON.parse(response.trim());
      
      if (!toolDecision || toolDecision.tool === undefined) {
        throw new Error('Invalid or empty tool decision from AI.');
      }

      if (toolDecision.tool === null) {
        return null;
      }
      
      return {
        tool: toolDecision.tool,
        parameters: toolDecision.parameters || {},
        reasoning: toolDecision.reasoning || 'Tool selected by AI reasoning.'
      };
      
    } catch (error) {
      throw new Error('Failed to parse tool selection from AI response.');
    }
  }

  /**
   * Private method to handle the API call to DeepSeek.
   * @param messages The messages to send to the API.
   * @returns A promise that resolves to the raw content from the API.
   */
  private async callDeepSeekApi(messages: DeepSeekMessage[]): Promise<string> {
    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: messages,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        stream: false
      }),
      signal: AbortSignal.timeout(this.config.timeout)
    });
    
    if (!response.ok) {
      const errorData: unknown = await response.json().catch(() => ({}));
      if (isDeepSeekErrorResponse(errorData) && errorData.error?.message) {
        throw new Error(`API error: ${response.status} - ${errorData.error.message}`);
      }
      throw new Error(`API error: ${response.status} - Unknown error`);
    }
    
    const data: unknown = await response.json();
    
    if (!data || typeof data !== 'object' || !('choices' in data) || !Array.isArray(data.choices) || data.choices.length === 0 || !('message' in data.choices[0]) || !data.choices[0].message || typeof data.choices[0].message !== 'object' || !('content' in data.choices[0].message)) {
      throw new Error('Empty or invalid response from AI service.');
    }
    
    return (data as DeepSeekResponse).choices[0].message.content.trim();
  }

  /**
   * Creates the system prompt that instructs the LLM on how to select a tool.
   * @private
   */
  private getToolSelectionPrompt(tools: Tool[]): string {
    const toolDescriptions = tools.map(tool => 
      `- ${tool.name}: ${tool.description}\n  Parameters: ${JSON.stringify(tool.parameters)}`
    ).join('\n');
    
    return `You are an AI assistant responsible for selecting the correct tool to answer a user's query. You have access to the following tools:
${toolDescriptions}

Based on the user's message, you must respond with ONLY a single, valid JSON object specifying the tool to use.
The JSON object should have the following structure:
{
  "tool": "ToolName",
  "parameters": { /* parameters for the tool */ },
  "reasoning": "A brief explanation of why you chose this specific tool."
}

If no tool is appropriate for the user's query, respond with:
{
  "tool": null,
  "reasoning": "No relevant tool was found for the user's request."
}`;
  }

  /**
   * Provides the health status of the service.
   * @returns A ServiceStatus object.
   */
  public getStatus(): ServiceStatus {
    const configured = this.isAvailable();
    return {
      status: configured ? 'healthy' : 'unhealthy',
      configured: configured,
      details: configured ? 'DeepSeek API configured and ready' : 'DeepSeek API not configured - API key required',
      metadata: {
        config: {
          baseUrl: this.config.baseUrl,
          maxTokens: this.config.maxTokens,
          temperature: this.config.temperature,
          timeout: this.config.timeout
        }
      }
    };
  }
}