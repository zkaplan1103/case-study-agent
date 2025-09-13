import { Tool, ToolResult } from '../types';
import { SearchService } from '../services/SearchService';
import { CompatibilityToolSchema } from '../data/schemas';

export class CompatibilityTool implements Tool {
  public readonly name = 'CompatibilityCheck';
  public readonly description = 'Check if a specific part is compatible with an appliance model';
  public readonly parameters = {
    partNumber: { type: 'string', description: 'Part number to check compatibility for', required: true },
    modelNumber: { type: 'string', description: 'Appliance model number', required: true }
  };

  constructor(private searchService: SearchService) {}

  public async execute(parameters: Record<string, any>): Promise<ToolResult> {
    try {
      console.log('🔍 CompatibilityTool executing with parameters:', parameters);

      // Validate parameters
      const validation = CompatibilityToolSchema.safeParse(parameters);
      if (!validation.success) {
        return {
          success: false,
          error: `Invalid parameters: ${validation.error.errors.map(e => e.message).join(', ')}`
        };
      }

      const { partNumber, modelNumber } = validation.data;

      // Perform compatibility check
      const compatibilityResult = await this.searchService.checkCompatibility(partNumber, modelNumber);

      // Format result for agent
      const formattedResult = {
        compatibility: compatibilityResult,
        summary: this.generateCompatibilitySummary(compatibilityResult),
        recommendation: this.generateRecommendation(compatibilityResult)
      };

      console.log(`✅ CompatibilityTool checked ${partNumber} with ${modelNumber}: ${compatibilityResult.isCompatible ? 'Compatible' : 'Not Compatible'}`);

      return {
        success: true,
        data: formattedResult,
        metadata: {
          partNumber,
          modelNumber,
          isCompatible: compatibilityResult.isCompatible,
          confidence: compatibilityResult.confidence
        }
      };

    } catch (error) {
      console.error('❌ CompatibilityTool error:', error);
      return {
        success: false,
        error: `Compatibility check failed: ${(error as Error).message}`
      };
    }
  }

  private generateCompatibilitySummary(result: any): string {
    const { partNumber, modelNumber, isCompatible, confidence, reason } = result;

    if (isCompatible) {
      const confidenceText = confidence >= 1.0 ? 'confirmed' : 
                            confidence >= 0.8 ? 'highly likely' : 
                            'possible';
      
      return `✅ **COMPATIBLE** - Part ${partNumber} is ${confidenceText} compatible with model ${modelNumber}. ${reason}`;
    } else {
      return `❌ **NOT COMPATIBLE** - Part ${partNumber} is not compatible with model ${modelNumber}. ${reason}`;
    }
  }

  private generateRecommendation(result: any): string {
    const { isCompatible, alternativeParts } = result;

    if (isCompatible) {
      return "You can proceed with this part. Make sure to follow proper installation procedures and safety guidelines.";
    } else {
      if (alternativeParts && alternativeParts.length > 0) {
        const alternatives = alternativeParts
          .slice(0, 3)
          .map((part: any) => `${part.name} (${part.partNumber}) - $${part.price}`)
          .join(', ');
        
        return `Consider these compatible alternatives: ${alternatives}. I recommend using the ProductSearch tool to find more compatible parts for your model.`;
      } else {
        return "No direct alternatives found in our database. I recommend searching for compatible parts using your model number, or contacting our support team for assistance.";
      }
    }
  }
}