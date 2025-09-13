import { z } from 'zod';
import { sampleProducts, compatibilityDatabase } from '../data/sampleProducts';

// Compatibility check input schema
export const CompatibilityInputSchema = z.object({
  partNumber: z.string().min(1, "Part number is required"),
  modelNumber: z.string().min(1, "Model number is required"),
  applianceType: z.enum(['refrigerator', 'dishwasher']).optional(),
  year: z.number().optional(),
  brand: z.string().optional()
});

export type CompatibilityInput = z.infer<typeof CompatibilityInputSchema>;

export interface CompatibilityResult {
  isCompatible: boolean;
  confidence: number;
  partDetails: {
    partNumber: string;
    name: string;
    category: string;
    brand: string;
    price: number;
    availability: string;
  } | null;
  modelDetails: {
    modelNumber: string;
    brand: string;
    type: string;
  } | null;
  compatibilityReason: string;
  alternativeParts: string[];
  installationNotes: string[];
}

/**
 * Compatibility Checker Tool - Model number parsing and cross-reference
 * Handles compatibility verification with confidence scoring
 */
export class CompatibilityTool {
  private name = 'check_compatibility';
  private description = 'Check if a specific part is compatible with an appliance model with detailed confidence analysis';

  getName(): string {
    return this.name;
  }

  getDescription(): string {
    return this.description;
  }

  getInputSchema(): z.ZodSchema {
    return CompatibilityInputSchema;
  }

  /**
   * Execute compatibility check with confidence scoring
   */
  async execute(input: CompatibilityInput): Promise<CompatibilityResult> {
    const validatedInput = CompatibilityInputSchema.parse(input);
    const { partNumber, modelNumber, applianceType, year, brand } = validatedInput;

    console.log(`CompatibilityTool: Checking ${partNumber} compatibility with ${modelNumber}`);

    // Parse and standardize model number
    const standardizedModel = this.standardizeModelNumber(modelNumber);
    const standardizedPart = this.standardizePartNumber(partNumber);

    // Find the part in our database
    const part = sampleProducts.find(p => 
      this.standardizePartNumber(p.partNumber) === standardizedPart
    );

    if (!part) {
      return {
        isCompatible: false,
        confidence: 0,
        partDetails: null,
        modelDetails: null,
        compatibilityReason: `Part ${partNumber} not found in our catalog. Please verify the part number.`,
        alternativeParts: [],
        installationNotes: []
      };
    }

    // Check direct compatibility from part data
    const directMatch = part.compatibleModels.some(model => 
      this.standardizeModelNumber(model) === standardizedModel
    );

    if (directMatch) {
      return {
        isCompatible: true,
        confidence: 0.95,
        partDetails: {
          partNumber: part.partNumber,
          name: part.name,
          category: part.category,
          brand: part.brand,
          price: part.price,
          availability: part.availability
        },
        modelDetails: {
          modelNumber: modelNumber,
          brand: part.brand,
          type: part.category
        },
        compatibilityReason: `✅ YES - Part ${part.partNumber} (${part.name}) IS compatible with model ${modelNumber}.`,
        alternativeParts: [],
        installationNotes: [
          `Installation difficulty: ${part.installationDifficulty}`,
          `Estimated time: ${part.installationTime} minutes`,
          `Tools required: ${part.toolsRequired.join(', ')}`
        ]
      };
    }

    // Check compatibility database for additional matches
    const modelData = compatibilityDatabase.modelCompatibility.find(m => 
      this.standardizeModelNumber(m.modelNumber) === standardizedModel
    );

    if (modelData) {
      const isCompatible = modelData.compatibleParts.includes(part.partNumber);
      const confidence = isCompatible ? 0.85 : 0.1;

      if (isCompatible) {
        return {
          isCompatible: true,
          confidence,
          partDetails: {
            partNumber: part.partNumber,
            name: part.name,
            category: part.category,
            brand: part.brand,
            price: part.price,
            availability: part.availability
          },
          modelDetails: {
            modelNumber: modelData.modelNumber,
            brand: modelData.brand,
            type: modelData.type
          },
          compatibilityReason: `✅ YES - Part ${part.partNumber} (${part.name}) IS compatible with ${modelData.brand} ${modelData.type} model ${modelNumber}.`,
          alternativeParts: this.findAlternativeParts(part, modelData),
          installationNotes: [
            `Installation difficulty: ${part.installationDifficulty}`,
            `Estimated time: ${part.installationTime} minutes`
          ]
        };
      }
    }

    // Not compatible - find alternatives
    const alternatives = this.findAlternativePartsForModel(modelNumber, part.category);
    const suggestedModels = part.compatibleModels.slice(0, 3);

    return {
      isCompatible: false,
      confidence: 0.9,
      partDetails: {
        partNumber: part.partNumber,
        name: part.name,
        category: part.category,
        brand: part.brand,
        price: part.price,
        availability: part.availability
      },
      modelDetails: modelData ? {
        modelNumber: modelData.modelNumber,
        brand: modelData.brand,
        type: modelData.type
      } : null,
      compatibilityReason: `❌ NO - Part ${part.partNumber} (${part.name}) is NOT compatible with model ${modelNumber}. This part is compatible with: ${suggestedModels.join(', ')}`,
      alternativeParts: alternatives,
      installationNotes: [
        "This part is not compatible with your model",
        "Consider the alternative parts listed above",
        "Contact support for professional assistance"
      ]
    };
  }

  /**
   * Standardize model numbers for consistent matching
   */
  private standardizeModelNumber(modelNumber: string): string {
    return modelNumber
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .trim();
  }

  /**
   * Standardize part numbers for consistent matching
   */
  private standardizePartNumber(partNumber: string): string {
    return partNumber
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .trim();
  }

  /**
   * Find alternative parts for the same model
   */
  private findAlternativeParts(originalPart: any, modelData: any): string[] {
    return modelData.compatibleParts
      .filter((partNum: string) => partNum !== originalPart.partNumber)
      .slice(0, 3);
  }

  /**
   * Find alternative parts for a specific model and category
   */
  private findAlternativePartsForModel(modelNumber: string, category: string): string[] {
    const standardizedModel = this.standardizeModelNumber(modelNumber);
    
    // Find all parts compatible with this model in the same category
    const compatibleParts = sampleProducts.filter(part => 
      part.category === category &&
      part.compatibleModels.some(model => 
        this.standardizeModelNumber(model) === standardizedModel
      )
    );

    return compatibleParts
      .slice(0, 3)
      .map(part => part.partNumber);
  }

  /**
   * Batch compatibility checking for multiple parts
   */
  async checkBatchCompatibility(
    partNumbers: string[], 
    modelNumber: string
  ): Promise<CompatibilityResult[]> {
    const results: CompatibilityResult[] = [];

    for (const partNumber of partNumbers) {
      try {
        const result = await this.execute({ partNumber, modelNumber });
        results.push(result);
      } catch (error) {
        console.error(`Error checking compatibility for ${partNumber}:`, error);
        results.push({
          isCompatible: false,
          confidence: 0,
          partDetails: null,
          modelDetails: null,
          compatibilityReason: `Error checking compatibility for part ${partNumber}`,
          alternativeParts: [],
          installationNotes: []
        });
      }
    }

    return results;
  }

  /**
   * Get compatibility confidence explanation
   */
  getConfidenceExplanation(confidence: number): string {
    if (confidence >= 0.9) {
      return "High confidence - Direct database match or manufacturer specification";
    } else if (confidence >= 0.7) {
      return "Good confidence - Cross-reference match with minor variations";
    } else if (confidence >= 0.5) {
      return "Moderate confidence - Pattern matching with some uncertainty";
    } else {
      return "Low confidence - Limited data or conflicting information";
    }
  }
}