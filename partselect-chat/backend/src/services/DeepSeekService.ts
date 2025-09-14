import axios, { AxiosInstance, AxiosError } from 'axios';
import { DeepSeekMessage, DeepSeekResponse, LLMService, ServiceStatus, DeepSeekErrorResponse } from '../types';

interface DeepSeekConfig {
  apiKey?: string;
  baseUrl?: string;
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
}


/**
 * A service to handle all interactions with the DeepSeek language model.
 * It encapsulates API calls, handles configuration, and provides a clear
 * interface for agents to use.
 */
export class DeepSeekService implements LLMService {
  private config: Required<DeepSeekConfig>;
  private axiosInstance: AxiosInstance;

  constructor(config: DeepSeekConfig = {}) {
    this.config = {
      apiKey: config.apiKey || process.env.DEEPSEEK_API_KEY || '',
      baseUrl: config.baseUrl || process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
      maxTokens: config.maxTokens || 1000,
      temperature: config.temperature || 0.1,
      timeout: config.timeout || 30000
    };

    this.axiosInstance = axios.create({
      baseURL: this.config.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      timeout: this.config.timeout,
    });
  }


  /**
   * Generates a natural language response from the DeepSeek model.
   * @param messages The conversation history and prompt.
   * @returns A promise that resolves to the generated response string.
   */
  public async generateResponse(messages: DeepSeekMessage[]): Promise<string> {
    if (!this.config.apiKey) {
      throw new Error('AI service is not configured. An API key is required.');
    }
    
    try {
      const response = await this.callDeepSeekApi(messages);
      return response;
    } catch (_error) {
      throw new Error('AI service is temporarily unavailable. Please try again later.');
    }
  }


  /**
   * Private method to handle the API call to DeepSeek.
   * @param messages The messages to send to the API.
   * @returns A promise that resolves to the raw content from the API.
   */
  private async callDeepSeekApi(messages: DeepSeekMessage[]): Promise<string> {
    try {
      const response = await this.axiosInstance.post<DeepSeekResponse>('/chat/completions', {
        model: 'deepseek-chat',
        messages: messages,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        stream: false
      });
      
      const data = response.data;
      
      if (!data || !('choices' in data) || !Array.isArray(data.choices) || data.choices.length === 0 || !data.choices[0].message || !('content' in data.choices[0].message)) {
        throw new Error('Empty or invalid response from AI service.');
      }
      
      return data.choices[0].message.content.trim();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<DeepSeekErrorResponse>;
        if (axiosError.response?.data?.error?.message) {
          throw new Error(`API error: ${axiosError.response.status} - ${axiosError.response.data.error.message}`);
        }
        throw new Error(`API error: ${axiosError.response?.status} - Unknown error`);
      }
      throw error;
    }
  }


  /**
   * Provides the health status of the service.
   * @returns A ServiceStatus object.
   */
  public getStatus(): ServiceStatus {
    const configured = !!this.config.apiKey;
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