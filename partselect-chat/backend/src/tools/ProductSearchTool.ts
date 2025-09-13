import { Tool, ToolResult } from '../types';
import { SearchService } from '../services/SearchService';
import { ProductSearchToolSchema } from '../data/schemas';

export class ProductSearchTool implements Tool {
  public readonly name = 'ProductSearch';
  public readonly description = 'Search for appliance parts by part number, product name, brand, or category (refrigerator/dishwasher)';
  public readonly parameters = {
    query: { type: 'string', description: 'Search query or product description' },
    partNumber: { type: 'string', description: 'Specific part number to search for' },
    category: { type: 'string', enum: ['refrigerator', 'dishwasher'], description: 'Appliance category' },
    brand: { type: 'string', description: 'Brand name (Whirlpool, GE, Frigidaire, etc.)' },
    limit: { type: 'number', description: 'Maximum number of results (default: 5)' }
  };

  constructor(private searchService: SearchService) {}

  public async execute(parameters: Record<string, any>): Promise<ToolResult> {
    try {
      console.log('🔍 ProductSearchTool executing with parameters:', parameters);

      // Validate parameters
      const validation = ProductSearchToolSchema.safeParse(parameters);
      if (!validation.success) {
        return {
          success: false,
          error: `Invalid parameters: ${validation.error.errors.map(e => e.message).join(', ')}`
        };
      }

      const searchParams = validation.data;

      // Perform the search
      const searchResult = await this.searchService.searchProducts(searchParams);

      // Format results for agent
      const formattedResult = {
        products: searchResult.products,
        totalCount: searchResult.totalCount,
        searchTerms: searchResult.searchTerms,
        suggestions: searchResult.suggestions,
        summary: this.generateSearchSummary(searchResult, searchParams)
      };

      console.log(`✅ ProductSearchTool found ${searchResult.products.length} products`);

      return {
        success: true,
        data: formattedResult,
        metadata: {
          searchType: this.determineSearchType(searchParams),
          resultCount: searchResult.products.length
        }
      };

    } catch (error) {
      console.error('❌ ProductSearchTool error:', error);
      return {
        success: false,
        error: `Search failed: ${(error as Error).message}`
      };
    }
  }

  private generateSearchSummary(searchResult: any, searchParams: any): string {
    const { products, totalCount, searchTerms } = searchResult;

    if (totalCount === 0) {
      return `No products found matching your search criteria. ${
        searchResult.suggestions ? 
        `Try: ${searchResult.suggestions.join(', ')}` : 
        'Try broadening your search terms.'
      }`;
    }

    const searchDescription = searchTerms.length > 0 ? 
      `for ${searchTerms.join(', ')}` : 
      'in our database';

    if (totalCount === 1) {
      const product = products[0];
      return `Found 1 product ${searchDescription}: ${product.name} (${product.partNumber}) - $${product.price} - ${product.availability}`;
    }

    const topProduct = products[0];
    const summary = `Found ${totalCount} products ${searchDescription}. Top result: ${topProduct.name} (${topProduct.partNumber}) - $${topProduct.price}`;

    if (searchParams.partNumber) {
      return `${summary}. This appears to be ${searchParams.partNumber === topProduct.partNumber ? 'an exact' : 'a partial'} part number match.`;
    }

    return summary;
  }

  private determineSearchType(searchParams: any): string {
    if (searchParams.partNumber) return 'part_number';
    if (searchParams.query) return 'text_search';
    if (searchParams.brand && searchParams.category) return 'brand_category';
    if (searchParams.category) return 'category';
    if (searchParams.brand) return 'brand';
    return 'general';
  }
}