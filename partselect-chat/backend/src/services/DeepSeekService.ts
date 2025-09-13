import OpenAI from 'openai';
import { LLMService, DeepSeekMessage, DeepSeekResponse } from '../types';

interface DeepSeekServiceOptions {
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
}

export class DeepSeekService implements LLMService {
  private client: OpenAI | null = null;
  private isApiAvailable: boolean = false;
  private lastHealthCheck: number = 0;
  private healthCheckInterval: number = 300000; // 5 minutes
  
  constructor(private options: DeepSeekServiceOptions = {}) {
    this.initialize();
  }

  private initialize(): void {
    if (this.options.apiKey) {
      try {
        this.client = new OpenAI({
          apiKey: this.options.apiKey,
          baseURL: this.options.baseUrl || 'https://api.deepseek.com',
          timeout: this.options.timeout || 30000,
          maxRetries: this.options.maxRetries || 3
        });
        this.isApiAvailable = true;
        console.log('✅ DeepSeek API initialized successfully');
      } catch (error) {
        console.warn('⚠️ DeepSeek API initialization failed, using fallback mode:', error);
        this.isApiAvailable = false;
      }
    } else {
      console.log('⚠️ No DeepSeek API key provided, using intelligent fallback mode');
      this.isApiAvailable = false;
    }
  }

  public async generateResponse(messages: DeepSeekMessage[]): Promise<string> {
    // Check if we should attempt API call
    if (this.shouldUseApi()) {
      try {
        const response = await this.callDeepSeekApi(messages);
        if (response) {
          return response;
        }
      } catch (error) {
        console.warn('❌ DeepSeek API call failed, falling back to local processing:', error);
        this.isApiAvailable = false;
      }
    }

    // Use intelligent fallback
    return this.generateFallbackResponse(messages);
  }

  private shouldUseApi(): boolean {
    if (!this.client || !this.options.apiKey) {
      return false;
    }

    // Perform periodic health checks
    const now = Date.now();
    if (now - this.lastHealthCheck > this.healthCheckInterval) {
      this.lastHealthCheck = now;
      // In a real implementation, you might ping the API here
    }

    return this.isApiAvailable;
  }

  private async callDeepSeekApi(messages: DeepSeekMessage[]): Promise<string | null> {
    if (!this.client) return null;

    try {
      const completion = await this.client.chat.completions.create({
        model: 'deepseek-chat',
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        temperature: 0.3,
        max_tokens: 2000,
        stream: false
      });

      const response = completion.choices[0]?.message?.content;
      if (response) {
        console.log('✅ DeepSeek API response received');
        return response;
      }

      return null;
    } catch (error: any) {
      console.error('❌ DeepSeek API error:', error);
      
      // Handle different error types
      if (error.status === 429) {
        console.log('⚠️ Rate limit exceeded, backing off');
        throw new Error('Rate limit exceeded');
      } else if (error.status >= 500) {
        console.log('⚠️ Server error, API may be temporarily unavailable');
        throw new Error('Server error');
      } else {
        throw error;
      }
    }
  }

  private generateFallbackResponse(messages: DeepSeekMessage[]): string {
    console.log('🤖 Generating intelligent fallback response');
    
    const userMessage = messages.filter(m => m.role === 'user').pop()?.content || '';
    const systemMessage = messages.find(m => m.role === 'system')?.content || '';
    
    // Parse user intent from the message
    const intent = this.parseUserIntent(userMessage);
    
    switch (intent.type) {
      case 'installation':
        return this.generateInstallationResponse(intent);
      
      case 'compatibility':
        return this.generateCompatibilityResponse(intent);
      
      case 'troubleshooting':
        return this.generateTroubleshootingResponse(intent);
      
      case 'product_search':
        return this.generateProductSearchResponse(intent);
      
      case 'greeting':
        return this.generateGreetingResponse();
      
      default:
        return this.generateGeneralResponse(userMessage);
    }
  }

  private parseUserIntent(message: string): any {
    const lowerMessage = message.toLowerCase();
    
    // Check for part numbers (pattern: letters/numbers with possible dashes)
    const partNumberMatch = message.match(/(?:part\s+number\s+)?([A-Z0-9]{6,15})/i);
    const modelNumberMatch = message.match(/(?:model\s+(?:number\s+)?)?([A-Z0-9]{8,20})/i);
    
    // Installation intent
    if (lowerMessage.includes('install') || lowerMessage.includes('replace') || 
        lowerMessage.includes('how to') || lowerMessage.includes('steps')) {
      return {
        type: 'installation',
        partNumber: partNumberMatch?.[1] || null,
        modelNumber: modelNumberMatch?.[1] || null
      };
    }
    
    // Compatibility intent
    if (lowerMessage.includes('compatible') || lowerMessage.includes('fit') || 
        lowerMessage.includes('work with') || lowerMessage.includes('match')) {
      return {
        type: 'compatibility',
        partNumber: partNumberMatch?.[1] || null,
        modelNumber: modelNumberMatch?.[1] || null
      };
    }
    
    // Troubleshooting intent
    if (lowerMessage.includes('not working') || lowerMessage.includes('broken') || 
        lowerMessage.includes('problem') || lowerMessage.includes('fix') || 
        lowerMessage.includes('repair') || lowerMessage.includes('issue')) {
      return {
        type: 'troubleshooting',
        symptom: message,
        appliance: this.detectAppliance(message)
      };
    }
    
    // Product search intent
    if (lowerMessage.includes('find') || lowerMessage.includes('search') || 
        lowerMessage.includes('need') || lowerMessage.includes('looking for')) {
      return {
        type: 'product_search',
        query: message,
        appliance: this.detectAppliance(message)
      };
    }
    
    // Greeting intent
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || 
        lowerMessage.includes('help')) {
      return { type: 'greeting' };
    }
    
    return { type: 'general', message };
  }

  private detectAppliance(message: string): string | null {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('refrigerator') || lowerMessage.includes('fridge') || 
        lowerMessage.includes('freezer') || lowerMessage.includes('ice maker')) {
      return 'refrigerator';
    }
    if (lowerMessage.includes('dishwasher') || lowerMessage.includes('dish washer')) {
      return 'dishwasher';
    }
    return null;
  }

  private generateInstallationResponse(intent: any): string {
    if (intent.partNumber) {
      return `I need to find installation instructions for part number ${intent.partNumber}. Let me search for detailed installation steps and required tools for this part.

**Action**: I'll use the Installation Tool to retrieve step-by-step instructions for part ${intent.partNumber}.`;
    }
    
    return `I'll help you with installation instructions. To provide specific steps, I need to know the part number you're installing. Could you provide the part number, or let me search for compatible parts based on your appliance model?

**Action**: I'll use the Product Search Tool to find the part you need installation help with.`;
  }

  private generateCompatibilityResponse(intent: any): string {
    if (intent.partNumber && intent.modelNumber) {
      return `I'll check if part number ${intent.partNumber} is compatible with model ${intent.modelNumber}.

**Action**: I'll use the Compatibility Tool to verify compatibility between part ${intent.partNumber} and model ${intent.modelNumber}.`;
    } else if (intent.partNumber) {
      return `I need your appliance model number to check compatibility for part ${intent.partNumber}. The model number is usually found on a label inside the appliance or on the back/side.

**Action**: Once you provide the model number, I'll use the Compatibility Tool to check if this part will work with your appliance.`;
    } else if (intent.modelNumber) {
      return `I can help check compatibility for model ${intent.modelNumber}. What part are you looking to install or replace?

**Action**: I'll use the Product Search Tool to find compatible parts for your model ${intent.modelNumber}.`;
    }
    
    return `I'll help you check part compatibility. To do this accurately, I need both the part number and your appliance model number. Could you provide both?

**Action**: I'll use the Compatibility Tool once you provide the part and model numbers.`;
  }

  private generateTroubleshootingResponse(intent: any): string {
    const appliance = intent.appliance || 'appliance';
    
    return `I'll help you troubleshoot your ${appliance} issue. Let me analyze the problem and provide diagnostic steps.

**Problem**: ${intent.symptom}

**Action**: I'll use the Troubleshooting Tool to provide diagnostic steps and identify potential parts that may need replacement.`;
  }

  private generateProductSearchResponse(intent: any): string {
    const appliance = intent.appliance ? ` for your ${intent.appliance}` : '';
    
    return `I'll search for parts${appliance} based on your request.

**Action**: I'll use the Product Search Tool to find relevant parts matching your requirements.`;
  }

  private generateGreetingResponse(): string {
    return `Hello! I'm your PartSelect AI assistant, specialized in helping with refrigerator and dishwasher parts and repairs. I can help you with:

🔍 **Finding the right parts** - Search by part number, model, or description
🔧 **Installation guidance** - Step-by-step instructions with tools and safety tips  
✅ **Compatibility checking** - Verify if a part fits your specific model
🛠️ **Troubleshooting** - Diagnose problems and recommend solutions

How can I assist you today? Please tell me about your refrigerator or dishwasher issue, or let me know what part you're looking for.`;
  }

  private generateGeneralResponse(message: string): string {
    return `I understand you need help, but I specialize specifically in refrigerator and dishwasher parts and repairs. 

Could you please provide more details about:
- What appliance you're working on (refrigerator or dishwasher)
- The specific issue you're experiencing
- Any part numbers or model numbers you have
- Whether you need installation help, troubleshooting, or part compatibility checking

**Action**: I'll use the appropriate tool (Product Search, Compatibility Check, Installation Guide, or Troubleshooting) once I better understand your specific needs.`;
  }

  public isAvailable(): boolean {
    return this.isApiAvailable || true; // Always available due to fallback
  }

  // Method to manually test API connection
  public async testConnection(): Promise<boolean> {
    if (!this.client || !this.options.apiKey) {
      return false;
    }

    try {
      const testMessages: DeepSeekMessage[] = [
        { role: 'user', content: 'Hello, this is a connection test.' }
      ];
      
      await this.callDeepSeekApi(testMessages);
      this.isApiAvailable = true;
      return true;
    } catch (error) {
      this.isApiAvailable = false;
      return false;
    }
  }

  // Get service status for monitoring
  public getStatus() {
    return {
      apiAvailable: this.isApiAvailable,
      hasApiKey: !!this.options.apiKey,
      lastHealthCheck: new Date(this.lastHealthCheck),
      fallbackEnabled: true
    };
  }
}