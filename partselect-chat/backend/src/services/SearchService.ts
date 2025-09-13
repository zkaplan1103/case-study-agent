import { Product, ProductSearchParams, SearchResult, CompatibilityCheck } from '../types';
import { sampleProducts, troubleshootingSymptoms } from '../data/sampleProducts';

export class SearchService {
  private products: Product[];
  
  constructor() {
    this.products = sampleProducts;
    console.log(`✅ SearchService initialized with ${this.products.length} products`);
  }

  /**
   * Search for products based on various criteria
   */
  public async searchProducts(params: ProductSearchParams): Promise<SearchResult> {
    let results = [...this.products];
    const searchTerms: string[] = [];
    
    // Exact part number matching (highest priority)
    if (params.partNumber) {
      const exactMatch = results.filter(p => 
        p.partNumber.toLowerCase() === params.partNumber!.toLowerCase()
      );
      if (exactMatch.length > 0) {
        searchTerms.push(`part:${params.partNumber}`);
        return {
          products: exactMatch.slice(0, params.limit || 10),
          totalCount: exactMatch.length,
          searchTerms
        };
      }
      
      // Partial part number matching
      results = results.filter(p => 
        p.partNumber.toLowerCase().includes(params.partNumber!.toLowerCase())
      );
      searchTerms.push(`part:${params.partNumber}`);
    }

    // Category filtering
    if (params.category) {
      results = results.filter(p => p.category === params.category);
      searchTerms.push(`category:${params.category}`);
    }

    // Brand filtering
    if (params.brand) {
      results = results.filter(p => 
        p.brand.toLowerCase().includes(params.brand!.toLowerCase())
      );
      searchTerms.push(`brand:${params.brand}`);
    }

    // Price range filtering
    if (params.priceRange) {
      results = results.filter(p => 
        p.price >= params.priceRange!.min && p.price <= params.priceRange!.max
      );
      searchTerms.push(`price:${params.priceRange.min}-${params.priceRange.max}`);
    }

    // Availability filtering
    if (params.availability) {
      results = results.filter(p => p.availability === params.availability);
      searchTerms.push(`availability:${params.availability}`);
    }

    // Text-based search across name and description
    if (params.query) {
      const queryTerms = params.query.toLowerCase().split(' ');
      results = results.filter(p => {
        const searchText = `${p.name} ${p.description}`.toLowerCase();
        return queryTerms.some(term => searchText.includes(term));
      });
      searchTerms.push(`query:${params.query}`);
    }

    // Relevance scoring and sorting
    results = this.scoreAndSortResults(results, params);

    // Apply pagination
    const offset = params.offset || 0;
    const limit = params.limit || 10;
    const paginatedResults = results.slice(offset, offset + limit);

    // Generate suggestions for no results
    const suggestions = results.length === 0 ? this.generateSuggestions(params) : undefined;

    return {
      products: paginatedResults,
      totalCount: results.length,
      searchTerms,
      suggestions
    };
  }

  /**
   * Check compatibility between a part and model
   */
  public async checkCompatibility(partNumber: string, modelNumber: string): Promise<CompatibilityCheck> {
    const part = this.products.find(p => 
      p.partNumber.toLowerCase() === partNumber.toLowerCase()
    );

    if (!part) {
      return {
        partNumber,
        modelNumber,
        isCompatible: false,
        confidence: 0,
        reason: 'Part number not found in our database',
        alternativeParts: []
      };
    }

    // Check if model is in compatible models list
    const isDirectMatch = part.compatibleModels.some(model => 
      model.toLowerCase() === modelNumber.toLowerCase()
    );

    if (isDirectMatch) {
      return {
        partNumber,
        modelNumber,
        isCompatible: true,
        confidence: 1.0,
        reason: `Part ${partNumber} is confirmed compatible with model ${modelNumber}`
      };
    }

    // Check for partial model matches (for variations like WDT780SAEM1 vs WDT780SAEM)
    const partialMatch = part.compatibleModels.some(model => {
      const modelBase = model.replace(/[0-9]$/, ''); // Remove trailing number
      const inputBase = modelNumber.replace(/[0-9]$/, '');
      return modelBase.toLowerCase().includes(inputBase.toLowerCase()) ||
             inputBase.toLowerCase().includes(modelBase.toLowerCase());
    });

    if (partialMatch) {
      return {
        partNumber,
        modelNumber,
        isCompatible: true,
        confidence: 0.8,
        reason: `Part ${partNumber} appears compatible with model ${modelNumber} based on model family matching`
      };
    }

    // Find alternative parts for this model
    const alternativeParts = this.products.filter(p => 
      p.compatibleModels.some(model => 
        model.toLowerCase().includes(modelNumber.toLowerCase()) ||
        modelNumber.toLowerCase().includes(model.toLowerCase())
      ) && p.category === part.category
    );

    return {
      partNumber,
      modelNumber,
      isCompatible: false,
      confidence: 0,
      reason: `Part ${partNumber} is not compatible with model ${modelNumber}`,
      alternativeParts: alternativeParts.slice(0, 3) // Limit to top 3 alternatives
    };
  }

  /**
   * Find parts by compatible model number
   */
  public async findPartsByModel(modelNumber: string, category?: 'refrigerator' | 'dishwasher'): Promise<Product[]> {
    let results = this.products.filter(p => 
      p.compatibleModels.some(model => 
        model.toLowerCase().includes(modelNumber.toLowerCase()) ||
        modelNumber.toLowerCase().includes(model.toLowerCase())
      )
    );

    if (category) {
      results = results.filter(p => p.category === category);
    }

    return results.sort((a, b) => {
      // Prioritize exact model matches
      const aExact = a.compatibleModels.some(m => m.toLowerCase() === modelNumber.toLowerCase());
      const bExact = b.compatibleModels.some(m => m.toLowerCase() === modelNumber.toLowerCase());
      
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      // Then by price (ascending)
      return a.price - b.price;
    });
  }

  /**
   * Get product by part number
   */
  public async getProductByPartNumber(partNumber: string): Promise<Product | null> {
    return this.products.find(p => 
      p.partNumber.toLowerCase() === partNumber.toLowerCase()
    ) || null;
  }

  /**
   * Search for troubleshooting information
   */
  public async searchTroubleshooting(symptom: string, category?: 'refrigerator' | 'dishwasher') {
    const symptoms = troubleshootingSymptoms.filter(s => {
      const matchesCategory = !category || s.category === category;
      const matchesDescription = s.description.toLowerCase().includes(symptom.toLowerCase()) ||
                                symptom.toLowerCase().includes(s.description.toLowerCase());
      const matchesCauses = s.commonCauses.some(cause => 
        cause.toLowerCase().includes(symptom.toLowerCase()) ||
        symptom.toLowerCase().includes(cause.toLowerCase())
      );
      
      return matchesCategory && (matchesDescription || matchesCauses);
    });

    // For each symptom, get the recommended parts
    const results = await Promise.all(symptoms.map(async symptom => {
      const recommendedParts = await Promise.all(
        symptom.recommendedParts?.map(partNumber => 
          this.getProductByPartNumber(partNumber)
        ).filter(Boolean) || []
      );

      return {
        symptom,
        suggestedSteps: symptom.diagnosticSteps,
        recommendedParts: recommendedParts.filter(p => p !== null) as Product[],
        shouldContactProfessional: symptom.diagnosticSteps.length > 5 || 
                                   symptom.description.toLowerCase().includes('electrical'),
        reason: symptom.diagnosticSteps.length > 5 ? 
               'Complex repair requiring multiple diagnostic steps' : 
               symptom.description.toLowerCase().includes('electrical') ?
               'Electrical repairs should be performed by qualified technicians' : undefined
      };
    }));

    return results;
  }

  /**
   * Get installation instructions for a part
   */
  public async getInstallationInstructions(partNumber: string) {
    const product = await this.getProductByPartNumber(partNumber);
    
    if (!product) {
      return null;
    }

    return {
      partNumber: product.partNumber,
      partName: product.name,
      difficulty: product.installationDifficulty,
      estimatedTime: product.estimatedInstallTime,
      requiredTools: product.requiredTools,
      safetyWarnings: product.safetyWarnings,
      steps: product.installationSteps || [],
      additionalNotes: [
        'Always read all instructions before beginning installation',
        'Ensure you have all required tools before starting',
        'If you encounter any issues, consult a professional technician',
        'Keep all safety warnings in mind throughout the installation process'
      ]
    };
  }

  /**
   * Score and sort search results by relevance
   */
  private scoreAndSortResults(products: Product[], params: ProductSearchParams): Product[] {
    return products.map(product => ({
      product,
      score: this.calculateRelevanceScore(product, params)
    }))
    .sort((a, b) => b.score - a.score)
    .map(item => item.product);
  }

  /**
   * Calculate relevance score for search results
   */
  private calculateRelevanceScore(product: Product, params: ProductSearchParams): number {
    let score = 0;

    // Exact part number match gets highest score
    if (params.partNumber && product.partNumber.toLowerCase() === params.partNumber.toLowerCase()) {
      score += 1000;
    }

    // Partial part number match
    if (params.partNumber && product.partNumber.toLowerCase().includes(params.partNumber.toLowerCase())) {
      score += 500;
    }

    // Query term matching in name (higher weight)
    if (params.query) {
      const queryTerms = params.query.toLowerCase().split(' ');
      const nameMatches = queryTerms.filter(term => 
        product.name.toLowerCase().includes(term)
      ).length;
      score += nameMatches * 100;

      // Query term matching in description (lower weight)
      const descMatches = queryTerms.filter(term => 
        product.description.toLowerCase().includes(term)
      ).length;
      score += descMatches * 50;
    }

    // Brand preference
    if (params.brand && product.brand.toLowerCase().includes(params.brand.toLowerCase())) {
      score += 200;
    }

    // Availability bonus (in-stock items get priority)
    if (product.availability === 'in-stock') {
      score += 100;
    } else if (product.availability === 'backordered') {
      score += 25;
    }

    // Installation difficulty (easier installations get slight bonus for user experience)
    if (product.installationDifficulty === 'easy') {
      score += 10;
    } else if (product.installationDifficulty === 'medium') {
      score += 5;
    }

    return score;
  }

  /**
   * Generate search suggestions when no results found
   */
  private generateSuggestions(params: ProductSearchParams): string[] {
    const suggestions: string[] = [];

    if (params.partNumber) {
      suggestions.push(`Try searching without the full part number: "${params.partNumber.slice(0, -2)}"`);
      suggestions.push('Check if the part number is correct and complete');
      suggestions.push('Try searching by product name instead of part number');
    }

    if (params.query) {
      suggestions.push('Try using different keywords or synonyms');
      suggestions.push('Search by brand name (Whirlpool, GE, Frigidaire, etc.)');
      suggestions.push('Include the appliance type (refrigerator or dishwasher)');
    }

    if (params.brand && params.category) {
      suggestions.push(`Browse all ${params.category} parts`);
      suggestions.push(`Search for ${params.brand} parts without other filters`);
    }

    // General suggestions
    suggestions.push('Try browsing by category (refrigerator or dishwasher)');
    suggestions.push('Contact our support team for assistance finding the right part');

    return suggestions.slice(0, 3); // Limit to 3 suggestions
  }

  /**
   * Get service statistics
   */
  public getStats() {
    const categoryStats = this.products.reduce((acc, product) => {
      acc[product.category] = (acc[product.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const brandStats = this.products.reduce((acc, product) => {
      acc[product.brand] = (acc[product.brand] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const availabilityStats = this.products.reduce((acc, product) => {
      acc[product.availability] = (acc[product.availability] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalProducts: this.products.length,
      categoryBreakdown: categoryStats,
      brandBreakdown: brandStats,
      availabilityBreakdown: availabilityStats,
      troubleshootingSymptoms: troubleshootingSymptoms.length
    };
  }
}