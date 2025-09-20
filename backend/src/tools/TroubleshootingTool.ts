import { Tool, ToolResult, TroubleshootingResult } from '../types';
import { SearchService } from '../services/SearchService';

// Note: Using a type alias for clarity on the expected parameters
interface TroubleshootingToolParameters {
  symptom: string;
  category?: 'refrigerator' | 'dishwasher';
  brand?: string;
  modelNumber?: string;
}

/**
 * A tool to diagnose appliance problems and recommend solutions based on symptoms.
 * It queries the SearchService for troubleshooting information and provides a
 * structured guide for the agent to use in a response.
 */
export class TroubleshootingTool implements Tool {
  /**
   * The name of the tool, used by the agent to identify it.
   */
  public readonly name = 'TroubleshootingGuide';

  /**
   * A detailed description of the tool's function.
   */
  public readonly description = 'Diagnose appliance problems and recommend solutions based on symptoms.';

  /**
   * The expected parameters for the tool, including their type and description.
   */
  public readonly parameters = {
    symptom: { type: 'string', description: 'Description of the problem or symptom', required: true },
    category: { type: 'string', enum: ['refrigerator', 'dishwasher'], description: 'Type of appliance' },
    brand: { type: 'string', description: 'Brand of the appliance' },
    modelNumber: { type: 'string', description: 'Specific model number if available' }
  };

  /**
   * @param searchService - An instance of the SearchService to be used for data retrieval.
   */
  constructor(private searchService: SearchService) {}

  /**
   * Executes the troubleshooting search based on provided parameters.
   * @param parameters - A record of string keys and any values. Expected to contain a `symptom` and optional `category`.
   * @returns A promise that resolves to a ToolResult object indicating success or failure.
   */
  public async execute(parameters: Record<string, any>): Promise<ToolResult> {
    const { symptom, category } = parameters as TroubleshootingToolParameters;

    console.log(`[TroubleshootingTool] - Executing with parameters: Symptom: "${symptom}", Category: ${category || 'N/A'}`);

    if (!symptom) {
      const error = 'Missing required parameter: symptom.';
      console.error(`[TroubleshootingTool] - Execution failed: ${error}`);
      return {
        success: false,
        error
      };
    }

    try {
      const troubleshootingResults = await this.searchService.searchTroubleshooting(symptom, category);

      if (!troubleshootingResults || troubleshootingResults.length === 0) {
        const error = `No troubleshooting information found for the symptom: "${symptom}".`;
        console.error(`[TroubleshootingTool] - Execution failed: ${error}`);
        return {
          success: false,
          error
        };
      }

      const bestMatch = troubleshootingResults[0];

      console.log(`[TroubleshootingTool] - Found guidance for "${symptom}" with ${bestMatch.suggestedSteps?.length || 0} diagnostic steps.`);

      return {
        success: true,
        data: {
          summary: this.generateTroubleshootingSummary(bestMatch),
          diagnosticSteps: bestMatch.suggestedSteps,
          recommendedParts: bestMatch.recommendedParts,
          professionalContact: {
            shouldContact: bestMatch.shouldContactProfessional,
            reason: bestMatch.reason
          }
        },
        metadata: {
          symptom: bestMatch.symptom.description,
          category: bestMatch.symptom.category,
          diagnosticStepCount: bestMatch.suggestedSteps?.length || 0,
          recommendedPartCount: bestMatch.recommendedParts?.length || 0,
          requiresProfessional: bestMatch.shouldContactProfessional
        }
      };

    } catch (error) {
      const errorMessage = `Troubleshooting analysis failed: ${(error as Error).message}`;
      console.error(`[TroubleshootingTool] - Execution failed due to an exception: ${errorMessage}`);
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Generates a concise summary message from the troubleshooting data.
   * @param result - The troubleshooting result object.
   * @returns A string summary of the troubleshooting outcome.
   */
  private generateTroubleshootingSummary(result: TroubleshootingResult): string {
    const { symptom, recommendedParts, shouldContactProfessional, reason } = result;

    let summary = `Troubleshooting guidance for the symptom "${symptom.description}".`;
    
    if (shouldContactProfessional) {
      summary += ` A professional service is recommended due to: ${reason}.`;
    }

    if (recommendedParts && recommendedParts.length > 0) {
      const partNames = recommendedParts.map(part => `${part.name} (${part.partNumber})`).join(', ');
      summary += ` Potentially needed parts include: ${partNames}.`;
    }

    if (result.suggestedSteps && result.suggestedSteps.length > 0) {
      summary += ` Follow the ${result.suggestedSteps.length} diagnostic steps to pinpoint the issue.`;
    }

    return summary;
  }
}