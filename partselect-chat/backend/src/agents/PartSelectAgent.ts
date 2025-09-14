import { BaseAgent } from './BaseAgent';
import { AgentAction, AgentObservation, ChatMessage, LLMService, DeepSeekMessage, Tool } from '../types';
import { SearchService } from '../services/SearchService';
import { ProductSearchTool } from '../tools/ProductSearchTool';
import { CompatibilityTool } from '../tools/CompatibilityTool';
import { InstallationTool } from '../tools/InstallationTool';
import { TroubleshootingTool } from '../tools/TroubleshootingTool';

/**
 * The PartSelectAgent orchestrates the conversation by leveraging an LLM
 * to select appropriate tools and synthesize final responses.
 */
export class PartSelectAgent extends BaseAgent {

  constructor(llmService: LLMService, searchService: SearchService) {
    super(llmService);
    this.initializeTools(searchService);
  }

  /**
   * Encapsulates tool registration in a private method to keep the constructor clean.
   * @param searchService The service used by the tools.
   */
  private initializeTools(searchService: SearchService): void {
    const tools: Tool[] = [
      new ProductSearchTool(searchService),
      new CompatibilityTool(searchService),
      new InstallationTool(searchService),
      new TroubleshootingTool(searchService),
    ];
    tools.forEach(tool => this.registerTool(tool));
  }

  /**
   * Asks the LLM to decide which tool to use based on the user's message.
   * The logic is now cleaner and the prompt generation is offloaded to the LLM service.
   */
  protected async generateAction(userMessage: string, context: ChatMessage[]): Promise<AgentAction | null> {
    try {
      // The generateToolAction method will be defined in the DeepSeekService
      const response = await this.llmService.generateToolAction(userMessage, this.getToolDescriptions());
      return response;
    } catch (error) {
      console.error('Error getting tool decision from LLM:', error);
      return null;
    }
  }

  /**
   * Generates the final, user-facing response by providing the LLM with the
   * original message and the results from any tools that were executed.
   */
  protected async generateFinalResponse(userMessage: string, context: ChatMessage[], observation?: AgentObservation): Promise<{ response: string; products?: any[]; }> {
    const products = this.extractProducts(observation ? [observation] : []);

    const messages: DeepSeekMessage[] = [
      { role: 'system', content: this.getSystemPrompt() },
      { role: 'user', content: userMessage }
    ];

    if (observation && observation.success && observation.result) {
      const toolContext = `Here are the results from the tool that was used to help answer the user's question:\n\n${JSON.stringify(observation.result, null, 2)}`;
      messages.push({ role: 'system', content: toolContext });
    }

    try {
      const response = await this.llmService.generateResponse(messages);
      return { response, products };
    } catch (error) {
      console.error('Error generating final response from LLM:', error);
      throw error;
    }
  }

  /**
   * Extracts and de-duplicates product information from a series of tool observations.
   */
  private extractProducts(observations: AgentObservation[]): any[] {
    const products: any[] = [];
    const seenPartNumbers = new Set<string>();

    for (const obs of observations) {
      if (obs.success && obs.result) {
        let resultsArray: any[] = [];

        if (Array.isArray(obs.result.products)) {
          resultsArray = obs.result.products;
        } else if (obs.result.product) {
          resultsArray = [obs.result.product];
        } else if (obs.result.recommendedParts) {
          resultsArray = obs.result.recommendedParts;
        }

        for (const product of resultsArray) {
          if (product.partNumber && !seenPartNumbers.has(product.partNumber)) {
            products.push(product);
            seenPartNumbers.add(product.partNumber);
          }
        }
      }
    }
    return products;
  }

  /**
   * Defines the agent's persona, scope, and response guidelines.
   */
  protected getSystemPrompt(): string {
    return `You are a PartSelect AI assistant specializing in refrigerator and dishwasher parts.
Your scope is strictly limited to:
- Refrigerator parts and repairs.
- Dishwasher parts and repairs.
- Assisting with part search, compatibility checks, installation guides, and troubleshooting.
Your guidelines are:
- Be helpful, professional, and accurate.
- Use the provided tool results as the primary source of truth for your answers.
- If the user's question is outside your scope, politely state that you can only help with refrigerator and dishwasher parts and redirect the conversation.
- If you lack sufficient information from the tools, ask the user for clarification.
- Format your responses for clarity using lists and bold text.`;
  }

  private getToolDescriptions(): Tool[] {
    return Array.from(this.tools.values());
  }
}