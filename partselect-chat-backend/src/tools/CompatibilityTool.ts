import { z } from 'zod';
import { SimpleSearchService } from '../services/SimpleSearchService';

// Simplified compatibility input schema
export const CompatibilityInputSchema = z.object({
  partNumber: z.string().min(1, "Part number is required"),
  modelNumber: z.string().min(1, "Model number is required")
});

export type CompatibilityInput = z.infer<typeof CompatibilityInputSchema>;

/**
 * Simple Compatibility Tool for Instalily requirements
 * Handles the "Is this part compatible with my WDT780SAEM1 model?" query
 */
export class CompatibilityTool {
  private name = 'check_compatibility';
  private description = 'Check if a specific part number is compatible with an appliance model';
  private searchService = new SimpleSearchService();

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
   * Execute compatibility check
   */
  async execute(input: Record<string, any>): Promise<string> {
    try {
      const { partNumber, modelNumber } = CompatibilityInputSchema.parse(input);
      
      console.log(`CompatibilityTool: Checking ${partNumber} compatibility with ${modelNumber}`);
      
      // Use SimpleSearchService for consistency
      const compatibilityResult = this.searchService.checkCompatibility(partNumber, modelNumber);
      
      if (!compatibilityResult.product) {
        return `❌ **Compatibility Check Result**\n\nPart number ${partNumber} was not found in our database. Please verify the part number and try again.\n\nIf you have the correct part number, you may need to contact customer service for compatibility information.`;
      }

      const product = compatibilityResult.product;
      const isCompatible = compatibilityResult.compatible;

      let result = `**Compatibility Check Result**\n\n`;
      result += `Part: ${product.partNumber} - ${product.name}\n`;
      result += `Model: ${modelNumber}\n`;
      result += `Category: ${product.category}\n`;
      result += `Brand: ${product.brand}\n\n`;

      if (isCompatible) {
        result += `✅ **COMPATIBLE**\n\n`;
        result += `Great news! Part ${partNumber} is compatible with model ${modelNumber}.\n\n`;
        result += `**Part Details:**\n`;
        result += `• Price: $${product.price}\n`;
        result += `• Availability: ${product.availability}\n`;
        result += `• Installation Difficulty: ${product.installationDifficulty}\n`;
        result += `• Estimated Install Time: ${product.installationTime} minutes\n\n`;
        result += `**Tools Required:**\n`;
        for (const tool of product.toolsRequired) {
          result += `• ${tool}\n`;
        }
        result += `\n**Next Steps:**\n`;
        result += `• You can proceed to order this part\n`;
        result += `• Review installation instructions if needed\n`;
        result += `• Consider professional installation for complex parts`;
      } else {
        result += `❌ **NOT COMPATIBLE**\n\n`;
        result += `Unfortunately, part ${partNumber} is not compatible with model ${modelNumber}.\n\n`;
        result += `**Compatible Models for this part:**\n`;
        for (const model of product.compatibleModels) {
          result += `• ${model}\n`;
        }
        result += `\n**Recommendations:**\n`;
        result += `• Double-check your model number (usually found on a label inside the appliance)\n`;
        result += `• Search for parts specifically designed for model ${modelNumber}\n`;
        result += `• Contact customer service with your model number for assistance finding the right part`;
      }

      return result;

    } catch (error: any) {
      console.error('CompatibilityTool error:', error);
      return `Error checking compatibility: ${error.message}. Please verify both the part number and model number are correct.`;
    }
  }
}