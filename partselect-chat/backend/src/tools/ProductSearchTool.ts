import { Tool, ToolResult, ProductSearchParams, SearchResult } from '../types';
import { SearchService } from '../services/SearchService';

// Note: Using a type alias for clarity on the expected parameters
type ProductSearchToolParameters = ProductSearchParams;

/**
 * A tool to search for appliance parts using various criteria such as part number,
 * query, brand, or category. It interacts with the SearchService to perform the
 * search and formats the results for the agent.
 */
export class ProductSearchTool implements Tool {
  /**
   * The name of the tool, used by the agent to identify it.
   */
  public readonly name = 'ProductSearch';

  /**
   * A detailed description of the tool's function.
   */
  public readonly description = 'Search for appliance parts by part number, product name, brand, or category (refrigerator/dishwasher).';

  /**
   * The expected parameters for the tool, including their type and description.
   */
  public readonly parameters = {
    query: { type: 'string', description: 'Search query or product description' },
    partNumber: { type: 'string', description: 'Specific part number to search for' },
    category: { type: 'string', enum: ['refrigerator', 'dishwasher'], description: 'Appliance category' },
    brand: { type: 'string', description: 'Brand name (Whirlpool, GE, Frigidaire, etc.)' },
    limit: { type: 'number', description: 'Maximum number of results (default: 5)' }
  };

  /**
   * @param searchService - An instance of the SearchService to be used for data retrieval.
   */
  constructor(private searchService: SearchService) {}

  /**
   * Executes the product search based on the provided parameters.
   * @param parameters - A record of string keys and any values. Expected to contain search criteria.
   * @returns A promise that resolves to a ToolResult object indicating success or failure.
   */
  public async execute(parameters: Record<string, any>): Promise<ToolResult> {
    const searchParams: ProductSearchToolParameters = parameters;

    console.log(`[ProductSearchTool] - Executing with parameters: ${JSON.stringify(searchParams)}`);

    try {
      const searchResult = await this.searchService.searchProducts(searchParams);

      const summary = this.generateSearchSummary(searchResult, searchParams);

      console.log(`[ProductSearchTool] - Search complete. Found ${searchResult.totalCount} total results.`);
      
      return {
        success: true,
        data: {
          summary,
          products: searchResult.products,
          suggestions: searchResult.suggestions,
        },
        metadata: {
          searchTerms: searchResult.searchTerms,
          resultCount: searchResult.products.length,
          totalCount: searchResult.totalCount
        }
      };

    } catch (error) {
      const errorMessage = `Search failed: ${(error as Error).message}`;
      console.error(`[ProductSearchTool] - Execution failed due to an exception: ${errorMessage}`);
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Generates a concise summary message from the search results.
   * @param searchResult - The search result object.
   * @param searchParams - The original search parameters.
   * @returns A string summary of the search outcome.
   */
  private generateSearchSummary(searchResult: SearchResult, _searchParams: ProductSearchParams): string {
    const { products, totalCount, searchTerms } = searchResult;

    if (totalCount === 0) {
      if (searchResult.suggestions && searchResult.suggestions.length > 0) {
        return `No products found matching your search criteria. Try: ${searchResult.suggestions.join(', ')}`;
      }
      return 'No products found matching your search criteria. Try broadening your search terms.';
    }

    const description = searchTerms.length > 0 ? 
      `for ${searchTerms.join(', ')}` : 
      'in our database';

    if (totalCount === 1) {
      const product = products[0];
      return `Found 1 product ${description}: ${product.name} (${product.partNumber}).`;
    }

    const topProduct = products[0];
    const summary = `Found ${totalCount} products ${description}. Top result is ${topProduct.name} (${topProduct.partNumber}).`;

    return summary;
  }
}