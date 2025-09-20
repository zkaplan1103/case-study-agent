import { Tool, ToolResult } from '../types';
import { SearchService } from '../services/SearchService';

// Note: Assuming tool schemas are managed centrally or in a file like this
interface InstallationToolParameters {
  partNumber: string;
}

/**
 * A tool to retrieve installation instructions for a specific part.
 * It queries the SearchService to get the instructions and provides a structured
 * output for the agent to use in a response.
 */
export class InstallationTool implements Tool {
  /**
   * The name of the tool, used by the agent to identify it.
   */
  public readonly name = 'InstallationGuide';

  /**
   * A detailed description of the tool's function.
   */
  public readonly description = 'Get step-by-step installation instructions for a specific part.';

  /**
   * The expected parameters for the tool, including their type and description.
   */
  public readonly parameters = {
    partNumber: { type: 'string', description: 'Part number to get installation instructions for', required: true }
  };

  /**
   * @param searchService - An instance of the SearchService to be used for data retrieval.
   */
  constructor(private searchService: SearchService) {}

  /**
   * Executes the instruction retrieval based on the part number.
   * @param parameters - A record of string keys and any values. Expected to contain `partNumber`.
   * @returns A promise that resolves to a ToolResult object indicating success or failure.
   */
  public async execute(parameters: Record<string, any>): Promise<ToolResult> {
    const { partNumber } = parameters as InstallationToolParameters;

    console.log(`[InstallationTool] - Executing with part number: ${partNumber}`);

    if (!partNumber) {
      const error = 'Missing required parameter: partNumber.';
      console.error(`[InstallationTool] - Execution failed: ${error}`);
      return {
        success: false,
        error
      };
    }

    try {
      const installationData = await this.searchService.getInstallationInstructions(partNumber);

      if (!installationData) {
        const error = `Installation instructions not found for part ${partNumber}. Please verify the part number is correct.`;
        console.error(`[InstallationTool] - Execution failed: ${error}`);
        return {
          success: false,
          error
        };
      }

      console.log(`[InstallationTool] - Found instructions for ${partNumber} with a difficulty of "${installationData.difficulty}".`);

      return {
        success: true,
        data: {
          summary: this.generateInstallationSummary(installationData),
          instructions: installationData // Return the full data object for agent to format
        },
        metadata: {
          partNumber,
          difficulty: installationData.difficulty,
          estimatedTime: installationData.estimatedTime,
          requiredTools: installationData.requiredTools,
          stepCount: installationData.steps.length
        }
      };

    } catch (error) {
      const errorMessage = `Failed to get installation instructions: ${(error as Error).message}`;
      console.error(`[InstallationTool] - Execution failed due to an exception: ${errorMessage}`);
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Generates a concise summary message from the installation data.
   * This is a simplified summary meant to be read by the agent to inform its response.
   * @param data - The installation data object.
   * @returns A string summary.
   */
  private generateInstallationSummary(data: any): string {
    const { partName, difficulty, estimatedTime, requiredTools, steps } = data;

    const timeText = estimatedTime > 60 ? 
      `${Math.round(estimatedTime / 60)} hour${estimatedTime > 120 ? 's' : ''}` :
      `${estimatedTime} minutes`;

    const toolText = requiredTools.length === 0 || 
      (requiredTools.length === 1 && requiredTools[0].toLowerCase().includes('none')) ?
      'no tools required' :
      `${requiredTools.length} tool${requiredTools.length > 1 ? 's' : ''} needed`;

    return `Installation Guide for ${partName}: Difficulty is ${difficulty}, estimated time is ${timeText}, and it requires ${toolText} to complete ${steps.length} steps.`;
  }
}