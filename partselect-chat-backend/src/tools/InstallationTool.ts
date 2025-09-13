import { z } from 'zod';
import { sampleProducts, installationGuides } from '../data/sampleProducts';

// Installation guide input schema
export const InstallationInputSchema = z.object({
  partNumber: z.string().min(1, "Part number is required"),
  modelNumber: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  format: z.enum(['text', 'html', 'json']).optional().default('text'),
  includeImages: z.boolean().optional().default(false),
  includeSafetyWarnings: z.boolean().optional().default(true)
});

export type InstallationInput = z.infer<typeof InstallationInputSchema>;

export interface InstallationStep {
  stepNumber: number;
  title: string;
  instruction: string;
  imageUrl?: string;
  videoUrl?: string;
  tips: string[];
  warnings: string[];
  estimatedTime: number; // minutes
  toolsNeeded: string[];
}

export interface InstallationGuide {
  partNumber: string;
  partName: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  totalEstimatedTime: number;
  totalToolsRequired: string[];
  safetyWarnings: string[];
  prerequisites: string[];
  steps: InstallationStep[];
  troubleshootingTips: string[];
  videoGuideUrl?: string;
  pdfGuideUrl?: string;
}

/**
 * Installation Guide Tool - Step-by-step instructions with media
 * Handles installation guide retrieval and formatting for chat display
 */
export class InstallationTool {
  private name = 'get_installation_guide';
  private description = 'Retrieve detailed step-by-step installation instructions for appliance parts with safety warnings and tool requirements';

  getName(): string {
    return this.name;
  }

  getDescription(): string {
    return this.description;
  }

  getInputSchema(): z.ZodSchema {
    return InstallationInputSchema;
  }

  /**
   * Execute installation guide retrieval with formatting
   */
  async execute(input: InstallationInput): Promise<string> {
    const validatedInput = InstallationInputSchema.parse(input);
    const { partNumber, modelNumber, difficulty, format, includeImages, includeSafetyWarnings } = validatedInput;

    console.log(`InstallationTool: Getting installation guide for ${partNumber}`);

    // Find the part in our database
    const part = sampleProducts.find(p => 
      p.partNumber.toUpperCase() === partNumber.toUpperCase()
    );

    if (!part) {
      return `Part ${partNumber} not found in our catalog. Please verify the part number and try again.`;
    }

    // Get detailed installation guide
    const guide = installationGuides[part.partNumber as keyof typeof installationGuides];
    
    if (!guide) {
      // Return basic installation info if no detailed guide available
      return this.generateBasicInstallationInfo(part);
    }

    // Format the installation guide based on requested format
    switch (format) {
      case 'html':
        return this.formatAsHtml(guide, part, includeImages, includeSafetyWarnings);
      case 'json':
        return JSON.stringify(this.formatAsStructuredData(guide, part), null, 2);
      default:
        return this.formatAsText(guide, part, includeSafetyWarnings);
    }
  }

  /**
   * Format installation guide as readable text for chat
   */
  private formatAsText(guide: any, part: any, includeSafetyWarnings: boolean): string {
    let response = `📋 INSTALLATION GUIDE: ${guide.title}\n\n`;
    response += `⏱️ Estimated Time: ${guide.estimatedTime} minutes\n`;
    response += `🔧 Tools Required: ${guide.toolsRequired.join(', ')}\n`;
    response += `⚠️ Difficulty Level: ${guide.difficulty.toUpperCase()}\n\n`;
    
    if (includeSafetyWarnings && guide.safetyWarnings.length > 0) {
      response += `🚨 SAFETY WARNINGS:\n`;
      guide.safetyWarnings.forEach((warning: string) => {
        response += `• ${warning}\n`;
      });
      response += '\n';
    }
    
    response += `📝 INSTALLATION STEPS:\n\n`;
    guide.steps.forEach((step: any) => {
      response += `${step.stepNumber}. ${step.title}\n`;
      response += `   ${step.instruction}\n`;
      if (step.tips && step.tips.length > 0) {
        response += `   💡 Tips: ${step.tips.join(', ')}\n`;
      }
      response += '\n';
    });
    
    response += `✅ After installation, test the appliance to ensure proper operation.\n`;
    response += `🛠️ If you encounter issues, contact PartSelect support for assistance.`;
    
    return response;
  }

  /**
   * Format installation guide as HTML for web display
   */
  private formatAsHtml(guide: any, part: any, includeImages: boolean, includeSafetyWarnings: boolean): string {
    let html = `<div class="installation-guide">`;
    html += `<h2>📋 ${guide.title}</h2>`;
    html += `<div class="guide-meta">`;
    html += `<p><strong>⏱️ Estimated Time:</strong> ${guide.estimatedTime} minutes</p>`;
    html += `<p><strong>🔧 Tools Required:</strong> ${guide.toolsRequired.join(', ')}</p>`;
    html += `<p><strong>⚠️ Difficulty:</strong> <span class="difficulty-${guide.difficulty}">${guide.difficulty.toUpperCase()}</span></p>`;
    html += `</div>`;

    if (includeSafetyWarnings && guide.safetyWarnings.length > 0) {
      html += `<div class="safety-warnings">`;
      html += `<h3>🚨 Safety Warnings</h3>`;
      html += `<ul>`;
      guide.safetyWarnings.forEach((warning: string) => {
        html += `<li>${warning}</li>`;
      });
      html += `</ul></div>`;
    }

    html += `<div class="installation-steps">`;
    html += `<h3>📝 Installation Steps</h3>`;
    html += `<ol>`;
    
    guide.steps.forEach((step: any) => {
      html += `<li class="step">`;
      html += `<h4>${step.title}</h4>`;
      html += `<p>${step.instruction}</p>`;
      if (step.tips && step.tips.length > 0) {
        html += `<div class="tips">💡 <strong>Tips:</strong> ${step.tips.join(', ')}</div>`;
      }
      html += `</li>`;
    });
    
    html += `</ol></div>`;
    html += `<div class="completion-note">`;
    html += `<p>✅ After installation, test the appliance to ensure proper operation.</p>`;
    html += `<p>🛠️ If you encounter issues, contact PartSelect support for assistance.</p>`;
    html += `</div></div>`;

    return html;
  }

  /**
   * Format installation guide as structured data
   */
  private formatAsStructuredData(guide: any, part: any): InstallationGuide {
    return {
      partNumber: part.partNumber,
      partName: part.name,
      title: guide.title,
      difficulty: guide.difficulty,
      totalEstimatedTime: guide.estimatedTime,
      totalToolsRequired: guide.toolsRequired,
      safetyWarnings: guide.safetyWarnings,
      prerequisites: [
        "Disconnect power to appliance",
        "Ensure proper ventilation",
        "Have all tools ready"
      ],
      steps: guide.steps.map((step: any, index: number) => ({
        stepNumber: step.stepNumber,
        title: step.title,
        instruction: step.instruction,
        tips: step.tips || [],
        warnings: [],
        estimatedTime: Math.ceil(guide.estimatedTime / guide.steps.length),
        toolsNeeded: guide.toolsRequired
      })),
      troubleshootingTips: [
        "If installation doesn't work as expected, double-check all connections",
        "Ensure part is properly seated and secured",
        "Verify power connections are tight",
        "Contact support if issues persist"
      ]
    };
  }

  /**
   * Generate basic installation info when detailed guide is not available
   */
  private generateBasicInstallationInfo(part: any): string {
    let response = `📋 INSTALLATION INFO: ${part.partNumber} - ${part.name}\n\n`;
    response += `⚠️ Difficulty: ${part.installationDifficulty}\n`;
    response += `⏱️ Estimated Time: ${part.installationTime} minutes\n`;
    response += `🔧 Tools Required: ${part.toolsRequired.join(', ')}\n\n`;
    
    response += `📝 GENERAL INSTALLATION GUIDELINES:\n\n`;
    response += `1. Safety First\n`;
    response += `   Disconnect power to the appliance before beginning installation.\n\n`;
    response += `2. Prepare Tools\n`;
    response += `   Gather all required tools and have them ready.\n\n`;
    response += `3. Remove Old Part\n`;
    response += `   Carefully disconnect and remove the old ${part.name.toLowerCase()}.\n\n`;
    response += `4. Install New Part\n`;
    response += `   Position and secure the new ${part.name.toLowerCase()} according to manufacturer instructions.\n\n`;
    response += `5. Test Operation\n`;
    response += `   Restore power and test the appliance to ensure proper operation.\n\n`;
    
    response += `⚠️ IMPORTANT: Detailed step-by-step instructions are not available for this part. `;
    response += `Please consult the manufacturer's documentation or contact our support team for assistance.\n\n`;
    response += `📞 Support: 1-877-387-7463`;
    
    return response;
  }

  /**
   * Get installation difficulty assessment
   */
  async assessInstallationDifficulty(partNumber: string): Promise<{
    difficulty: 'easy' | 'medium' | 'hard';
    factors: string[];
    recommendations: string[];
  }> {
    const part = sampleProducts.find(p => 
      p.partNumber.toUpperCase() === partNumber.toUpperCase()
    );

    if (!part) {
      return {
        difficulty: 'medium',
        factors: ['Part not found in database'],
        recommendations: ['Verify part number', 'Contact support for guidance']
      };
    }

    const factors = [];
    const recommendations = [];

    // Analyze difficulty factors
    if (part.installationTime > 60) {
      factors.push('Long installation time');
      recommendations.push('Set aside adequate time');
    }

    if (part.toolsRequired.length > 3) {
      factors.push('Multiple tools required');
      recommendations.push('Gather all tools before starting');
    }

    if (part.category === 'dishwasher' && part.name.includes('pump')) {
      factors.push('Complex mechanical component');
      recommendations.push('Consider professional installation');
    }

    return {
      difficulty: part.installationDifficulty as 'easy' | 'medium' | 'hard',
      factors: factors.length > 0 ? factors : ['Standard installation complexity'],
      recommendations: recommendations.length > 0 ? recommendations : ['Follow standard safety procedures']
    };
  }

  /**
   * Get related installation guides
   */
  async getRelatedGuides(partNumber: string): Promise<string[]> {
    const part = sampleProducts.find(p => 
      p.partNumber.toUpperCase() === partNumber.toUpperCase()
    );

    if (!part) {
      return [];
    }

    // Find related parts in the same category
    const relatedParts = sampleProducts
      .filter(p => 
        p.category === part.category && 
        p.partNumber !== part.partNumber
      )
      .slice(0, 3)
      .map(p => p.partNumber);

    return relatedParts;
  }
}