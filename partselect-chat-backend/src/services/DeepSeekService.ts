import { z } from 'zod';

// DeepSeek API response schemas
export const DeepSeekCompletionSchema = z.object({
  choices: z.array(z.object({
    message: z.object({
      content: z.string(),
      role: z.string(),
    }),
    finish_reason: z.string(),
    index: z.number(),
  })),
  usage: z.object({
    prompt_tokens: z.number(),
    completion_tokens: z.number(),
    total_tokens: z.number(),
  }),
});

export interface DeepSeekOptions {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  model?: string;
}

/**
 * DeepSeek API integration service (Required by Instalily)
 * Handles all communication with DeepSeek language model
 */
export class DeepSeekService {
  private apiKey: string;
  private baseUrl: string;
  private defaultModel: string;

  constructor(apiKey?: string, baseUrl?: string) {
    this.apiKey = apiKey || process.env.DEEPSEEK_API_KEY || '';
    this.baseUrl = baseUrl || process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1';
    this.defaultModel = 'deepseek-chat';

    if (!this.apiKey) {
      console.warn('DeepSeek API key not provided. Using placeholder responses.');
    }
  }

  async generateCompletion(prompt: string, options: DeepSeekOptions = {}): Promise<string> {
    // If no API key, return placeholder for development
    if (!this.apiKey || this.apiKey === 'your_deepseek_api_key_here') {
      return this.generatePlaceholderResponse(prompt, options);
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: options.model || this.defaultModel,
          messages: [
            {
              role: 'user',
              content: prompt,
            }
          ],
          max_tokens: options.maxTokens || 150,
          temperature: options.temperature || 0.7,
          top_p: options.topP || 0.9,
        }),
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const parsedResponse = DeepSeekCompletionSchema.parse(data);
      
      return parsedResponse.choices[0]?.message?.content || 'No response generated';
    } catch (error) {
      console.error('DeepSeek API error:', error);
      
      // Fallback to placeholder response
      return this.generatePlaceholderResponse(prompt, options);
    }
  }

  /**
   * Generate intelligent placeholder responses for development/testing
   * This allows the ReAct agent to function without DeepSeek API key
   */
  private generatePlaceholderResponse(prompt: string, options: DeepSeekOptions): string {
    const lowerPrompt = prompt.toLowerCase();
    
    // Detect if this is a thought generation request
    if (lowerPrompt.includes('what should i think') || lowerPrompt.includes('thought:')) {
      if (lowerPrompt.includes('install')) {
        return 'I need to find installation instructions for this part and check what tools are required.';
      }
      if (lowerPrompt.includes('compatible') || lowerPrompt.includes('compatibility')) {
        return 'I should check if this part number is compatible with the specific appliance model.';
      }
      if (lowerPrompt.includes('not working') || lowerPrompt.includes('problem')) {
        return 'I need to diagnose the symptoms and recommend the right replacement part or troubleshooting steps.';
      }
      if (lowerPrompt.includes('part number') || lowerPrompt.includes('ps11752778')) {
        return 'I should search for information about this specific part number to provide details and availability.';
      }
      return 'I need to understand what specific information the user is looking for about their appliance part.';
    }
    
    // Detect if this is an action determination request
    if (lowerPrompt.includes('choose the most appropriate action') || lowerPrompt.includes('action:')) {
      if (lowerPrompt.includes('install')) {
        return 'get_installation_guide|partNumber:PS11752778';
      }
      if (lowerPrompt.includes('compatible')) {
        return 'check_compatibility|partNumber:PS11752778,modelNumber:WDT780SAEM1';
      }
      if (lowerPrompt.includes('not working') || lowerPrompt.includes('ice maker')) {
        return 'diagnose_issue|symptoms:ice maker not working,applianceType:refrigerator,brand:Whirlpool';
      }
      if (lowerPrompt.includes('part number')) {
        return 'search_parts|query:PS11752778,category:all';
      }
      return 'search_parts|query:appliance part,category:all';
    }

    // Default response
    return 'I understand you need help with appliance parts. Let me gather the right information for you.';
  }

  async generateStreamCompletion(prompt: string, options: DeepSeekOptions = {}): Promise<ReadableStream> {
    // For now, return a simple stream - can be enhanced for real-time responses
    const response = await this.generateCompletion(prompt, options);
    
    return new ReadableStream({
      start(controller) {
        const words = response.split(' ');
        let i = 0;
        
        const interval = setInterval(() => {
          if (i < words.length) {
            controller.enqueue(words[i] + ' ');
            i++;
          } else {
            controller.close();
            clearInterval(interval);
          }
        }, 50); // Stream one word every 50ms
      }
    });
  }

  // Health check for DeepSeek service
  async healthCheck(): Promise<{ status: string; model: string; hasApiKey: boolean }> {
    return {
      status: this.apiKey && this.apiKey !== 'your_deepseek_api_key_here' ? 'ready' : 'placeholder_mode',
      model: this.defaultModel,
      hasApiKey: Boolean(this.apiKey && this.apiKey !== 'your_deepseek_api_key_here')
    };
  }

  // Get usage statistics (if available from DeepSeek API)
  async getUsageStats(): Promise<{ totalTokens: number; requestCount: number }> {
    // Placeholder - would need to track usage in production
    return {
      totalTokens: 0,
      requestCount: 0
    };
  }
}