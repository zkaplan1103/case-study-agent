import { BaseAgent } from './BaseAgent';
import { AgentAction, AgentObservation, ChatMessage, LLMService, DeepSeekMessage } from '../types';
import { SearchService } from '../services/SearchService';
import { ProductSearchTool } from '../tools/ProductSearchTool';
import { CompatibilityTool } from '../tools/CompatibilityTool';
import { InstallationTool } from '../tools/InstallationTool';
import { TroubleshootingTool } from '../tools/TroubleshootingTool';

export class PartSelectAgent extends BaseAgent {
  private searchService: SearchService;
  private hasExecutedAction: boolean = false;
  private actionResults: AgentObservation[] = [];

  constructor(llmService: LLMService) {
    super(llmService);
    
    // Initialize search service
    this.searchService = new SearchService();
    
    // Register all tools
    this.registerTool(new ProductSearchTool(this.searchService));
    this.registerTool(new CompatibilityTool(this.searchService));
    this.registerTool(new InstallationTool(this.searchService));
    this.registerTool(new TroubleshootingTool(this.searchService));
    
    console.log('✅ PartSelectAgent initialized with tools:', this.getAvailableTools().join(', '));
  }

  protected async generateAction(userMessage: string, context: ChatMessage[]): Promise<AgentAction | null> {
    // If we've already executed an action, we're done
    if (this.hasExecutedAction) {
      return null;
    }

    // Analyze the user message to determine appropriate tool and parameters
    const intent = this.analyzeUserIntent(userMessage);
    
    await this.think(`Analyzing user message: "${userMessage}". Detected intent: ${intent.type}`);

    let action: AgentAction | null = null;

    switch (intent.type) {
      case 'installation':
        if (intent.partNumber) {
          action = {
            tool: 'InstallationGuide',
            parameters: { partNumber: intent.partNumber },
            reasoning: `User is asking for installation instructions for part ${intent.partNumber}. I'll retrieve detailed installation steps.`
          };
        } else {
          // Need to search for the part first
          action = {
            tool: 'ProductSearch',
            parameters: { 
              query: userMessage,
              limit: 3
            },
            reasoning: 'User wants installation help but no specific part number provided. I need to find the relevant part first.'
          };
        }
        break;

      case 'compatibility':
        if (intent.partNumber && intent.modelNumber) {
          action = {
            tool: 'CompatibilityCheck',
            parameters: { 
              partNumber: intent.partNumber, 
              modelNumber: intent.modelNumber 
            },
            reasoning: `User is asking about compatibility between part ${intent.partNumber} and model ${intent.modelNumber}. I'll check their compatibility.`
          };
        } else if (intent.partNumber) {
          action = {
            tool: 'ProductSearch',
            parameters: { 
              partNumber: intent.partNumber,
              limit: 1
            },
            reasoning: 'User provided part number for compatibility check but no model number. I need to get part details first.'
          };
        } else if (intent.modelNumber) {
          action = {
            tool: 'ProductSearch',
            parameters: { 
              query: userMessage,
              limit: 5
            },
            reasoning: 'User provided model number but no part number. I need to find compatible parts for their model.'
          };
        } else {
          action = {
            tool: 'ProductSearch',
            parameters: { 
              query: userMessage,
              limit: 5
            },
            reasoning: 'User is asking about compatibility but specific details are unclear. I need to search for relevant parts.'
          };
        }
        break;

      case 'troubleshooting':
        action = {
          tool: 'TroubleshootingGuide',
          parameters: {
            symptom: userMessage,
            category: intent.appliance || undefined
          },
          reasoning: `User is describing a problem: "${userMessage}". I'll provide diagnostic steps and part recommendations.`
        };
        break;

      case 'product_search':
        const searchParams: any = { 
          query: intent.query || userMessage,
          limit: 5 
        };
        
        if (intent.partNumber) searchParams.partNumber = intent.partNumber;
        if (intent.appliance) searchParams.category = intent.appliance;
        if (intent.brand) searchParams.brand = intent.brand;

        action = {
          tool: 'ProductSearch',
          parameters: searchParams,
          reasoning: `User is looking for parts. I'll search our database with the provided criteria.`
        };
        break;

      case 'general_help':
        // No specific action needed, we'll generate a general helpful response
        await this.think('User is asking for general help. I\'ll provide information about what I can assist with.');
        return null;

      default:
        // Try a general product search as fallback
        action = {
          tool: 'ProductSearch',
          parameters: { 
            query: userMessage,
            limit: 5
          },
          reasoning: 'Intent unclear, performing general search to find relevant parts or information.'
        };
        break;
    }

    this.hasExecutedAction = true;
    return action;
  }

  protected shouldFinalize(observation: AgentObservation): boolean {
    // Store observation for final response generation
    this.actionResults.push(observation);

    // For most cases, one tool execution is sufficient
    // We could extend this logic for multi-step reasoning if needed
    return true;
  }

  protected async generateFinalResponse(userMessage: string, context: ChatMessage[]): Promise<{
    response: string;
    products?: any[];
  }> {
    const intent = this.analyzeUserIntent(userMessage);
    const products = this.extractProducts(this.actionResults);
    
    await this.think(`Generating final response for ${intent.type} query with ${this.actionResults.length} tool results and ${products.length} products.`);

    let response = '';
    const latestResult = this.actionResults[this.actionResults.length - 1];

    if (!latestResult || !latestResult.success) {
      response = this.generateErrorResponse(new Error(latestResult?.error || 'Unknown error occurred'));
      return { response, products };
    }

    // Generate response based on the tool used and results
    const toolUsed = this.reasoning.find(r => r.type === 'action')?.tool;

    switch (toolUsed) {
      case 'InstallationGuide':
        response = this.generateInstallationResponse(latestResult.result, intent);
        break;
      
      case 'CompatibilityCheck':
        response = this.generateCompatibilityResponse(latestResult.result, intent);
        break;
      
      case 'TroubleshootingGuide':
        response = this.generateTroubleshootingResponse(latestResult.result, intent);
        break;
      
      case 'ProductSearch':
        response = this.generateSearchResponse(latestResult.result, intent, userMessage);
        break;
      
      default:
        response = this.generateGeneralResponse(userMessage);
        break;
    }

    // Reset for next query
    this.hasExecutedAction = false;
    this.actionResults = [];

    return { response, products };
  }

  private analyzeUserIntent(message: string): any {
    const lowerMessage = message.toLowerCase();
    
    // Extract part numbers and model numbers with better patterns
    const partNumberRegex = /(?:part\s+(?:number\s+)?)?(PS[0-9]{8}|WPW[0-9]{8}|W[0-9]{8}|[0-9]{10})\b/i;
    const modelNumberRegex = /(?:model\s+(?:number\s+)?)?(WDT[A-Z0-9]{7,12}|WRF[A-Z0-9]{7,12})/i;
    
    // First extract part numbers, then look for model numbers in remaining text
    const partNumberMatch = message.match(partNumberRegex);
    const partNumber = partNumberMatch ? partNumberMatch[1] : null;
    
    // Remove found part number from message and then search for model number  
    const remainingMessage = partNumber ? message.replace(partNumber, '') : message;
    const modelNumberMatch = remainingMessage.match(modelNumberRegex);
    const modelNumber = modelNumberMatch ? modelNumberMatch[1] : null;
    
    // Detect appliance type
    const isRefrigerator = /refrigerator|fridge|freezer|ice\s+maker/i.test(message);
    const isDishwasher = /dishwasher|dish\s+washer/i.test(message);
    
    // Detect brand
    const brandMatch = message.match(/\b(whirlpool|ge|frigidaire|kenmore|maytag|kitchenaid|lg|samsung)\b/i);

    // Installation intent
    if (/install|replace|how\s+to|steps|instructions|guide|setup/i.test(message)) {
      return {
        type: 'installation',
        partNumber: partNumber,
        appliance: isRefrigerator ? 'refrigerator' : isDishwasher ? 'dishwasher' : null,
        brand: brandMatch?.[1] || null
      };
    }
    
    // Compatibility intent
    if (/compatible|compatibility|fit|fits|work\s+with|match|matches/i.test(message)) {
      return {
        type: 'compatibility',
        partNumber: partNumber,
        modelNumber: modelNumber,
        appliance: isRefrigerator ? 'refrigerator' : isDishwasher ? 'dishwasher' : null
      };
    }
    
    // Troubleshooting intent
    if (/not\s+working|broken|problem|issue|fix|repair|troubleshoot|won't|doesn't|stopped/i.test(message)) {
      return {
        type: 'troubleshooting',
        symptom: message,
        appliance: isRefrigerator ? 'refrigerator' : isDishwasher ? 'dishwasher' : null,
        brand: brandMatch?.[1] || null
      };
    }
    
    // Product search intent
    if (/find|search|looking\s+for|need|want|where|buy|purchase|part/i.test(message) || partNumberMatch) {
      return {
        type: 'product_search',
        query: message,
        partNumber: partNumber,
        appliance: isRefrigerator ? 'refrigerator' : isDishwasher ? 'dishwasher' : null,
        brand: brandMatch?.[1] || null
      };
    }
    
    // General help intent
    if (/hello|hi|help|what\s+can|how\s+can\s+you/i.test(message)) {
      return { type: 'general_help' };
    }
    
    return { 
      type: 'general',
      query: message,
      partNumber: partNumberMatch?.[1] || null,
      modelNumber: modelNumberMatch?.[1] || null,
      appliance: isRefrigerator ? 'refrigerator' : isDishwasher ? 'dishwasher' : null,
      brand: brandMatch?.[1] || null
    };
  }

  private generateInstallationResponse(result: any, intent: any): string {
    const { summary, formattedInstructions } = result.data || {};
    
    if (!summary || !formattedInstructions) {
      return `I found installation instructions for the requested part, but encountered an issue formatting the response. Please try again or contact support for assistance.`;
    }
    
    return `${summary}\n\n${formattedInstructions}

Need additional help? I can also:
- Check part compatibility with your specific model
- Help troubleshoot any installation issues
- Find alternative parts if needed

Just let me know how else I can assist you!`;
  }

  private generateCompatibilityResponse(result: any, intent: any): string {
    const { summary, recommendation } = result.data || {};
    
    if (!summary || !recommendation) {
      return `I checked the compatibility for the requested part and model, but encountered an issue formatting the response. Please try again or contact support for assistance.`;
    }
    
    return `${summary}\n\n**Recommendation**: ${recommendation}

Would you like me to:
- Provide installation instructions for this part?
- Search for alternative compatible parts?
- Help with any other questions about your repair?`;
  }

  private generateTroubleshootingResponse(result: any, intent: any): string {
    const { summary, diagnosticGuide, recommendedParts } = result.data || {};
    
    if (!summary || !diagnosticGuide) {
      return `I analyzed the troubleshooting issue, but encountered an issue formatting the response. Please try again or contact support for assistance.`;
    }
    
    let response = `${summary}\n\n${diagnosticGuide}`;

    if (recommendedParts && recommendedParts.length > 0) {
      response += `\n## Recommended Replacement Parts\n\n`;
      recommendedParts.forEach((part: any, index: number) => {
        response += `**${index + 1}. ${part.name}** (${part.partNumber})\n`;
        response += `- Price: $${part.price}\n`;
        response += `- Availability: ${part.availability}\n`;
        response += `- Installation: ${part.installationDifficulty} difficulty\n\n`;
      });
    }

    response += `\nNeed more help? I can:
- Provide detailed installation instructions for any recommended parts
- Check compatibility with your specific model number
- Search for alternative parts if needed

What would you like assistance with next?`;

    return response;
  }

  private generateSearchResponse(result: any, intent: any, userMessage: string): string {
    const { products, summary, suggestions } = result.data || {};

    if (products.length === 0) {
      return `${summary}

${suggestions ? suggestions.join('\n- ') : ''}

Let me help you find what you're looking for:
- Provide your appliance model number for compatible parts
- Try different search terms or part descriptions  
- Browse by category (refrigerator or dishwasher)
- Contact our support team for personalized assistance`;
    }

    let response = `${summary}\n\n## Search Results\n\n`;

    products.forEach((product: any, index: number) => {
      response += `**${index + 1}. ${product.name}** (${product.partNumber})\n`;
      response += `- Price: $${product.price} | ${product.availability}\n`;
      response += `- Brand: ${product.brand} | Category: ${product.category}\n`;
      response += `- Installation: ${product.installationDifficulty} difficulty (${product.estimatedInstallTime} min)\n`;
      
      if (product.compatibleModels && product.compatibleModels.length > 0) {
        response += `- Compatible with: ${product.compatibleModels.slice(0, 3).join(', ')}${product.compatibleModels.length > 3 ? ' and more' : ''}\n`;
      }
      response += `\n`;
    });

    response += `How can I help you next?
- Get installation instructions for any of these parts
- Check compatibility with your specific model
- Get more details about any part
- Troubleshoot a specific problem

Just let me know what you need!`;

    return response;
  }

  private generateGeneralResponse(userMessage: string): string {
    return `Hello! I'm your PartSelect AI assistant, specialized in helping with **refrigerator** and **dishwasher** parts and repairs. 

Here's how I can help you:

🔍 **Find Parts**
- Search by part number, description, or appliance model
- Browse by brand (Whirlpool, GE, Frigidaire, etc.)
- Get pricing and availability information

✅ **Check Compatibility** 
- Verify if a part fits your specific appliance model
- Find alternative compatible parts
- Get confidence ratings for part matches

🔧 **Installation Guidance**
- Step-by-step installation instructions
- Required tools and safety warnings
- Difficulty ratings and time estimates

🛠️ **Troubleshoot Problems**
- Diagnose common refrigerator and dishwasher issues
- Get diagnostic steps to identify problems
- Receive part recommendations for repairs

**What would you like help with today?** Just describe your appliance issue, provide a part number, or let me know what you're looking for!`;
  }

  protected getSystemPrompt(): string {
    return `You are a PartSelect AI assistant specializing in refrigerator and dishwasher parts and repairs. Your knowledge is focused on:

SCOPE:
- Refrigerator parts and repairs only
- Dishwasher parts and repairs only
- Installation, compatibility, troubleshooting, and part search

CAPABILITIES:
- ProductSearch: Find parts by number, name, brand, or category
- CompatibilityCheck: Verify part compatibility with appliance models  
- InstallationGuide: Provide step-by-step installation instructions
- TroubleshootingGuide: Diagnose problems and recommend solutions

GUIDELINES:
- Always be helpful, professional, and accurate
- Use appropriate tools based on user intent
- Provide specific part numbers, prices, and installation details
- Include safety warnings and professional service recommendations when needed
- Stay within scope - politely redirect non-refrigerator/dishwasher questions
- Be concise but comprehensive in responses

RESPONSE FORMAT:
- Use clear formatting with headers and bullet points
- Include specific part information (numbers, prices, availability)
- Provide actionable next steps
- Offer additional assistance options

Remember: You have access to real-time part data and should use the appropriate tools to provide accurate, current information.`;
  }
}