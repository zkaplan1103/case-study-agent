import { z } from 'zod';
import { SimpleSearchService } from '../services/SimpleSearchService';

// Simplified troubleshooting input schema
export const TroubleshootingInputSchema = z.object({
  symptoms: z.string().min(1, "Symptoms description is required"),
  applianceType: z.enum(['refrigerator', 'dishwasher']),
  brand: z.string().optional()
});

export type TroubleshootingInput = z.infer<typeof TroubleshootingInputSchema>;

/**
 * Simple Troubleshooting Tool for Instalily requirements
 * Handles the "The ice maker on my Whirlpool fridge is not working. How can I fix it?" query
 */
export class TroubleshootingTool {
  private name = 'diagnose_issue';
  private description = 'Diagnose appliance problems and recommend solutions and parts';
  private searchService = new SimpleSearchService();

  getName(): string {
    return this.name;
  }

  getDescription(): string {
    return this.description;
  }

  getInputSchema(): z.ZodSchema {
    return TroubleshootingInputSchema;
  }

  /**
   * Execute troubleshooting diagnosis
   */
  async execute(input: Record<string, any>): Promise<string> {
    try {
      const { symptoms, applianceType, brand } = TroubleshootingInputSchema.parse(input);
      
      console.log(`TroubleshootingTool: Diagnosing ${applianceType} issue: "${symptoms}"`);
      
      // Extract key symptom words for part matching
      const symptomWords = this.extractSymptomKeywords(symptoms);
      
      // Find potentially related parts based on symptoms
      const relatedParts = this.searchService.findPartsBySymptoms(symptomWords);
      
      let response = `**Troubleshooting Guide: ${applianceType.charAt(0).toUpperCase() + applianceType.slice(1)} Issue**\n\n`;
      response += `**Reported Problem:** ${symptoms}\n`;
      if (brand) response += `**Brand:** ${brand}\n`;
      response += `\n`;

      // Provide specific troubleshooting for common issues
      if (symptoms.toLowerCase().includes('ice maker')) {
        response += this.getIceMakerTroubleshooting();
      } else if (symptoms.toLowerCase().includes('water') && symptoms.toLowerCase().includes('leak')) {
        response += this.getWaterLeakTroubleshooting(applianceType);
      } else if (symptoms.toLowerCase().includes('not working') || symptoms.toLowerCase().includes('broken')) {
        response += this.getGeneralTroubleshooting(applianceType);
      } else {
        response += this.getSymptomBasedTroubleshooting(symptoms, applianceType);
      }

      // Add relevant parts if found
      if (relatedParts.length > 0) {
        response += `\n**Recommended Parts:**\n\n`;
        for (const result of relatedParts.slice(0, 3)) {
          const part = result.product;
          response += `• **${part.partNumber} - ${part.name}**\n`;
          response += `  Price: $${part.price} | Availability: ${part.availability}\n`;
          response += `  Reason: ${result.reason}\n\n`;
        }
      }

      response += `\n**Need More Help?**\n`;
      response += `If these steps don't resolve the issue, consider consulting a professional technician or contact customer support with your specific model number.`;

      return response;

    } catch (error: any) {
      console.error('TroubleshootingTool error:', error);
      return `Error diagnosing issue: ${error.message}. Please provide a clear description of the problem.`;
    }
  }

  private getIceMakerTroubleshooting(): string {
    return `**Ice Maker Troubleshooting Steps:**

**Step 1: Basic Checks (5 minutes)**
• Verify the ice maker is turned ON (switch inside freezer)
• Check if the freezer temperature is set to 0°F (-18°C)
• Ensure water supply is connected and turned on
• Look for any visible ice blockages

**Step 2: Reset the Ice Maker (10 minutes)**
• Locate the reset button (usually on the unit or behind front panel)
• Hold reset button for 5-10 seconds until you hear a chime
• Wait 24 hours for ice production to resume

**Step 3: Check Water Filter (15 minutes)**
• Locate the water filter (usually in refrigerator or base grille)
• Check if filter indicator light is red or has been 6+ months
• Replace filter if needed (part number varies by model)

**Step 4: Inspect for Clogs (20 minutes)**
• Turn off ice maker and remove ice bin
• Look for ice jams in the ice chute
• Pour warm water over frozen areas to clear blockages
• Check that ice cubes are not stuck in the ejector mechanism

**Common Causes & Solutions:**
• **No ice production**: Usually water supply or filter issue
• **Small/hollow ice cubes**: Low water pressure or clogged filter  
• **Ice tastes bad**: Replace water filter
• **Noisy operation**: Ice jam or worn ice maker assembly

⚠️ **Safety Note:** Always disconnect power when working inside the appliance.`;
  }

  private getWaterLeakTroubleshooting(applianceType: string): string {
    if (applianceType === 'dishwasher') {
      return `**Dishwasher Water Leak Troubleshooting:**

**Step 1: Locate the Leak Source (10 minutes)**
• Check around door seals for water droplets
• Look under the dishwasher for puddles
• Inspect water supply connections at back
• Check if leak occurs during specific wash cycles

**Step 2: Door Seal Inspection (15 minutes)**
• Open dishwasher door and examine rubber door seal
• Look for cracks, tears, or food debris buildup
• Clean seal with warm soapy water
• Replace door seal if damaged (common part needed)

**Step 3: Check Door Alignment (10 minutes)**
• Verify door closes completely and latches properly
• Adjust door hinges if door seems misaligned
• Check that door gasket seals evenly around frame

**Step 4: Internal Component Check (20 minutes)**
• Remove bottom dish rack and inspect spray arms
• Check for clogs in spray arm holes
• Look at wash pump area for visible damage
• Verify all internal hoses are connected

**Most Common Causes:**
• **Door seal damage** (60% of leaks)
• **Improper loading** causing spray deflection
• **Clogged spray arms** creating pressure issues
• **Worn door hinges** preventing proper seal`;
    } else {
      return `**Refrigerator Water Leak Troubleshooting:**

**Step 1: Identify Leak Location (10 minutes)**
• Check inside refrigerator for water pooling
• Look behind/under refrigerator for external leaks
• Examine water dispenser area if equipped
• Check freezer for ice buildup

**Step 2: Drain System Check (15 minutes)**
• Locate defrost drain (usually at back of fridge)
• Check if drain is clogged with debris
• Pour warm water down drain to clear blockages
• Verify drain pan under fridge is not cracked

**Step 3: Water Line Inspection (20 minutes)**
• If has water dispenser/ice maker, check supply lines
• Look for loose connections or cracked tubing
• Verify water filter housing is tight
• Check that water lines are not frozen

**Common Leak Sources:**
• **Clogged defrost drain** (most common)
• **Damaged door seals** letting warm air in
• **Cracked water lines** to ice maker/dispenser
• **Overflowing drain pan** underneath`;
    }
  }

  private getGeneralTroubleshooting(applianceType: string): string {
    return `**General ${applianceType.charAt(0).toUpperCase() + applianceType.slice(1)} Troubleshooting:**

**Step 1: Power & Connections (5 minutes)**
• Verify appliance is plugged in securely
• Check circuit breaker hasn't tripped
• Test outlet with another device
• Look for any loose wire connections

**Step 2: Basic Function Test (10 minutes)**
• Try different settings/cycles to isolate issue
• Listen for unusual noises during operation
• Check all control panel lights and displays
• Verify all doors/drawers close properly

**Step 3: Component Inspection (15 minutes)**
• Look for obvious signs of wear or damage
• Check that all moving parts operate smoothly
• Verify filters are clean (if applicable)
• Ensure proper ventilation around unit

**Step 4: Consult Documentation (10 minutes)**
• Check user manual for model-specific guidance
• Look up error codes if displayed
• Verify you're following correct operating procedures
• Check warranty status for potential coverage

**When to Call a Professional:**
• Electrical issues beyond basic connections
• Refrigerant system problems
• Motor or compressor failures
• Gas line issues (if applicable)`;
  }

  private getSymptomBasedTroubleshooting(symptoms: string, applianceType: string): string {
    return `**${applianceType.charAt(0).toUpperCase() + applianceType.slice(1)} Issue Analysis:**

Based on your description: "${symptoms}"

**Recommended Initial Steps:**
1. **Safety First**: Disconnect power before any inspection
2. **Visual Inspection**: Look for obvious signs of damage or wear
3. **Basic Cleaning**: Often resolves performance issues
4. **Check Connections**: Verify all plugs, hoses, and fittings are secure

**Next Steps:**
• Try basic reset by unplugging for 5 minutes
• Consult your model's user manual for specific guidance
• Contact professional service if issue persists

**Documentation Needed:**
• Model and serial numbers (usually inside door frame)
• Purchase date and warranty information
• Description of when problem first occurred
• Any error codes displayed`;
  }

  private extractSymptomKeywords(symptoms: string): string[] {
    const symptomMap: { [key: string]: string[] } = {
      'ice maker': ['no ice production', 'ice maker not working', 'no ice'],
      'water leak': ['water leak', 'leaking', 'puddle', 'dripping'],
      'not cleaning': ['dishes not clean', 'not cleaning well', 'spots on dishes'],
      'not cooling': ['not cold', 'warm', 'not cooling'],
      'noisy': ['loud noise', 'grinding', 'squealing', 'rattling'],
      'not draining': ['water in bottom', 'not draining', 'standing water']
    };

    const extractedSymptoms: string[] = [];
    const lowerSymptoms = symptoms.toLowerCase();

    for (const [key, values] of Object.entries(symptomMap)) {
      if (values.some(symptom => lowerSymptoms.includes(symptom))) {
        extractedSymptoms.push(key);
      }
    }

    return extractedSymptoms.length > 0 ? extractedSymptoms : [symptoms];
  }
}