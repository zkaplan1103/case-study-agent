import { z } from 'zod';
import { SimpleSearchService } from '../services/SimpleSearchService';

// Simplified product search input schema
export const ProductSearchInputSchema = z.object({
  query: z.string().min(1, "Search query is required"),
  category: z.enum(['refrigerator', 'dishwasher', 'all']).optional().default('all')
});

export type ProductSearchInput = z.infer<typeof ProductSearchInputSchema>;

/**
 * Simple Product Search Tool for Instalily requirements
 * Focused on the 3 core test queries
 */
export class ProductSearchTool {
  private name = 'search_parts';
  private description = 'Search for appliance parts by part number, model, or keywords';
  private searchService = new SimpleSearchService();

  getName(): string {
    return this.name;
  }

  getDescription(): string {
    return this.description;
  }

  getInputSchema(): z.ZodSchema {
    return ProductSearchInputSchema;
  }

  /**
   * Execute part search - simplified for core functionality
   */
  async execute(input: Record<string, any>): Promise<string> {
    try {
      const { query, category } = ProductSearchInputSchema.parse(input);
      
      console.log(`ProductSearchTool: Searching for "${query}" in category "${category}"`);
      
      // Use the SimpleSearchService for consistent searching
      const searchResults = this.searchService.search(query, category);

      if (searchResults.length === 0) {
        return `No parts found matching "${query}". Please check the part number or try a different search term.`;
      }

      // Format results for agent
      let response = `Found ${searchResults.length} matching parts:\n\n`;
      
      for (const result of searchResults.slice(0, 5)) {
        const p = result.product;
        response += `**${p.partNumber} - ${p.name}**\n`;
        response += `Category: ${p.category}\n`;
        response += `Brand: ${p.brand}\n`;
        response += `Price: $${p.price}\n`;
        response += `Availability: ${p.availability}\n`;
        response += `Match reason: ${result.reason}\n`;
        
        if (p.compatibleModels.length > 0) {
          response += `Compatible models: ${p.compatibleModels.slice(0, 3).join(', ')}\n`;
        }
        
        response += `\n`;
      }

      return response;

    } catch (error: any) {
      console.error('ProductSearchTool error:', error);
      return `Error searching for parts: ${error.message}`;
    }
  }
}