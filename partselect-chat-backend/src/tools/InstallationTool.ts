import { z } from 'zod';
import { SimpleSearchService } from '../services/SimpleSearchService';

// Simplified installation guide input schema
export const InstallationInputSchema = z.object({
  partNumber: z.string().min(1, "Part number is required")
});

export type InstallationInput = z.infer<typeof InstallationInputSchema>;

/**
 * Simple Installation Guide Tool for Instalily requirements
 * Handles the "How can I install part number PS11752778?" query
 */
export class InstallationTool {
  private name = 'get_installation_guide';
  private description = 'Get step-by-step installation instructions for a specific part number';
  private searchService = new SimpleSearchService();

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
   * Execute installation guide lookup
   */
  async execute(input: Record<string, any>): Promise<string> {
    try {
      const { partNumber } = InstallationInputSchema.parse(input);
      
      console.log(`InstallationTool: Looking up installation guide for ${partNumber}`);
      
      // Find the product using SimpleSearchService
      const product = this.searchService.getProductByPartNumber(partNumber);

      if (!product) {
        return `Part number ${partNumber} not found. Please verify the part number and try again.`;
      }

      // Generate installation instructions based on the part
      let guide = `**Installation Guide for ${product.partNumber} - ${product.name}**\n\n`;
      
      guide += `**Part Details:**\n`;
      guide += `• Part Number: ${product.partNumber}\n`;
      guide += `• Name: ${product.name}\n`;
      guide += `• Category: ${product.category}\n`;
      guide += `• Brand: ${product.brand}\n`;
      guide += `• Difficulty: ${product.installationDifficulty}\n`;
      guide += `• Estimated Time: ${product.installationTime} minutes\n\n`;

      guide += `**Tools Required:**\n`;
      for (const tool of product.toolsRequired) {
        guide += `• ${tool}\n`;
      }
      guide += `\n`;

      // Generate specific installation steps based on part type
      if (product.partNumber === 'PS11752778') {
        guide += `**Safety Warnings:**\n`;
        guide += `⚠️ Disconnect power to the refrigerator before beginning installation\n`;
        guide += `⚠️ Turn off water supply to the ice maker\n`;
        guide += `⚠️ Have towels ready to catch any water spillage\n\n`;

        guide += `**Installation Steps:**\n\n`;
        guide += `**Step 1: Preparation (5 minutes)**\n`;
        guide += `• Unplug the refrigerator from power\n`;
        guide += `• Locate the ice maker in the freezer compartment\n`;
        guide += `• Take a photo of the current wiring connections for reference\n\n`;

        guide += `**Step 2: Remove Old Ice Maker (15 minutes)**\n`;
        guide += `• Disconnect the wire harness from the old ice maker\n`;
        guide += `• Disconnect the water line (have towel ready)\n`;
        guide += `• Remove the mounting screws (usually 2-3 screws)\n`;
        guide += `• Carefully lift out the old ice maker assembly\n\n`;

        guide += `**Step 3: Install New Ice Maker (20 minutes)**\n`;
        guide += `• Position the new ice maker in the mounting bracket\n`;
        guide += `• Secure with the original mounting screws\n`;
        guide += `• Reconnect the water line (ensure tight connection)\n`;
        guide += `• Reconnect the wire harness (match colors: white to white, etc.)\n\n`;

        guide += `**Step 4: Testing (5 minutes)**\n`;
        guide += `• Restore power to the refrigerator\n`;
        guide += `• Turn on the ice maker switch\n`;
        guide += `• Wait 24 hours for first ice production\n`;
        guide += `• Check for any water leaks around connections\n\n`;

        guide += `**Troubleshooting Tips:**\n`;
        guide += `• If ice maker doesn't start, check wire connections\n`;
        guide += `• If water leaks, tighten water line connections\n`;
        guide += `• Allow 24-48 hours for full ice production to begin\n`;
      } else {
        // Generic installation steps for other parts
        guide += `**Installation Steps:**\n\n`;
        guide += `**Step 1: Preparation**\n`;
        guide += `• Disconnect power to the appliance\n`;
        guide += `• Gather required tools: ${product.toolsRequired.join(', ')}\n`;
        guide += `• Review part compatibility with your model\n\n`;

        guide += `**Step 2: Remove Old Part**\n`;
        guide += `• Locate the old ${product.name.toLowerCase()}\n`;
        guide += `• Carefully disconnect any wiring or connections\n`;
        guide += `• Remove mounting hardware\n`;
        guide += `• Take note of installation position\n\n`;

        guide += `**Step 3: Install New Part**\n`;
        guide += `• Position the new ${product.name.toLowerCase()}\n`;
        guide += `• Secure with original hardware\n`;
        guide += `• Reconnect all wiring and connections\n`;
        guide += `• Ensure proper fit and alignment\n\n`;

        guide += `**Step 4: Test Installation**\n`;
        guide += `• Restore power to the appliance\n`;
        guide += `• Test the part function\n`;
        guide += `• Check for proper operation\n`;
        guide += `• Monitor for any issues\n\n`;
      }

      guide += `**Warranty Information:**\n`;
      guide += `${product.warranty}\n\n`;

      guide += `**Need Help?**\n`;
      guide += `If you encounter difficulties during installation, consider consulting a professional technician.`;

      return guide;

    } catch (error: any) {
      console.error('InstallationTool error:', error);
      return `Error retrieving installation guide: ${error.message}`;
    }
  }
}