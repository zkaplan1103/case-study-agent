import { z } from 'zod';

// Type interfaces for data structures
interface InstallationStep {
  stepNumber: number;
  title: string;
  instruction: string;
  tips?: string[];
}

interface InstallationGuide {
  partNumber: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: number;
  toolsRequired: string[];
  safetyWarnings: string[];
  steps: InstallationStep[];
}

interface TroubleshootingEntry {
  possibleCauses: string[];
  recommendedParts: string[];
  diagnosticSteps: string[];
}

// Tool interface following Toolformer/ALM patterns
export interface PartSelectTool {
  name: string;
  description: string;
  inputSchema: z.ZodSchema;
  execute(input: Record<string, any>): Promise<any>;
}

/**
 * Registry for PartSelect-specific tools following self-supervised learning patterns
 * Inspired by Toolformer research for autonomous tool usage
 */
export class PartSelectToolRegistry {
  private tools = new Map<string, PartSelectTool>();

  constructor() {
    this.initializeDefaultTools();
  }

  registerTool(tool: PartSelectTool): void {
    this.tools.set(tool.name, tool);
  }

  getTool(name: string): PartSelectTool | undefined {
    return this.tools.get(name);
  }

  listTools(): Array<{ name: string; description: string }> {
    return Array.from(this.tools.values()).map(tool => ({
      name: tool.name,
      description: tool.description
    }));
  }

  private initializeDefaultTools(): void {
    // Product Search Tool
    this.registerTool({
      name: 'search_parts',
      description: 'Search for appliance parts by part number, model number, or description',
      inputSchema: z.object({
        query: z.string(),
        category: z.enum(['refrigerator', 'dishwasher', 'all']).optional().default('all'),
        limit: z.number().optional().default(10)
      }),
      execute: async (input) => {
        const { sampleProducts } = await import('../data/sampleProducts');
        
        const searchQuery = input.query.toLowerCase();
        let results = sampleProducts.filter(product => {
          // Category filter
          if (input.category !== 'all' && product.category !== input.category) {
            return false;
          }
          
          // Search in part number, name, description, compatible models, symptoms
          return (
            product.partNumber.toLowerCase().includes(searchQuery) ||
            product.name.toLowerCase().includes(searchQuery) ||
            product.description.toLowerCase().includes(searchQuery) ||
            product.compatibleModels.some(model => model.toLowerCase().includes(searchQuery)) ||
            product.symptoms.some(symptom => symptom.toLowerCase().includes(searchQuery))
          );
        });
        
        // Limit results
        results = results.slice(0, input.limit || 10);
        
        if (results.length === 0) {
          return `No parts found matching "${input.query}" in ${input.category} category. Please try a different search term or check the part number.`;
        }
        
        const formattedResults = results.map(product => 
          `• ${product.partNumber} - ${product.name} ($${product.price}) - ${product.availability === 'in_stock' ? 'In Stock' : product.availability === 'backorder' ? 'Backordered' : 'Out of Stock'}`
        ).join('\n');
        
        return `Found ${results.length} matching parts:\n${formattedResults}`;
      }
    });

    // Compatibility Check Tool
    this.registerTool({
      name: 'check_compatibility',
      description: 'Check if a specific part is compatible with an appliance model',
      inputSchema: z.object({
        partNumber: z.string(),
        modelNumber: z.string(),
        applianceType: z.enum(['refrigerator', 'dishwasher']).optional()
      }),
      execute: async (input) => {
        const { sampleProducts, compatibilityDatabase } = await import('../data/sampleProducts');
        
        const partNumber = input.partNumber.toUpperCase();
        const modelNumber = input.modelNumber.toUpperCase();
        
        // Find the part
        const part = sampleProducts.find(p => p.partNumber.toUpperCase() === partNumber);
        if (!part) {
          return `Part ${input.partNumber} not found in our catalog. Please verify the part number and try again.`;
        }
        
        // Check direct compatibility from part data
        const isDirectlyCompatible = part.compatibleModels.some(model => 
          model.toUpperCase() === modelNumber
        );
        
        if (isDirectlyCompatible) {
          return `✅ YES - Part ${part.partNumber} (${part.name}) IS compatible with model ${input.modelNumber}.\n\nPrice: $${part.price}\nAvailability: ${part.availability === 'in_stock' ? 'In Stock' : part.availability === 'backorder' ? 'Backordered' : 'Out of Stock'}\nInstallation: ${part.installationDifficulty} difficulty, ~${part.installationTime} minutes`;
        }
        
        // Check compatibility database for additional matches
        const modelData = compatibilityDatabase.modelCompatibility.find(m => 
          m.modelNumber.toUpperCase() === modelNumber
        );
        
        if (modelData) {
          const isCompatible = modelData.compatibleParts.includes(part.partNumber);
          if (isCompatible) {
            return `✅ YES - Part ${part.partNumber} (${part.name}) IS compatible with ${modelData.brand} ${modelData.type} model ${input.modelNumber}.\n\nPrice: $${part.price}\nAvailability: ${part.availability === 'in_stock' ? 'In Stock' : part.availability === 'backorder' ? 'Backordered' : 'Out of Stock'}`;
          }
        }
        
        // Not compatible
        const suggestedModels = part.compatibleModels.slice(0, 3).join(', ');
        return `❌ NO - Part ${part.partNumber} (${part.name}) is NOT compatible with model ${input.modelNumber}.\n\nThis part is compatible with: ${suggestedModels}\n\nWould you like me to search for compatible parts for your ${input.modelNumber} model?`;
      }
    });

    // Installation Guide Tool
    this.registerTool({
      name: 'get_installation_guide',
      description: 'Get step-by-step installation instructions for a specific part',
      inputSchema: z.object({
        partNumber: z.string(),
        modelNumber: z.string().optional(),
        difficulty: z.enum(['easy', 'medium', 'hard']).optional()
      }),
      execute: async (input) => {
        const { sampleProducts, installationGuides } = await import('../data/sampleProducts');
        
        const partNumber = input.partNumber.toUpperCase();
        
        // Find the part
        const part = sampleProducts.find(p => p.partNumber.toUpperCase() === partNumber);
        if (!part) {
          return `Part ${input.partNumber} not found in our catalog. Please verify the part number and try again.`;
        }
        
        // Get installation guide
        const guide = installationGuides[part.partNumber as keyof typeof installationGuides];
        if (!guide) {
          // Generic response based on part data
          return `Installation guide for ${part.partNumber} - ${part.name}:\n\nDifficulty: ${part.installationDifficulty}\nEstimated Time: ${part.installationTime} minutes\nTools Required: ${part.toolsRequired.join(', ')}\n\nDetailed step-by-step instructions are not available for this part. Please consult the manufacturer's documentation or contact our support team for assistance.`;
        }
        
        // Format detailed installation guide
        let response = `📋 INSTALLATION GUIDE: ${guide.title}\n\n`;
        response += `⏱️ Estimated Time: ${guide.estimatedTime} minutes\n`;
        response += `🔧 Tools Required: ${guide.toolsRequired.join(', ')}\n`;
        response += `⚠️ Difficulty Level: ${guide.difficulty.toUpperCase()}\n\n`;
        
        if (guide.safetyWarnings.length > 0) {
          response += `🚨 SAFETY WARNINGS:\n`;
          guide.safetyWarnings.forEach((warning: string) => {
            response += `• ${warning}\n`;
          });
          response += '\n';
        }
        
        response += `📝 INSTALLATION STEPS:\n\n`;
        guide.steps.forEach((step: InstallationStep) => {
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
    });

    // Troubleshooting Tool
    this.registerTool({
      name: 'diagnose_issue',
      description: 'Diagnose appliance issues and recommend parts or solutions',
      inputSchema: z.object({
        symptoms: z.string(),
        applianceType: z.enum(['refrigerator', 'dishwasher']),
        modelNumber: z.string().optional(),
        brand: z.string().optional()
      }),
      execute: async (input) => {
        const { sampleProducts, troubleshootingDatabase } = await import('../data/sampleProducts');
        
        const symptoms = input.symptoms.toLowerCase();
        const applianceType = input.applianceType;
        
        // Find matching troubleshooting entries
        const troubleshootingData = troubleshootingDatabase[applianceType as keyof typeof troubleshootingDatabase];
        let matchedIssue: TroubleshootingEntry | null = null;
        let bestMatch = '';
        
        for (const [issue, data] of Object.entries(troubleshootingData)) {
          if (symptoms.includes(issue) || issue.includes(symptoms)) {
            matchedIssue = data;
            bestMatch = issue;
            break;
          }
        }
        
        if (!matchedIssue) {
          // Try partial matching
          for (const [issue, data] of Object.entries(troubleshootingData)) {
            const issueWords = issue.split(' ');
            const symptomsWords = symptoms.split(' ');
            const hasCommonWords = issueWords.some(word => 
              symptomsWords.some((symptom: string) => symptom.includes(word) || word.includes(symptom))
            );
            
            if (hasCommonWords) {
              matchedIssue = data;
              bestMatch = issue;
              break;
            }
          }
        }
        
        if (!matchedIssue) {
          return `I couldn't find a specific match for "${input.symptoms}" in our troubleshooting database. \n\nFor ${applianceType} issues, I recommend:\n1. Check the user manual for basic troubleshooting\n2. Verify power and connections\n3. Contact a qualified technician if the issue persists\n\nWould you like me to search for parts related to your symptoms?`;
        }
        
        let response = `🔧 TROUBLESHOOTING: ${bestMatch.toUpperCase()}\n\n`;
        response += `📊 Possible Causes:\n`;
        matchedIssue.possibleCauses.forEach((cause: string, index: number) => {
          response += `${index + 1}. ${cause}\n`;
        });
        
        response += `\n🔍 Diagnostic Steps:\n`;
        matchedIssue.diagnosticSteps.forEach((step: string, index: number) => {
          response += `${index + 1}. ${step}\n`;
        });
        
        if (matchedIssue.recommendedParts.length > 0) {
          response += `\n🛠️ Recommended Parts:\n`;
          
          matchedIssue.recommendedParts.forEach((partNum: string) => {
            const part = sampleProducts.find(p => p.partNumber === partNum);
            if (part) {
              response += `• ${part.partNumber} - ${part.name} ($${part.price}) - ${part.availability === 'in_stock' ? 'In Stock' : part.availability === 'backorder' ? 'Backordered' : 'Out of Stock'}\n`;
            }
          });
        }
        
        response += `\n💡 If these steps don't resolve the issue, please contact a qualified appliance technician.`;
        
        return response;
      }
    });

    // Order Support Tool
    this.registerTool({
      name: 'get_order_info',
      description: 'Get order status, pricing, and availability information',
      inputSchema: z.object({
        partNumber: z.string(),
        action: z.enum(['price', 'availability', 'order_status']),
        orderId: z.string().optional()
      }),
      execute: async (input) => {
        const { sampleProducts } = await import('../data/sampleProducts');
        
        const partNumber = input.partNumber.toUpperCase();
        const part = sampleProducts.find(p => p.partNumber.toUpperCase() === partNumber);
        
        if (!part) {
          return `Part ${input.partNumber} not found in our catalog. Please verify the part number and try again.`;
        }
        
        switch (input.action) {
          case 'price':
            return `💰 PRICING INFO: ${part.partNumber} - ${part.name}\n\nPrice: $${part.price}\nAvailability: ${part.availability === 'in_stock' ? 'In Stock' : part.availability === 'backorder' ? 'Backordered (2-3 weeks)' : 'Out of Stock'}\n\n✅ Free shipping on orders over $99\n📞 Questions? Call 1-877-387-7463`;
          
          case 'availability':
            const availabilityText = part.availability === 'in_stock' 
              ? '✅ IN STOCK - Ships same day if ordered by 2 PM EST' 
              : part.availability === 'backorder' 
              ? '⏳ BACKORDERED - Expected to ship in 2-3 weeks' 
              : '❌ OUT OF STOCK - Contact us for alternatives';
            
            return `📦 AVAILABILITY: ${part.partNumber} - ${part.name}\n\nStatus: ${availabilityText}\nPrice: $${part.price}\n\n🚚 Standard shipping: 3-5 business days\n⚡ Express shipping: 1-2 business days`;
          
          case 'order_status':
            if (!input.orderId) {
              return `To check order status, I need your order number. You can find it in your confirmation email or by logging into your account at partselect.com`;
            }
            
            // Simulate order status (would connect to real system)
            return `📋 ORDER STATUS: ${input.orderId}\n\nStatus: Order confirmed and processing\nExpected ship date: Next business day\nTracking: Will be provided via email once shipped\n\n📞 Questions about your order? Call 1-877-387-7463`;
          
          default:
            return `Invalid action requested. Available actions: price, availability, order_status`;
        }
      }
    });

    // Warranty/Support Tool
    this.registerTool({
      name: 'get_warranty_info',
      description: 'Get warranty information and support options for parts or appliances',
      inputSchema: z.object({
        partNumber: z.string().optional(),
        modelNumber: z.string().optional(),
        issueType: z.enum(['warranty', 'return', 'support']),
        purchaseDate: z.string().optional()
      }),
      execute: async (input) => {
        const { sampleProducts } = await import('../data/sampleProducts');
        
        if (input.partNumber) {
          const partNumber = input.partNumber.toUpperCase();
          const part = sampleProducts.find(p => p.partNumber.toUpperCase() === partNumber);
          
          if (part) {
            switch (input.issueType) {
              case 'warranty':
                return `🛡️ WARRANTY INFO: ${part.partNumber} - ${part.name}\n\nWarranty: ${part.warranty}\nPurchase Date: ${input.purchaseDate || 'Not provided'}\n\n📋 To claim warranty:\n1. Keep your receipt/order confirmation\n2. Contact us within warranty period\n3. Describe the defect or issue\n\n📞 Warranty claims: 1-877-387-7463\n✉️ Email: warranty@partselect.com`;
              
              case 'return':
                return `↩️ RETURN POLICY: ${part.partNumber} - ${part.name}\n\n✅ 365-day return policy\n✅ No restocking fees\n✅ Free return shipping on defective parts\n\nReturn Process:\n1. Contact us for return authorization\n2. Package item in original condition\n3. Ship with provided return label\n\n📞 Returns: 1-877-387-7463\n💻 Online: partselect.com/returns`;
              
              case 'support':
                return `🆘 SUPPORT OPTIONS: ${part.partNumber} - ${part.name}\n\n📞 Phone Support: 1-877-387-7463\n   Mon-Fri 8AM-8PM, Sat 8AM-5PM EST\n\n💬 Live Chat: Available on partselect.com\n   Mon-Fri 8AM-6PM EST\n\n✉️ Email Support: support@partselect.com\n   Response within 24 hours\n\n🎥 Installation Videos: Available on our website\n📱 Mobile App: Download from app stores`;
            }
          }
        }
        
        // Generic support response
        switch (input.issueType) {
          case 'warranty':
            return `🛡️ GENERAL WARRANTY INFO\n\nMost parts come with manufacturer warranty:\n• Small parts: 90 days - 1 year\n• Major components: 1-2 years\n• Check specific part details for exact terms\n\n📞 Warranty support: 1-877-387-7463`;
          
          case 'return':
            return `↩️ GENERAL RETURN POLICY\n\n✅ 365-day return policy on most items\n✅ No restocking fees\n✅ Return in original condition\n\nNeed to return something?\n📞 Call: 1-877-387-7463\n💻 Online: partselect.com/returns`;
          
          case 'support':
            return `🆘 CUSTOMER SUPPORT\n\n📞 Phone: 1-877-387-7463\n   Mon-Fri 8AM-8PM, Sat 8AM-5PM EST\n\n💬 Live Chat: partselect.com\n   Mon-Fri 8AM-6PM EST\n\n✉️ Email: support@partselect.com\n📱 Mobile app available\n\nHow can we help you today?`;
        }
      }
    });
  }

  // Tool usage analytics for self-supervised learning
  async logToolUsage(toolName: string, _input: Record<string, any>, success: boolean, duration: number): Promise<void> {
    // TODO: Implement tool usage analytics for continuous learning
    console.log(`Tool Usage: ${toolName}, Success: ${success}, Duration: ${duration}ms`);
  }

  // Tool recommendation based on usage patterns
  recommendTools(context: string): string[] {
    // Simple heuristic-based recommendations - can be enhanced with ML
    const recommendations: string[] = [];
    
    const lowerContext = context.toLowerCase();
    
    if (lowerContext.includes('install') || lowerContext.includes('how to')) {
      recommendations.push('get_installation_guide');
    }
    
    if (lowerContext.includes('compatible') || lowerContext.includes('fit') || lowerContext.includes('work with')) {
      recommendations.push('check_compatibility');
    }
    
    if (lowerContext.includes('not working') || lowerContext.includes('broken') || lowerContext.includes('problem')) {
      recommendations.push('diagnose_issue');
    }
    
    if (lowerContext.includes('part number') || lowerContext.includes('find') || lowerContext.includes('search')) {
      recommendations.push('search_parts');
    }
    
    if (lowerContext.includes('price') || lowerContext.includes('order') || lowerContext.includes('buy')) {
      recommendations.push('get_order_info');
    }
    
    if (lowerContext.includes('warranty') || lowerContext.includes('return') || lowerContext.includes('refund')) {
      recommendations.push('get_warranty_info');
    }
    
    return recommendations;
  }
}