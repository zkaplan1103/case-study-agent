import { BaseAgent, ReasoningTrace } from './BaseAgent.js';
import { PartSelectToolRegistry } from '../tools/PartSelectToolRegistry.js';
import { DeepSeekService } from '../services/DeepSeekService.js';

/**
 * PartSelect-specialized ReAct agent for appliance parts assistance
 * Implements the core business logic for refrigerator and dishwasher support
 */
export class PartSelectAgent extends BaseAgent {
  private toolRegistry: PartSelectToolRegistry;
  private deepSeekService: DeepSeekService;
  private systemPrompt: string;

  constructor(toolRegistry: PartSelectToolRegistry, deepSeekService: DeepSeekService) {
    super(
      'PartSelectAgent',
      'AI assistant specializing in refrigerator and dishwasher parts, compatibility, and installation guidance',
      6 // Allow more iterations for complex part searches
    );
    
    this.toolRegistry = toolRegistry;
    this.deepSeekService = deepSeekService;
    this.systemPrompt = this.buildSystemPrompt();
  }

  protected async generateThought(
    query: string,
    reasoning: ReasoningTrace[],
    context?: Record<string, any>
  ): Promise<string> {
    // Build conversation context for DeepSeek
    const conversationHistory = this.buildConversationHistory(query, reasoning);
    
    const thoughtPrompt = `${this.systemPrompt}

CURRENT SITUATION:
User Query: ${query}
${context?.userPreferences ? `User Context: ${JSON.stringify(context.userPreferences)}` : ''}

PREVIOUS REASONING:
${reasoning.map(r => `Thought: ${r.thought}\nAction: ${r.action}\nObservation: ${r.observation}`).join('\n\n')}

What should I think about next to help the user? Be specific about what information I need or what action to take.
Focus on: part identification, compatibility checking, installation guidance, or troubleshooting.

Thought:`;

    try {
      const response = await this.deepSeekService.generateCompletion(thoughtPrompt, {
        maxTokens: 150,
        temperature: 0.7,
      });
      
      return response.trim();
    } catch (error) {
      console.error('Error generating thought:', error);
      return `I need to analyze the user's query about ${this.extractKeyTerms(query).join(', ')}.`;
    }
  }

  protected async determineAction(
    thought: string,
    reasoning: ReasoningTrace[]
  ): Promise<{ name: string; input?: Record<string, any> }> {
    const availableTools = this.toolRegistry.listTools();
    const toolDescriptions = availableTools
      .map(tool => `${tool.name}: ${tool.description}`)
      .join('\n');

    const actionPrompt = `${this.systemPrompt}

AVAILABLE TOOLS:
${toolDescriptions}
final_answer: Provide the final answer when you have sufficient information

CURRENT THOUGHT: ${thought}

REASONING HISTORY:
${reasoning.map(r => `${r.action}: ${r.observation?.substring(0, 100)}...`).join('\n')}

Choose the most appropriate action. If you have enough information to answer the user's question, use 'final_answer'.
Otherwise, choose a tool that will help gather the needed information.

Format: ACTION_NAME|input_key1:value1,input_key2:value2

Action:`;

    try {
      const response = await this.deepSeekService.generateCompletion(actionPrompt, {
        maxTokens: 100,
        temperature: 0.3,
      });

      return this.parseActionResponse(response.trim(), availableTools);
    } catch (error) {
      console.error('Error determining action:', error);
      return { name: 'final_answer', input: { answer: 'I encountered an error while processing your request.' } };
    }
  }

  protected async executeAction(
    action: { name: string; input?: Record<string, any> }
  ): Promise<string> {
    if (action.name === 'final_answer') {
      return action.input?.answer || 'No answer provided';
    }

    try {
      const tool = this.toolRegistry.getTool(action.name);
      if (!tool) {
        return `Tool '${action.name}' not found. Available tools: ${this.toolRegistry.listTools().map(t => t.name).join(', ')}`;
      }

      const result = await tool.execute(action.input || {});
      return typeof result === 'string' ? result : JSON.stringify(result);
    } catch (error) {
      console.error(`Error executing action ${action.name}:`, error);
      return `Error executing ${action.name}: ${error.message}`;
    }
  }

  private buildSystemPrompt(): string {
    return `You are a PartSelect AI assistant specializing in refrigerator and dishwasher parts.

KEY RESPONSIBILITIES:
1. Product Discovery: Help users find specific appliance parts
2. Compatibility Verification: Check if parts work with specific models
3. Installation Guidance: Provide step-by-step installation instructions
4. Troubleshooting Support: Diagnose issues and recommend solutions
5. Order & Customer Support: Handle order inquiries and warranty information

IMPORTANT GUIDELINES:
- ONLY help with refrigerator and dishwasher parts
- Always verify part compatibility before recommending
- Provide clear, step-by-step instructions
- Ask for model numbers when needed for accuracy
- Be helpful but stay focused on appliance parts

REQUIRED TEST CASES TO HANDLE:
1. "How can I install part number PS11752778?"
2. "Is this part compatible with my WDT780SAEM1 model?"
3. "The ice maker on my Whirlpool fridge is not working. How can I fix it?"

Think step by step and use available tools to provide accurate, helpful responses.`;
  }

  private buildConversationHistory(query: string, reasoning: ReasoningTrace[]): string {
    return reasoning
      .map(r => `User context: ${query}\nThought: ${r.thought}\nAction: ${r.action}\nResult: ${r.observation}`)
      .join('\n---\n');
  }

  private extractKeyTerms(query: string): string[] {
    const terms: string[] = [];
    
    // Extract part numbers (pattern: letters + numbers)
    const partNumbers = query.match(/[A-Z]{2,}\d+/gi) || [];
    terms.push(...partNumbers);

    // Extract model numbers
    const modelNumbers = query.match(/\b[A-Z]{2,}[\d\w]+\b/gi) || [];
    terms.push(...modelNumbers);

    // Extract appliance types
    const appliances = ['refrigerator', 'fridge', 'dishwasher', 'ice maker', 'freezer'];
    appliances.forEach(appliance => {
      if (query.toLowerCase().includes(appliance)) {
        terms.push(appliance);
      }
    });

    return [...new Set(terms)]; // Remove duplicates
  }

  private parseActionResponse(
    response: string,
    availableTools: Array<{ name: string; description: string }>
  ): { name: string; input?: Record<string, any> } {
    try {
      const parts = response.split('|');
      const actionName = parts[0].trim();
      
      if (actionName === 'final_answer') {
        return { name: 'final_answer', input: { answer: parts[1] || response } };
      }

      // Validate tool exists
      const tool = availableTools.find(t => t.name === actionName);
      if (!tool) {
        return { name: 'final_answer', input: { answer: 'I need to gather more information to help you.' } };
      }

      // Parse input parameters
      let input: Record<string, any> = {};
      if (parts[1]) {
        const inputPairs = parts[1].split(',');
        inputPairs.forEach(pair => {
          const [key, value] = pair.split(':').map(s => s.trim());
          if (key && value) {
            input[key] = value;
          }
        });
      }

      return { name: actionName, input };
    } catch (error) {
      console.error('Error parsing action response:', error);
      return { name: 'final_answer', input: { answer: 'I need to process your request differently.' } };
    }
  }

  protected synthesizeFinalAnswer(reasoning: ReasoningTrace[]): string {
    const observations = reasoning
      .filter(r => r.observation && r.observation.trim())
      .map(r => r.observation);

    if (observations.length === 0) {
      return "I wasn't able to gather enough information to provide a complete answer. Could you provide more details about your appliance model or the specific part you need?";
    }

    // Combine observations into a coherent answer
    return `Based on my research: ${observations[observations.length - 1]}`;
  }
}