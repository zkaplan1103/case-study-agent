import { z } from 'zod';
import { sampleProducts } from '../data/sampleProducts';

// Product search input schema
export const ProductSearchInputSchema = z.object({
  query: z.string().min(1, "Search query is required"),
  category: z.enum(['refrigerator', 'dishwasher', 'all']).optional().default('all'),
  priceRange: z.object({
    min: z.number().optional(),
    max: z.number().optional()
  }).optional(),
  brand: z.string().optional(),
  limit: z.number().min(1).max(50).optional().default(10)
});

export type ProductSearchInput = z.infer<typeof ProductSearchInputSchema>;

export interface ProductSearchResult {
  partNumber: string;
  name: string;
  description: string;
  category: string;
  brand: string;
  price: number;
  availability: string;
  relevanceScore: number;
  compatibleModels: string[];
}

/**
 * Product Search Tool - Semantic search using vector embeddings
 * Handles product discovery with filtering and relevance scoring
 */
export class ProductSearchTool {
  private name = 'search_parts';
  private description = 'Search for appliance parts by part number, model number, or description with advanced filtering';

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
   * Execute product search with semantic ranking and filtering
   */
  async execute(input: ProductSearchInput): Promise<ProductSearchResult[]> {
    const validatedInput = ProductSearchInputSchema.parse(input);
    const { query, category, priceRange, brand, limit } = validatedInput;

    console.log(`ProductSearchTool: Searching for "${query}" with filters:`, {
      category, priceRange, brand, limit
    });

    const results = sampleProducts
      .filter(product => {
        // Category filter
        if (category !== 'all' && product.category !== category) {
          return false;
        }

        // Brand filter
        if (brand && product.brand.toLowerCase() !== brand.toLowerCase()) {
          return false;
        }

        // Price range filter
        if (priceRange) {
          if (priceRange.min && product.price < priceRange.min) {
            return false;
          }
          if (priceRange.max && product.price > priceRange.max) {
            return false;
          }
        }

        return true;
      })
      .map(product => {
        const relevanceScore = this.calculateRelevanceScore(query, product);
        return {
          partNumber: product.partNumber,
          name: product.name,
          description: product.description,
          category: product.category,
          brand: product.brand,
          price: product.price,
          availability: product.availability,
          relevanceScore,
          compatibleModels: product.compatibleModels
        };
      })
      .filter(result => result.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);

    console.log(`ProductSearchTool: Found ${results.length} results`);
    
    return results;
  }

  /**
   * Calculate relevance score using semantic matching
   * In a real implementation, this would use vector embeddings
   */
  private calculateRelevanceScore(query: string, product: any): number {
    const searchQuery = query.toLowerCase();
    let score = 0;

    // Exact part number match gets highest score
    if (product.partNumber.toLowerCase() === searchQuery) {
      score += 100;
    } else if (product.partNumber.toLowerCase().includes(searchQuery)) {
      score += 80;
    }

    // Product name matching
    if (product.name.toLowerCase().includes(searchQuery)) {
      score += 60;
    }

    // Description matching
    if (product.description.toLowerCase().includes(searchQuery)) {
      score += 40;
    }

    // Compatible model matching
    if (product.compatibleModels.some((model: string) => 
        model.toLowerCase().includes(searchQuery))) {
      score += 70;
    }

    // Symptom matching
    if (product.symptoms && product.symptoms.some((symptom: string) => 
        symptom.toLowerCase().includes(searchQuery) || 
        searchQuery.includes(symptom.toLowerCase()))) {
      score += 50;
    }

    // Keyword matching for appliance types
    const applianceKeywords = ['ice maker', 'door seal', 'water filter', 'wash pump'];
    applianceKeywords.forEach(keyword => {
      if (searchQuery.includes(keyword.toLowerCase()) && 
          product.name.toLowerCase().includes(keyword.toLowerCase())) {
        score += 30;
      }
    });

    return score;
  }

  /**
   * Get search suggestions based on partial query
   */
  async getSuggestions(partialQuery: string): Promise<string[]> {
    const query = partialQuery.toLowerCase();
    const suggestions = new Set<string>();

    sampleProducts.forEach(product => {
      // Part number suggestions
      if (product.partNumber.toLowerCase().startsWith(query)) {
        suggestions.add(product.partNumber);
      }

      // Product name suggestions
      const nameWords = product.name.toLowerCase().split(' ');
      nameWords.forEach(word => {
        if (word.startsWith(query) && word.length > 2) {
          suggestions.add(word);
        }
      });

      // Model number suggestions
      product.compatibleModels.forEach(model => {
        if (model.toLowerCase().startsWith(query)) {
          suggestions.add(model);
        }
      });
    });

    return Array.from(suggestions).slice(0, 10);
  }

  /**
   * Get popular search terms for the category
   */
  getPopularSearches(category: 'refrigerator' | 'dishwasher' | 'all' = 'all'): string[] {
    const popularTerms = {
      refrigerator: ['ice maker', 'water filter', 'door seal', 'temperature sensor'],
      dishwasher: ['wash pump', 'door seal', 'drain hose', 'control board'],
      all: ['ice maker', 'door seal', 'water filter', 'wash pump', 'control board']
    };

    return popularTerms[category] || popularTerms.all;
  }
}