import { Tool, ToolResult, CompatibilityCheck } from '../types';
import { SearchService } from '../services/SearchService';

// Note: Assuming tool schemas are managed centrally or in a file like this
interface CompatibilityToolParameters {
  partNumber: string;
  modelNumber: string;
}

/**
 * A tool to check the compatibility between a specific part and an appliance model.
 * It queries the SearchService to determine compatibility and provides a clear summary
 * and recommendation to the user.
 */
export class CompatibilityTool implements Tool {
  /**
   * The name of the tool, used by the agent to identify it.
   */
  public readonly name = 'CompatibilityCheck';

  /**
   * A detailed description of the tool's function.
   */
  public readonly description = 'Check if a specific part is compatible with an appliance model.';

  /**
   * The expected parameters for the tool, including their type and description.
   */
  public readonly parameters = {
    partNumber: { type: 'string', description: 'Part number to check compatibility for', required: true },
    modelNumber: { type: 'string', description: 'Appliance model number', required: true }
  };

  /**
   * @param searchService - An instance of the SearchService to be used for data retrieval.
   */
  constructor(private searchService: SearchService) {}

  /**
   * Executes the compatibility check based on provided parameters.
   * @param parameters - A record of string keys and any values. Expected to contain `partNumber` and `modelNumber`.
   * @returns A promise that resolves to a ToolResult object indicating success or failure.
   */
  public async execute(parameters: Record<string, any>): Promise<ToolResult> {
    const { partNumber, modelNumber } = parameters as CompatibilityToolParameters;

    console.log(`[CompatibilityTool] - Executing with parameters: Part Number: ${partNumber}, Model Number: ${modelNumber}`);

    if (!partNumber || !modelNumber) {
      const error = 'Missing required parameters: partNumber and modelNumber.';
      console.error(`[CompatibilityTool] - Execution failed: ${error}`);
      return {
        success: false,
        error
      };
    }

    try {
      const compatibilityResult = await this.searchService.checkCompatibility(partNumber, modelNumber);
      
      const summary = this.generateCompatibilitySummary(compatibilityResult);
      const recommendation = this.generateRecommendation(compatibilityResult);

      console.log(`[CompatibilityTool] - Compatibility check complete. Result: Compatible: ${compatibilityResult.isCompatible}`);
      
      return {
        success: true,
        data: { summary, recommendation },
        metadata: {
          partNumber: compatibilityResult.partNumber,
          modelNumber: compatibilityResult.modelNumber,
          isCompatible: compatibilityResult.isCompatible
        }
      };

    } catch (error) {
      const errorMessage = `Failed to check compatibility: ${(error as Error).message}`;
      console.error(`[CompatibilityTool] - Execution failed due to an exception: ${errorMessage}`);
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Generates a concise summary message based on the compatibility result.
   * @param result - The compatibility check result object.
   * @returns A string summary of the compatibility outcome.
   */
  private generateCompatibilitySummary(result: CompatibilityCheck): string {
    const { partNumber, modelNumber, isCompatible, confidence, reason } = result;

    if (isCompatible) {
      const confidenceText = confidence >= 1.0 ? 'confirmed' : 'likely';
      return `COMPATIBLE - Part ${partNumber} is ${confidenceText} compatible with model ${modelNumber}. ${reason}`;
    } else {
      return `NOT COMPATIBLE - Part ${partNumber} is not compatible with model ${modelNumber}. ${reason}`;
    }
  }

  /**
   * Generates a recommendation message for the user based on the compatibility result.
   * @param result - The compatibility check result object.
   * @returns A string recommendation for the next steps.
   */
  private generateRecommendation(result: CompatibilityCheck): string {
    const { isCompatible, alternativeParts } = result;

    if (isCompatible) {
      return "You can proceed with this part. Make sure to follow proper installation procedures and safety guidelines.";
    } else {
      if (alternativeParts && alternativeParts.length > 0) {
        const alternatives = alternativeParts
          .map(part => `${part.name} (${part.partNumber}) - $${part.price}`)
          .join(', ');
        
        return `Consider these compatible alternatives: ${alternatives}.`;
      } else {
        return "No direct alternatives found. I recommend searching for compatible parts using your model number or contacting support for assistance.";
      }
    }
  }
}