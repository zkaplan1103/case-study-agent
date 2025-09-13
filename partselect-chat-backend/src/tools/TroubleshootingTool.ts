import { z } from 'zod';
import { sampleProducts, troubleshootingDatabase } from '../data/sampleProducts';

// Troubleshooting input schema
export const TroubleshootingInputSchema = z.object({
  symptoms: z.string().min(1, "Symptoms description is required"),
  applianceType: z.enum(['refrigerator', 'dishwasher']),
  modelNumber: z.string().optional(),
  brand: z.string().optional(),
  additionalInfo: z.object({
    age: z.number().optional(),
    lastServiceDate: z.string().optional(),
    recentChanges: z.string().optional()
  }).optional()
});

export type TroubleshootingInput = z.infer<typeof TroubleshootingInputSchema>;

export interface DiagnosticStep {
  stepNumber: number;
  title: string;
  instruction: string;
  expectedResult: string;
  ifFailed: string;
  safetyNotes: string[];
  toolsNeeded: string[];
}

export interface TroubleshootingResult {
  issueTitle: string;
  confidence: number;
  possibleCauses: string[];
  diagnosticSteps: DiagnosticStep[];
  recommendedParts: {
    partNumber: string;
    partName: string;
    price: number;
    availability: string;
    likelihood: number;
  }[];
  preventiveMaintenance: string[];
  whenToCallTechnician: string[];
  estimatedRepairCost: {
    diy: { min: number; max: number };
    professional: { min: number; max: number };
  };
}

/**
 * Troubleshooting Tool - Diagnostic question generation and decision trees
 * Handles appliance issue diagnosis with part recommendations
 */
export class TroubleshootingTool {
  private name = 'diagnose_issue';
  private description = 'Diagnose appliance issues through systematic troubleshooting with part recommendations and repair guidance';

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
   * Execute diagnostic analysis with decision tree navigation
   */
  async execute(input: TroubleshootingInput): Promise<string> {
    const validatedInput = TroubleshootingInputSchema.parse(input);
    const { symptoms, applianceType, modelNumber, brand, additionalInfo } = validatedInput;

    console.log(`TroubleshootingTool: Diagnosing ${applianceType} issue: "${symptoms}"`);

    // Find matching troubleshooting entries
    const troubleshootingData = troubleshootingDatabase[applianceType as keyof typeof troubleshootingDatabase];
    const matchResult = this.findBestMatch(symptoms, troubleshootingData);

    if (!matchResult.found) {
      return this.generateGenericTroubleshootingAdvice(symptoms, applianceType, modelNumber);
    }

    // Generate comprehensive diagnostic response
    const result = this.generateDetailedDiagnosis(
      matchResult.issue,
      matchResult.data,
      symptoms,
      applianceType,
      modelNumber,
      brand
    );

    return this.formatDiagnosticResult(result);
  }

  /**
   * Find the best matching issue using symptom analysis
   */
  private findBestMatch(symptoms: string, troubleshootingData: any): {
    found: boolean;
    issue: string;
    data: any;
    confidence: number;
  } {
    const normalizedSymptoms = symptoms.toLowerCase();
    let bestMatch = { found: false, issue: '', data: null, confidence: 0 };

    for (const [issue, data] of Object.entries(troubleshootingData)) {
      const confidence = this.calculateSymptomMatch(normalizedSymptoms, issue);
      
      if (confidence > bestMatch.confidence) {
        bestMatch = {
          found: confidence > 0.3,
          issue,
          data: data as any,
          confidence
        };
      }
    }

    return bestMatch;
  }

  /**
   * Calculate confidence score for symptom matching
   */
  private calculateSymptomMatch(symptoms: string, issue: string): number {
    const issueWords = issue.toLowerCase().split(' ');
    const symptomWords = symptoms.split(' ');
    
    let matches = 0;
    let totalWords = issueWords.length;

    issueWords.forEach(issueWord => {
      if (symptomWords.some(symptomWord => 
          symptomWord.includes(issueWord) || 
          issueWord.includes(symptomWord) ||
          this.areSynonyms(issueWord, symptomWord)
      )) {
        matches++;
      }
    });

    // Check for exact phrase matches
    if (symptoms.includes(issue.toLowerCase())) {
      matches += 2;
      totalWords += 2;
    }

    return matches / totalWords;
  }

  /**
   * Check if two words are synonyms in appliance context
   */
  private areSynonyms(word1: string, word2: string): boolean {
    const synonymGroups = [
      ['broken', 'not working', 'failed', 'dead'],
      ['leaking', 'leak', 'dripping', 'water'],
      ['noise', 'noisy', 'loud', 'sound'],
      ['cold', 'cool', 'temperature', 'temp'],
      ['ice', 'freeze', 'frozen', 'freezing']
    ];

    return synonymGroups.some(group => 
      group.includes(word1) && group.includes(word2)
    );
  }

  /**
   * Generate detailed diagnosis with decision tree navigation
   */
  private generateDetailedDiagnosis(
    issue: string,
    data: any,
    symptoms: string,
    applianceType: string,
    modelNumber?: string,
    brand?: string
  ): TroubleshootingResult {
    // Create detailed diagnostic steps
    const diagnosticSteps: DiagnosticStep[] = data.diagnosticSteps.map((step: string, index: number) => ({
      stepNumber: index + 1,
      title: `Check: ${step.split('.')[0] || step.substring(0, 30)}`,
      instruction: step,
      expectedResult: this.getExpectedResult(step, issue),
      ifFailed: this.getFailureAction(step, issue),
      safetyNotes: this.getSafetyNotes(step, applianceType),
      toolsNeeded: this.getRequiredTools(step)
    }));

    // Get recommended parts with likelihood scoring
    const recommendedParts = data.recommendedParts.map((partNum: string) => {
      const part = sampleProducts.find(p => p.partNumber === partNum);
      if (!part) return null;
      return {
        partNumber: part.partNumber,
        partName: part.name,
        price: part.price,
        availability: part.availability,
        likelihood: this.calculatePartLikelihood(part, symptoms, issue)
      };
    }).filter((part: any): part is NonNullable<typeof part> => part !== null);

    return {
      issueTitle: issue.toUpperCase(),
      confidence: 0.85, // Base confidence, can be adjusted based on matching quality
      possibleCauses: data.possibleCauses,
      diagnosticSteps,
      recommendedParts,
      preventiveMaintenance: this.getPreventiveMaintenance(applianceType, issue),
      whenToCallTechnician: this.getTechnicianCriteria(issue, applianceType),
      estimatedRepairCost: this.estimateRepairCost(recommendedParts, applianceType)
    };
  }

  /**
   * Calculate likelihood that a part is the root cause
   */
  private calculatePartLikelihood(part: any, symptoms: string, issue: string): number {
    let likelihood = 0.5; // Base likelihood

    // Check if symptoms match part-specific issues
    if (part.symptoms) {
      const symptomMatches = part.symptoms.filter((symptom: string) =>
        symptoms.toLowerCase().includes(symptom.toLowerCase())
      ).length;
      likelihood += (symptomMatches / part.symptoms.length) * 0.3;
    }

    // Adjust based on part category and issue type
    if (issue.includes('ice') && part.name.toLowerCase().includes('ice')) {
      likelihood += 0.2;
    }
    if (issue.includes('water') && part.name.toLowerCase().includes('water')) {
      likelihood += 0.2;
    }
    if (issue.includes('pump') && part.name.toLowerCase().includes('pump')) {
      likelihood += 0.2;
    }

    return Math.min(likelihood, 0.95);
  }

  /**
   * Get expected result for a diagnostic step
   */
  private getExpectedResult(step: string, issue: string): string {
    if (step.includes('temperature')) {
      return 'Temperature should be within normal range (refrigerator: 37-40°F, freezer: 0-5°F)';
    }
    if (step.includes('power') || step.includes('turned on')) {
      return 'Appliance should power on and display normal indicators';
    }
    if (step.includes('water')) {
      return 'Water flow should be steady and unobstructed';
    }
    if (step.includes('filter')) {
      return 'Filter should be clean and properly seated';
    }
    return 'Component should function normally without unusual sounds or behavior';
  }

  /**
   * Get action to take if diagnostic step fails
   */
  private getFailureAction(step: string, issue: string): string {
    if (step.includes('temperature')) {
      return 'Adjust temperature settings or check for blocked vents';
    }
    if (step.includes('power')) {
      return 'Check power cord, outlet, and circuit breaker';
    }
    if (step.includes('water')) {
      return 'Check water supply connections and pressure';
    }
    if (step.includes('filter')) {
      return 'Replace or clean filter as needed';
    }
    return 'Proceed to next diagnostic step or consider part replacement';
  }

  /**
   * Get safety notes for diagnostic step
   */
  private getSafetyNotes(step: string, applianceType: string): string[] {
    const notes = ['Always disconnect power before performing repairs'];
    
    if (step.includes('water')) {
      notes.push('Turn off water supply before disconnecting lines');
    }
    if (step.includes('electrical') || step.includes('wiring')) {
      notes.push('Use proper electrical safety procedures');
    }
    if (applianceType === 'dishwasher' && step.includes('pump')) {
      notes.push('Be careful of sharp edges and hot surfaces');
    }
    
    return notes;
  }

  /**
   * Get required tools for diagnostic step
   */
  private getRequiredTools(step: string): string[] {
    const tools = [];
    
    if (step.includes('screw') || step.includes('panel')) {
      tools.push('Screwdriver');
    }
    if (step.includes('temperature')) {
      tools.push('Thermometer');
    }
    if (step.includes('electrical') || step.includes('voltage')) {
      tools.push('Multimeter');
    }
    if (step.includes('water') || step.includes('hose')) {
      tools.push('Adjustable wrench');
    }
    
    return tools.length > 0 ? tools : ['Basic hand tools'];
  }

  /**
   * Get preventive maintenance recommendations
   */
  private getPreventiveMaintenance(applianceType: string, issue: string): string[] {
    const maintenance = [];
    
    if (applianceType === 'refrigerator') {
      maintenance.push('Clean condenser coils every 6 months');
      maintenance.push('Replace water filter every 6 months');
      if (issue.includes('ice')) {
        maintenance.push('Clean ice maker monthly');
      }
    }
    
    if (applianceType === 'dishwasher') {
      maintenance.push('Clean filter monthly');
      maintenance.push('Run cleaning cycle with dishwasher cleaner monthly');
      if (issue.includes('pump')) {
        maintenance.push('Check for food debris in pump area');
      }
    }
    
    return maintenance;
  }

  /**
   * Get criteria for when to call a technician
   */
  private getTechnicianCriteria(issue: string, applianceType: string): string[] {
    const criteria = [
      'If safety concerns arise during diagnosis',
      'If multiple parts need replacement simultaneously',
      'If electrical work is required beyond basic connections'
    ];
    
    if (issue.includes('pump') || issue.includes('compressor')) {
      criteria.push('For major component replacement like pumps or compressors');
    }
    
    if (applianceType === 'refrigerator' && issue.includes('cooling')) {
      criteria.push('For refrigerant system issues');
    }
    
    return criteria;
  }

  /**
   * Estimate repair costs for DIY vs professional service
   */
  private estimateRepairCost(parts: any[], applianceType: string): {
    diy: { min: number; max: number };
    professional: { min: number; max: number };
  } {
    const partsCost = parts.reduce((total, part) => total + (part?.price || 0), 0);
    const laborMultiplier = applianceType === 'refrigerator' ? 1.5 : 1.2;
    
    return {
      diy: {
        min: partsCost,
        max: partsCost + 50 // tools/supplies
      },
      professional: {
        min: partsCost + (75 * laborMultiplier),
        max: partsCost + (150 * laborMultiplier)
      }
    };
  }

  /**
   * Format diagnostic result for chat display
   */
  private formatDiagnosticResult(result: TroubleshootingResult): string {
    let response = `🔧 TROUBLESHOOTING: ${result.issueTitle}\n\n`;
    
    response += `📊 Possible Causes:\n`;
    result.possibleCauses.forEach((cause, index) => {
      response += `${index + 1}. ${cause}\n`;
    });
    
    response += `\n🔍 Diagnostic Steps:\n`;
    result.diagnosticSteps.forEach((step) => {
      response += `${step.stepNumber}. ${step.instruction}\n`;
    });
    
    if (result.recommendedParts.length > 0) {
      response += `\n🛠️ Recommended Parts:\n`;
      result.recommendedParts.forEach(part => {
        const likelihood = Math.round(part.likelihood * 100);
        const status = part.availability === 'in_stock' ? 'In Stock' : 
                      part.availability === 'backorder' ? 'Backordered' : 'Out of Stock';
        response += `• ${part.partNumber} - ${part.partName} ($${part.price}) - ${status} (${likelihood}% likely)\n`;
      });
    }
    
    response += `\n💡 If these steps don't resolve the issue, please contact a qualified appliance technician.`;
    
    return response;
  }

  /**
   * Generate generic troubleshooting advice when no specific match found
   */
  private generateGenericTroubleshootingAdvice(
    symptoms: string,
    applianceType: string,
    modelNumber?: string
  ): string {
    let response = `🔧 GENERAL TROUBLESHOOTING: ${applianceType.toUpperCase()} ISSUE\n\n`;
    response += `Symptoms: "${symptoms}"\n\n`;
    
    response += `📋 Basic Troubleshooting Steps:\n`;
    response += `1. Check power connection and circuit breaker\n`;
    response += `2. Verify appliance settings are correct\n`;
    response += `3. Look for error codes or indicator lights\n`;
    response += `4. Check for obvious obstructions or damage\n`;
    response += `5. Consult owner's manual for specific guidance\n\n`;
    
    response += `📞 For specific diagnosis of "${symptoms}", please:\n`;
    response += `• Contact PartSelect support at 1-877-387-7463\n`;
    response += `• Provide your model number${modelNumber ? ` (${modelNumber})` : ''}\n`;
    response += `• Describe symptoms in detail\n\n`;
    
    response += `🛠️ Our technicians can provide targeted troubleshooting steps for your specific issue.`;
    
    return response;
  }

  /**
   * Get troubleshooting history and patterns
   */
  async getTroubleshootingHistory(modelNumber?: string): Promise<{
    commonIssues: string[];
    seasonalPatterns: string[];
    preventiveTips: string[];
  }> {
    // In a real implementation, this would query historical data
    return {
      commonIssues: [
        'Ice maker not working',
        'Temperature issues',
        'Water leaking',
        'Unusual noises'
      ],
      seasonalPatterns: [
        'Summer: Increased cooling load issues',
        'Winter: Water line freezing',
        'Spring: Filter replacement reminders',
        'Fall: Cleaning maintenance'
      ],
      preventiveTips: [
        'Regular filter replacement',
        'Monthly cleaning cycles',
        'Annual professional inspection',
        'Proper loading and usage'
      ]
    };
  }
}