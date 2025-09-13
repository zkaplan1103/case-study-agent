/**
 * Simple Search Service for PartSelect Chat Agent
 * As specified in Phase 3 of the simplified blueprint
 * No vector embeddings - just effective string matching
 */

import { sampleProducts } from '../data/sampleProducts';

export interface SearchResult {
  product: any;
  score: number;
  matchType: 'exact_part' | 'model_match' | 'keyword' | 'symptom' | 'description';
  reason: string;
}

export class SimpleSearchService {
  
  /**
   * Simple but effective product search
   * Optimized for the 3 required test queries
   */
  search(query: string, category?: 'refrigerator' | 'dishwasher' | 'all'): SearchResult[] {
    const searchTerm = query.toLowerCase();
    const results: SearchResult[] = [];

    console.log(`SimpleSearchService: Searching for "${query}" in category "${category || 'all'}"`);

    for (const product of sampleProducts) {
      let score = 0;
      let matchType: SearchResult['matchType'] = 'keyword';
      let reason = '';

      // Category filter
      if (category && category !== 'all' && product.category !== category) {
        continue;
      }

      // 1. Exact part number match (highest priority) - for "PS11752778" queries
      if (product.partNumber.toLowerCase() === searchTerm) {
        score = 100;
        matchType = 'exact_part';
        reason = 'Exact part number match';
      }
      // 2. Part number contains search term
      else if (product.partNumber.toLowerCase().includes(searchTerm)) {
        score = 80;
        matchType = 'exact_part';
        reason = 'Part number contains search term';
      }
      // 3. Model compatibility checking - for "WDT780SAEM1" queries
      else if (this.checkModelCompatibility(searchTerm, product)) {
        score = 70;
        matchType = 'model_match';
        reason = 'Compatible with specified model';
      }
      // 4. Symptom matching - for "ice maker not working" queries
      else if (this.checkSymptomMatch(searchTerm, product)) {
        score = 60;
        matchType = 'symptom';
        reason = 'Matches reported symptoms';
      }
      // 5. Product name matching
      else if (product.name.toLowerCase().includes(searchTerm)) {
        score = 50;
        matchType = 'keyword';
        reason = 'Product name contains search term';
      }
      // 6. Description matching
      else if (product.description && product.description.toLowerCase().includes(searchTerm)) {
        score = 30;
        matchType = 'description';
        reason = 'Description contains search term';
      }
      // 7. Keyword matching for common appliance terms
      else if (this.checkKeywordMatch(searchTerm, product)) {
        score = 40;
        matchType = 'keyword';
        reason = 'Matches appliance keywords';
      }

      // Add to results if we found a match
      if (score > 0) {
        results.push({
          product,
          score,
          matchType,
          reason
        });
      }
    }

    // Sort by score (highest first) and return top 10
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }

  /**
   * Check if a part is compatible with a model
   */
  checkCompatibility(partNumber: string, modelNumber: string): {
    compatible: boolean;
    confidence: number;
    reason: string;
    product?: any;
  } {
    const product = sampleProducts.find(p => 
      p.partNumber.toLowerCase() === partNumber.toLowerCase()
    );

    if (!product) {
      return {
        compatible: false,
        confidence: 0,
        reason: `Part number ${partNumber} not found in database`
      };
    }

    const isCompatible = product.compatibleModels.some((model: string) =>
      model.toLowerCase().includes(modelNumber.toLowerCase()) ||
      modelNumber.toLowerCase().includes(model.toLowerCase())
    );

    return {
      compatible: isCompatible,
      confidence: isCompatible ? 0.9 : 0.1,
      reason: isCompatible 
        ? `Part ${partNumber} is compatible with model ${modelNumber}`
        : `Part ${partNumber} is not compatible with model ${modelNumber}. Compatible models: ${product.compatibleModels.join(', ')}`,
      product
    };
  }

  /**
   * Get product by part number
   */
  getProductByPartNumber(partNumber: string): any | null {
    return sampleProducts.find(p => 
      p.partNumber.toLowerCase() === partNumber.toLowerCase()
    ) || null;
  }

  /**
   * Find parts by symptoms (for troubleshooting)
   */
  findPartsBySymptoms(symptoms: string[]): SearchResult[] {
    const results: SearchResult[] = [];
    
    for (const product of sampleProducts) {
      if (product.symptoms) {
        let matchCount = 0;
        
        for (const symptom of symptoms) {
          if (product.symptoms.some((ps: string) => 
            ps.toLowerCase().includes(symptom.toLowerCase()) ||
            symptom.toLowerCase().includes(ps.toLowerCase())
          )) {
            matchCount++;
          }
        }
        
        if (matchCount > 0) {
          results.push({
            product,
            score: matchCount / symptoms.length,
            matchType: 'symptom',
            reason: `Matches ${matchCount} of ${symptoms.length} symptoms`
          });
        }
      }
    }

    return results.sort((a, b) => b.score - a.score);
  }

  // Private helper methods

  private checkModelCompatibility(searchTerm: string, product: any): boolean {
    return product.compatibleModels.some((model: string) =>
      model.toLowerCase().includes(searchTerm) ||
      searchTerm.includes(model.toLowerCase())
    );
  }

  private checkSymptomMatch(searchTerm: string, product: any): boolean {
    if (!product.symptoms) return false;
    
    return product.symptoms.some((symptom: string) =>
      symptom.toLowerCase().includes(searchTerm) ||
      searchTerm.includes(symptom.toLowerCase())
    );
  }

  private checkKeywordMatch(searchTerm: string, product: any): boolean {
    const keywords = [
      'ice maker', 'water filter', 'door seal', 'wash pump', 
      'dishwasher', 'refrigerator', 'freezer', 'ice', 'water',
      'leak', 'broken', 'not working', 'replace', 'repair'
    ];

    const productText = `${product.name} ${product.description || ''}`.toLowerCase();
    
    return keywords.some(keyword => 
      searchTerm.includes(keyword) && productText.includes(keyword)
    );
  }

  /**
   * Get search statistics
   */
  getStats() {
    return {
      totalProducts: sampleProducts.length,
      categories: [...new Set(sampleProducts.map(p => p.category))],
      brands: [...new Set(sampleProducts.map(p => p.brand).filter(Boolean))]
    };
  }

  /**
   * Health check
   */
  healthCheck(): boolean {
    return sampleProducts.length > 0;
  }
}