import { Tool, ToolResult } from '../types';
import { SearchService } from '../services/SearchService';
import { InstallationToolSchema } from '../data/schemas';

export class InstallationTool implements Tool {
  public readonly name = 'InstallationGuide';
  public readonly description = 'Get step-by-step installation instructions for a specific part';
  public readonly parameters = {
    partNumber: { type: 'string', description: 'Part number to get installation instructions for', required: true }
  };

  constructor(private searchService: SearchService) {}

  public async execute(parameters: Record<string, any>): Promise<ToolResult> {
    try {
      console.log('🔧 InstallationTool executing with parameters:', parameters);

      // Validate parameters
      const validation = InstallationToolSchema.safeParse(parameters);
      if (!validation.success) {
        return {
          success: false,
          error: `Invalid parameters: ${validation.error.errors.map(e => e.message).join(', ')}`
        };
      }

      const { partNumber } = validation.data;

      // Get installation instructions
      const installationData = await this.searchService.getInstallationInstructions(partNumber);

      if (!installationData) {
        return {
          success: false,
          error: `Installation instructions not found for part ${partNumber}. Please verify the part number is correct.`
        };
      }

      // Format instructions for agent
      const formattedResult = {
        installation: installationData,
        summary: this.generateInstallationSummary(installationData),
        formattedInstructions: this.formatInstructions(installationData)
      };

      console.log(`✅ InstallationTool found instructions for ${partNumber} (${installationData.difficulty} difficulty)`);

      return {
        success: true,
        data: formattedResult,
        metadata: {
          partNumber,
          difficulty: installationData.difficulty,
          estimatedTime: installationData.estimatedTime,
          toolCount: installationData.requiredTools.length,
          stepCount: installationData.steps.length
        }
      };

    } catch (error) {
      console.error('❌ InstallationTool error:', error);
      return {
        success: false,
        error: `Failed to get installation instructions: ${(error as Error).message}`
      };
    }
  }

  private generateInstallationSummary(data: any): string {
    const { partName, difficulty, estimatedTime, requiredTools, steps } = data;

    const difficultyEmojiMap: Record<string, string> = {
      easy: '🟢',
      medium: '🟡', 
      hard: '🔴'
    };
    const difficultyEmoji = difficultyEmojiMap[difficulty] || '⚪';

    const timeText = estimatedTime > 60 ? 
      `${Math.round(estimatedTime / 60)} hour${estimatedTime > 120 ? 's' : ''}` :
      `${estimatedTime} minutes`;

    const toolText = requiredTools.length === 0 || 
      (requiredTools.length === 1 && requiredTools[0].toLowerCase().includes('none')) ?
      'no tools required' :
      `${requiredTools.length} tool${requiredTools.length > 1 ? 's' : ''} needed`;

    return `${difficultyEmoji} **Installation Guide for ${partName}**\n` +
           `**Difficulty**: ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}\n` +
           `**Estimated Time**: ${timeText}\n` +
           `**Tools Required**: ${toolText}\n` +
           `**Steps**: ${steps.length} detailed steps`;
  }

  private formatInstructions(data: any): string {
    let formatted = `# Installation Instructions: ${data.partName}\n\n`;

    // Overview section
    formatted += `## Overview\n`;
    formatted += `- **Part Number**: ${data.partNumber}\n`;
    formatted += `- **Difficulty**: ${data.difficulty.charAt(0).toUpperCase() + data.difficulty.slice(1)}\n`;
    formatted += `- **Estimated Time**: ${data.estimatedTime > 60 ? 
      Math.round(data.estimatedTime / 60) + ' hour(s)' : 
      data.estimatedTime + ' minutes'}\n\n`;

    // Required tools section
    if (data.requiredTools.length > 0 && !data.requiredTools[0].toLowerCase().includes('none')) {
      formatted += `## Required Tools\n`;
      data.requiredTools.forEach((tool: string, index: number) => {
        formatted += `${index + 1}. ${tool}\n`;
      });
      formatted += `\n`;
    }

    // Safety warnings section
    if (data.safetyWarnings.length > 0) {
      formatted += `## ⚠️ Safety Warnings\n`;
      data.safetyWarnings.forEach((warning: string, index: number) => {
        formatted += `${index + 1}. ⚠️ ${warning}\n`;
      });
      formatted += `\n`;
    }

    // Installation steps section
    if (data.steps.length > 0) {
      formatted += `## Installation Steps\n\n`;
      data.steps.forEach((step: any) => {
        formatted += `### Step ${step.step}: ${step.title}\n`;
        formatted += `${step.description}\n`;
        if (step.warning) {
          formatted += `⚠️ **Warning**: ${step.warning}\n`;
        }
        formatted += `\n`;
      });
    }

    // Additional notes section
    if (data.additionalNotes && data.additionalNotes.length > 0) {
      formatted += `## Additional Notes\n`;
      data.additionalNotes.forEach((note: string, index: number) => {
        formatted += `- ${note}\n`;
      });
      formatted += `\n`;
    }

    // Final recommendations
    formatted += `## Final Recommendations\n`;
    formatted += `- Test the appliance after installation to ensure proper operation\n`;
    formatted += `- Keep the old part for warranty or return purposes\n`;
    formatted += `- Contact a professional technician if you encounter any difficulties\n`;
    formatted += `- Register your repair for warranty tracking if applicable\n`;

    return formatted;
  }
}