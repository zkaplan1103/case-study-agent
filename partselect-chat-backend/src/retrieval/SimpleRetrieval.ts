/**
 * Simplified Retrieval System for PartSelect Chat Agent
 * Focused on core functionality needed for Instalily requirements
 */

import { EnhancedProduct } from '../types/dataSchemas';

export interface SearchQuery {
  query: string;
  category?: 'refrigerator' | 'dishwasher' | 'all';
  filters?: {
    brand?: string;
    partNumber?: string;
    modelNumber?: string;
  };
}

export interface SearchResult {
  product: EnhancedProduct;
  score: number;
  matchType: 'exact_part' | 'model_match' | 'keyword' | 'description';
}

export class SimpleRetrievalService {
  private products: EnhancedProduct[] = [];

  constructor(products: EnhancedProduct[] = []) {
    this.products = products;
  }

  /**
   * Simple but effective search for the 3 required Instalily queries
   */
  async search(query: SearchQuery): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const searchTerm = query.query.toLowerCase();

    // Extract part numbers and model numbers from query
    const partNumbers = this.extractPartNumbers(searchTerm);
    const modelNumbers = this.extractModelNumbers(searchTerm);

    for (const product of this.products) {
      let score = 0;
      let matchType: SearchResult['matchType'] = 'keyword';

      // 1. Exact part number match (highest priority)
      if (partNumbers.some(pn => product.partNumber.toLowerCase().includes(pn))) {
        score += 1.0;
        matchType = 'exact_part';
      }

      // 2. Model compatibility match
      if (modelNumbers.length > 0) {
        const hasModelMatch = modelNumbers.some(mn => 
          product.compatibleModels.some(cm => 
            cm.toLowerCase().includes(mn)
          )
        );
        if (hasModelMatch) {
          score += 0.8;
          matchType = 'model_match';
        }
      }

      // 3. Category filter
      if (query.category && query.category !== 'all') {
        if (product.category === query.category) {
          score += 0.3;
        } else {
          continue; // Skip if category doesn't match
        }
      }

      // 4. Brand filter
      if (query.filters?.brand) {
        if (product.brand?.toLowerCase().includes(query.filters.brand.toLowerCase())) {
          score += 0.2;
        } else {
          continue; // Skip if brand doesn't match
        }
      }

      // 5. Keyword matching in name and description
      const productText = `${product.name} ${product.description || ''}`.toLowerCase();
      const keywords = this.extractKeywords(searchTerm);
      
      let keywordMatches = 0;
      for (const keyword of keywords) {
        if (productText.includes(keyword)) {
          keywordMatches++;
        }
      }
      
      if (keywordMatches > 0) {
        score += (keywordMatches / keywords.length) * 0.5;
      }

      // 6. Symptom matching (for troubleshooting queries)
      if (product.symptoms) {
        const symptomMatches = product.symptoms.filter(symptom =>
          searchTerm.includes(symptom.toLowerCase())
        ).length;
        
        if (symptomMatches > 0) {
          score += symptomMatches * 0.4;
          matchType = 'description';
        }
      }

      // Only include results with meaningful scores
      if (score > 0.1) {
        results.push({
          product,
          score,
          matchType
        });
      }
    }

    // Sort by score (highest first) and limit results
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }

  /**
   * Check compatibility between a part and model
   */
  async checkCompatibility(partNumber: string, modelNumber: string): Promise<{
    compatible: boolean;
    confidence: number;
    reason: string;
  }> {
    const product = this.products.find(p => 
      p.partNumber.toLowerCase() === partNumber.toLowerCase()
    );

    if (!product) {
      return {
        compatible: false,
        confidence: 0,
        reason: `Part number ${partNumber} not found in our database.`
      };
    }

    const isCompatible = product.compatibleModels.some(model =>
      model.toLowerCase().includes(modelNumber.toLowerCase()) ||
      modelNumber.toLowerCase().includes(model.toLowerCase())
    );

    return {
      compatible: isCompatible,
      confidence: isCompatible ? 0.9 : 0.1,
      reason: isCompatible 
        ? `Part ${partNumber} is compatible with model ${modelNumber}.`
        : `Part ${partNumber} is not compatible with model ${modelNumber}. Compatible models: ${product.compatibleModels.join(', ')}`
    };
  }

  /**
   * Add products to the search index
   */
  indexProducts(products: EnhancedProduct[]): void {
    this.products = products;
  }

  /**
   * Get product by part number
   */
  getProductByPartNumber(partNumber: string): EnhancedProduct | undefined {
    return this.products.find(p => 
      p.partNumber.toLowerCase() === partNumber.toLowerCase()
    );
  }

  /**
   * Extract part numbers from query (format: letters followed by numbers)
   */
  private extractPartNumbers(query: string): string[] {
    const partNumberPattern = /[A-Z]{2,}\d+/gi;
    const matches = query.match(partNumberPattern) || [];
    return matches.map(match => match.toLowerCase());
  }

  /**
   * Extract model numbers from query
   */
  private extractModelNumbers(query: string): string[] {
    const modelPattern = /\b[A-Z]{2,}[\w\d]+\b/gi;
    const matches = query.match(modelPattern) || [];
    return matches.map(match => match.toLowerCase());
  }

  /**
   * Extract meaningful keywords from query
   */
  private extractKeywords(query: string): string[] {
    // Remove common stop words
    const stopWords = ['the', 'is', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'my', 'i', 'can', 'how', 'what', 'where', 'when', 'why'];
    
    const words = query
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word));

    return [...new Set(words)]; // Remove duplicates
  }

  /**
   * Health check
   */
  healthCheck(): boolean {
    return this.products.length > 0;
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      totalProducts: this.products.length,
      categories: [...new Set(this.products.map(p => p.category))],
      brands: [...new Set(this.products.map(p => p.brand).filter(Boolean))]
    };
  }
}