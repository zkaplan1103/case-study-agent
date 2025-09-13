import { Tool, ToolResult } from '../types';
import { SearchService } from '../services/SearchService';
import { TroubleshootingToolSchema } from '../data/schemas';

export class TroubleshootingTool implements Tool {
  public readonly name = 'TroubleshootingGuide';
  public readonly description = 'Diagnose appliance problems and recommend solutions based on symptoms';
  public readonly parameters = {
    symptom: { type: 'string', description: 'Description of the problem or symptom', required: true },
    category: { type: 'string', enum: ['refrigerator', 'dishwasher'], description: 'Type of appliance' },
    brand: { type: 'string', description: 'Brand of the appliance' },
    modelNumber: { type: 'string', description: 'Specific model number if available' }
  };

  constructor(private searchService: SearchService) {}

  public async execute(parameters: Record<string, any>): Promise<ToolResult> {
    try {
      console.log('🔍 TroubleshootingTool executing with parameters:', parameters);

      // Validate parameters
      const validation = TroubleshootingToolSchema.safeParse(parameters);
      if (!validation.success) {
        return {
          success: false,
          error: `Invalid parameters: ${validation.error.errors.map(e => e.message).join(', ')}`
        };
      }

      const { symptom, category, brand, modelNumber } = validation.data;

      // Search for troubleshooting information
      const troubleshootingResults = await this.searchService.searchTroubleshooting(symptom, category);

      if (!troubleshootingResults || troubleshootingResults.length === 0) {
        return {
          success: false,
          error: `No troubleshooting information found for the symptom: "${symptom}". Please provide more specific details about the problem.`
        };
      }

      // Get the best matching result
      const bestMatch = troubleshootingResults[0];

      // Format result for agent
      const formattedResult = {
        troubleshooting: bestMatch,
        summary: this.generateTroubleshootingSummary(bestMatch, symptom),
        diagnosticGuide: this.formatDiagnosticSteps(bestMatch),
        recommendedParts: bestMatch.recommendedParts || []
      };

      console.log(`✅ TroubleshootingTool found guidance for "${symptom}" with ${bestMatch.suggestedSteps.length} diagnostic steps`);

      return {
        success: true,
        data: formattedResult,
        metadata: {
          symptom,
          category: bestMatch.symptom.category,
          diagnosticStepCount: bestMatch.suggestedSteps.length,
          recommendedPartCount: bestMatch.recommendedParts?.length || 0,
          requiresProfessional: bestMatch.shouldContactProfessional
        }
      };

    } catch (error) {
      console.error('❌ TroubleshootingTool error:', error);
      return {
        success: false,
        error: `Troubleshooting analysis failed: ${(error as Error).message}`
      };
    }
  }

  private generateTroubleshootingSummary(result: any, originalSymptom: string): string {
    const { symptom, recommendedParts, shouldContactProfessional, reason } = result;

    let summary = `## Troubleshooting: ${symptom.description}\n\n`;
    
    summary += `**Your Issue**: ${originalSymptom}\n`;
    summary += `**Appliance Type**: ${symptom.category.charAt(0).toUpperCase() + symptom.category.slice(1)}\n\n`;

    // Common causes
    if (symptom.commonCauses && symptom.commonCauses.length > 0) {
      summary += `**Common Causes**:\n`;
      symptom.commonCauses.forEach((cause: string, index: number) => {
        summary += `${index + 1}. ${cause}\n`;
      });
      summary += `\n`;
    }

    // Professional recommendation
    if (shouldContactProfessional) {
      summary += `⚠️ **Professional Service Recommended**: ${reason}\n\n`;
    }

    // Parts summary
    if (recommendedParts && recommendedParts.length > 0) {
      const partCount = recommendedParts.length;
      const totalValue = recommendedParts.reduce((sum: number, part: any) => sum + part.price, 0);
      summary += `**Potentially Needed Parts**: ${partCount} part${partCount > 1 ? 's' : ''} identified (Total value: ~$${totalValue.toFixed(2)})\n`;
    }

    return summary;
  }

  private formatDiagnosticSteps(result: any): string {
    const { symptom, suggestedSteps, shouldContactProfessional } = result;

    let guide = `# Diagnostic Guide: ${symptom.description}\n\n`;

    if (shouldContactProfessional) {
      guide += `⚠️ **IMPORTANT**: This issue may require professional service. Follow these steps for initial diagnosis, but contact a qualified technician for complex repairs.\n\n`;
    }

    guide += `## Diagnostic Steps\n\n`;

    if (suggestedSteps && suggestedSteps.length > 0) {
      suggestedSteps.forEach((step: any, index: number) => {
        guide += `### ${step.step}. ${step.description}\n`;
        guide += `**What to look for**: ${step.expectedResult}\n`;
        
        if (step.recommendedAction) {
          guide += `**Recommended action**: ${step.recommendedAction}\n`;
        }

        // Add navigation hints
        if (step.nextStepIfTrue && step.nextStepIfFalse) {
          guide += `**Next step**: Go to step ${step.nextStepIfTrue} if yes, step ${step.nextStepIfFalse} if no\n`;
        } else if (step.nextStepIfTrue) {
          guide += `**Next step**: If this checks out, proceed to step ${step.nextStepIfTrue}\n`;
        } else if (step.nextStepIfFalse) {
          guide += `**Next step**: If this doesn't resolve the issue, go to step ${step.nextStepIfFalse}\n`;
        }

        guide += `\n`;
      });
    } else {
      guide += `No specific diagnostic steps available for this symptom. Consider:\n`;
      guide += `1. Check basic connections and power supply\n`;
      guide += `2. Inspect for obvious damage or wear\n`;
      guide += `3. Consult your appliance manual\n`;
      guide += `4. Contact professional service if problem persists\n\n`;
    }

    // Additional recommendations
    guide += `## General Recommendations\n`;
    guide += `- Always disconnect power before performing any inspections\n`;
    guide += `- Take photos of wire connections before disconnecting\n`;
    guide += `- Have your model number ready when ordering parts\n`;
    guide += `- If multiple parts are suspect, replace the most likely cause first\n`;
    guide += `- Test the appliance after each repair step\n\n`;

    if (shouldContactProfessional) {
      guide += `## When to Call a Professional\n`;
      guide += `- Electrical components need replacement\n`;
      guide += `- Gas connections are involved (dishwashers with gas water heaters)\n`;
      guide += `- Structural disassembly is required\n`;
      guide += `- You're not comfortable with the repair complexity\n`;
      guide += `- Multiple diagnostic steps don't resolve the issue\n`;
    }

    return guide;
  }
}