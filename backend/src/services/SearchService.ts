import { Product, ProductSearchParams, SearchResult, CompatibilityCheck, TroubleshootingResult, TroubleshootingSymptom } from '../types';
import { sampleProducts, troubleshootingSymptoms } from '../data/sampleProducts';

/**
 * A service for searching and retrieving product-related information from a static dataset.
 * This service encapsulates all data access logic for products, compatibility, and troubleshooting.
 */
export class SearchService {
  private products: Product[];

  constructor() {
    this.products = sampleProducts;
  }

  /**
   * Searches for products based on a variety of criteria.
   * Prioritizes exact part number matches, then uses a scoring system for relevance.
   * @param params The search parameters.
   * @returns A promise that resolves to a SearchResult object.
   */
  public async searchProducts(params: ProductSearchParams): Promise<SearchResult> {
    const { partNumber, brand, category, priceRange, availability, offset = 0, limit = 10 } = params;
    let results = [...this.products];
    const searchTerms: string[] = [];

    // Prioritize exact part number match and return immediately if found
    if (partNumber) {
      searchTerms.push(`part:${partNumber}`);
      const exactMatch = results.find(p => this.normalizeString(p.partNumber) === this.normalizeString(partNumber));
      if (exactMatch) {
        return {
          products: [exactMatch],
          totalCount: 1,
          searchTerms,
          suggestions: []
        };
      }
    }

    // Apply filters based on other parameters
    if (category) {
      results = results.filter(p => p.category === category);
      searchTerms.push(`category:${category}`);
    }

    if (brand) {
      results = results.filter(p => this.normalizeString(p.brand).includes(this.normalizeString(brand)));
      searchTerms.push(`brand:${brand}`);
    }

    if (priceRange) {
      results = results.filter(p => p.price >= priceRange.min && p.price <= priceRange.max);
      searchTerms.push(`price:${priceRange.min}-${priceRange.max}`);
    }

    if (availability) {
      results = results.filter(p => p.availability === availability);
      searchTerms.push(`availability:${availability}`);
    }

    // Use relevance scoring for the remaining results
    const scoredResults = this.scoreAndSortResults(results, params);
    const paginatedResults = scoredResults.slice(offset, offset + limit);

    const suggestions = scoredResults.length === 0 ? this.generateSuggestions(params) : [];

    return {
      products: paginatedResults,
      totalCount: scoredResults.length,
      searchTerms,
      suggestions
    };
  }

  /**
   * Checks the compatibility between a part and a model number.
   * @param partNumber The part number to check.
   * @param modelNumber The model number to check against.
   * @returns A promise that resolves to a CompatibilityCheck object.
   */
  public async checkCompatibility(partNumber: string, modelNumber: string): Promise<CompatibilityCheck> {
    const part = this.products.find(p => this.normalizeString(p.partNumber) === this.normalizeString(partNumber));
    const normalizedModelNumber = this.normalizeModel(modelNumber);

    if (!part) {
      return {
        partNumber,
        modelNumber,
        isCompatible: false,
        confidence: 0,
        reason: 'Part number not found in our database.',
        alternativeParts: []
      };
    }

    const isCompatible = part.compatibleModels.some(model => this.normalizeModel(model) === normalizedModelNumber);

    if (isCompatible) {
      return {
        partNumber,
        modelNumber,
        isCompatible: true,
        confidence: 1.0,
        reason: `Part ${partNumber} is confirmed compatible with model ${modelNumber}.`
      };
    }

    const alternativeParts = this.products
      .filter(p => p.category === part.category && p.compatibleModels.some(model => this.normalizeModel(model) === normalizedModelNumber))
      .slice(0, 3);

    return {
      partNumber,
      modelNumber,
      isCompatible: false,
      confidence: 0,
      reason: `Part ${partNumber} is not compatible with model ${modelNumber}.`,
      alternativeParts
    };
  }

  /**
   * Retrieves a product by its part number.
   * @param partNumber The part number to look up.
   * @returns A promise that resolves to the Product object or null if not found.
   */
  public async getProductByPartNumber(partNumber: string): Promise<Product | null> {
    return this.products.find(p => this.normalizeString(p.partNumber) === this.normalizeString(partNumber)) || null;
  }

  /**
   * Searches for troubleshooting information based on a symptom and category.
   * @param symptom The user-provided symptom.
   * @param category The appliance category.
   * @returns A promise that resolves to an array of TroubleshootingResult objects.
   */
  public async searchTroubleshooting(symptom: string, category?: 'refrigerator' | 'dishwasher'): Promise<TroubleshootingResult[]> {
    const normalizedSymptom = this.normalizeString(symptom);

    const matchingSymptoms = troubleshootingSymptoms.filter(ts => {
      const matchesCategory = !category || ts.category === category;
      const matchesDescription = this.normalizeString(ts.description).includes(normalizedSymptom);
      const matchesCauses = ts.commonCauses.some(cause => this.normalizeString(cause).includes(normalizedSymptom));
      return matchesCategory && (matchesDescription || matchesCauses);
    });

    const results = await Promise.all(
      matchingSymptoms.map(async ts => {
        // Corrected line to handle `undefined`
        const recommendedParts = await Promise.all(
          (ts.recommendedParts || []).map(partNumber => this.getProductByPartNumber(partNumber))
        );

        return {
          symptom: ts,
          suggestedSteps: ts.diagnosticSteps,
          recommendedParts: recommendedParts.filter((p): p is Product => p !== null),
          shouldContactProfessional: this.shouldContactProfessional(ts),
          reason: this.getProfessionalContactReason(ts)
        };
      })
    );

    return results;
  }

  /**
   * Retrieves installation instructions for a specific part.
   * @param partNumber The part number.
   * @returns A promise that resolves to the installation instructions object or null if not found.
   */
  public async getInstallationInstructions(partNumber: string) {
    const product = await this.getProductByPartNumber(partNumber);

    if (!product || !product.installationSteps) {
      return null;
    }

    return {
      partNumber: product.partNumber,
      partName: product.name,
      difficulty: product.installationDifficulty,
      estimatedTime: product.estimatedInstallTime,
      requiredTools: product.requiredTools,
      safetyWarnings: product.safetyWarnings,
      steps: product.installationSteps,
      additionalNotes: [
        'Always read all instructions before beginning installation.',
        'Ensure you have all required tools before starting.',
        'If you encounter any issues, consult a professional technician.',
        'Keep all safety warnings in mind throughout the installation process.'
      ]
    };
  }

  /**
   * Scores and sorts products based on relevance to the search parameters.
   * @private
   */
  private scoreAndSortResults(products: Product[], params: ProductSearchParams): Product[] {
    const { query, brand, partNumber } = params;

    return products
      .map(product => ({
        product,
        score: this.calculateRelevanceScore(product, query, brand, partNumber)
      }))
      .sort((a, b) => b.score - a.score)
      .map(item => item.product);
  }

  /**
   * Calculates a relevance score for a product based on search terms.
   * @private
   */
  private calculateRelevanceScore(product: Product, query?: string, brand?: string, partNumber?: string): number {
    let score = 0;
    const normProductNumber = this.normalizeString(product.partNumber);
    const normProductName = this.normalizeString(product.name);
    const normProductDesc = this.normalizeString(product.description);

    if (partNumber) {
      const normPartNumber = this.normalizeString(partNumber);
      if (normProductNumber.includes(normPartNumber)) {
        score += 500;
        if (normProductNumber === normPartNumber) {
          score += 500;
        }
      }
    }

    if (query) {
      const normQuery = this.normalizeString(query);
      if (normProductName.includes(normQuery)) {
        score += 100;
      }
      if (normProductDesc.includes(normQuery)) {
        score += 50;
      }
    }

    if (brand && this.normalizeString(product.brand).includes(this.normalizeString(brand))) {
      score += 200;
    }

    if (product.availability === 'in-stock') {
      score += 100;
    }

    return score;
  }

  /**
   * Generates search suggestions for when no results are found.
   * @private
   */
  private generateSuggestions(params: ProductSearchParams): string[] {
    const suggestions: string[] = [];

    if (params.partNumber) {
      suggestions.push(`Try searching by product name instead of part number.`);
      suggestions.push('Check if the part number is correct and complete.');
    }

    if (params.query) {
      suggestions.push('Try using different keywords or synonyms.');
      suggestions.push('Search by brand name (Whirlpool, GE, etc.).');
    }

    suggestions.push('Try browsing by category (refrigerator or dishwasher).');

    return suggestions;
  }

  /**
   * Normalizes a string by converting it to lowercase and removing non-alphanumeric characters.
   * @private
   */
  private normalizeString(str: string): string {
    return str.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  /**
   * Normalizes a model number to handle common variations.
   * @private
   */
  private normalizeModel(model: string): string {
    return this.normalizeString(model.replace(/-\d+$/, '')); // Removes trailing digits after a dash, e.g., 'W123456-7' -> 'W123456'
  }

  /**
   * Determines if a user should contact a professional based on troubleshooting data.
   * @private
   */
  private shouldContactProfessional(symptom: TroubleshootingSymptom): boolean {
    return symptom.diagnosticSteps.length > 5 || this.normalizeString(symptom.description).includes('electrical');
  }

  /**
   * Provides a reason for why a professional should be contacted.
   * @private
   */
  private getProfessionalContactReason(symptom: TroubleshootingSymptom): string | undefined {
    if (symptom.diagnosticSteps.length > 5) {
      return 'Complex repair requiring multiple diagnostic steps.';
    }
    if (this.normalizeString(symptom.description).includes('electrical')) {
      return 'Electrical repairs should be performed by qualified technicians.';
    }
    return undefined;
  }
}