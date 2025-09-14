import { Product, TroubleshootingSymptom } from '../types';

// Sample product data covering test cases and common scenarios
export const sampleProducts: Product[] = [
  // Test Case 1: PS11752778 - Installation query
  {
    id: "1",
    partNumber: "PS11752778",
    name: "Refrigerator Water Filter",
    description: "Genuine replacement water filter for various refrigerator models. Reduces chlorine, sediment, and other impurities for clean, fresh-tasting water and ice.",
    category: "refrigerator",
    brand: "Whirlpool",
    compatibleModels: ["WRF989SDAM", "WRF757SDEM", "WRF540CWHZ", "WRF535SWHZ"],
    price: 45.99,
    availability: "in-stock",
    imageUrl: "https://images.partselect.com/PS11752778_01_a.jpg",
    installationDifficulty: "easy",
    estimatedInstallTime: 10,
    requiredTools: ["None - tool-free installation"],
    safetyWarnings: [
      "Turn off water supply before installation",
      "Flush filter for 3-5 minutes before use",
      "Replace every 6 months for optimal performance"
    ],
    installationSteps: [
      {
        step: 1,
        title: "Locate the water filter",
        description: "Open the refrigerator door and locate the water filter compartment, typically in the upper right corner of the fresh food section."
      },
      {
        step: 2,
        title: "Remove the old filter",
        description: "Turn the old filter counterclockwise (left) until it releases. Pull the filter straight out.",
        warning: "Some water may spill during removal - have a towel ready."
      },
      {
        step: 3,
        title: "Prepare the new filter",
        description: "Remove all packaging from the new filter. Remove any protective caps or seals."
      },
      {
        step: 4,
        title: "Install the new filter",
        description: "Insert the new filter and turn clockwise (right) until it locks in place. You should feel it click into position."
      },
      {
        step: 5,
        title: "Reset the filter indicator",
        description: "Press and hold the water filter reset button for 3 seconds until the indicator light turns green or stops blinking."
      },
      {
        step: 6,
        title: "Flush the system",
        description: "Run water through the dispenser for 3-5 minutes to flush out any air and activate the filter.",
        warning: "Initial water may appear cloudy - this is normal and will clear after flushing."
      }
    ]
  },

  // Test Case 2: Compatible part for WDT780SAEM1 model (dishwasher)
  {
    id: "2",
    partNumber: "WPW10348269",
    name: "Dishwasher Wash Pump Motor",
    description: "Replacement wash pump motor assembly for Whirlpool and KitchenAid dishwashers. Essential component that circulates water during wash cycles.",
    category: "dishwasher",
    brand: "Whirlpool",
    compatibleModels: ["WDT780SAEM1", "WDT780PAEM1", "WDT750SAHZ0", "KDTM404ESS0"],
    price: 189.99,
    availability: "in-stock",
    installationDifficulty: "hard",
    estimatedInstallTime: 90,
    requiredTools: [
      "Phillips head screwdriver",
      "Flathead screwdriver", 
      "Socket wrench set",
      "Pliers",
      "Towels"
    ],
    safetyWarnings: [
      "Disconnect power and water supply before beginning",
      "Drain all water from dishwasher",
      "Wear safety glasses when working with springs",
      "This repair requires removing the dishwasher from cabinet"
    ],
    installationSteps: [
      {
        step: 1,
        title: "Disconnect utilities",
        description: "Turn off power at circuit breaker and shut off water supply valve under sink."
      },
      {
        step: 2,
        title: "Remove dishwasher",
        description: "Remove screws securing dishwasher to countertop and carefully slide unit out of cabinet opening."
      },
      {
        step: 3,
        title: "Access pump motor",
        description: "Turn dishwasher on its back and remove the bottom access panel to expose the pump motor assembly."
      },
      {
        step: 4,
        title: "Disconnect electrical connections",
        description: "Carefully disconnect wire harnesses connected to the pump motor, noting their positions."
      },
      {
        step: 5,
        title: "Remove old pump motor",
        description: "Remove mounting bolts and carefully lift out the old pump motor assembly."
      },
      {
        step: 6,
        title: "Install new pump motor",
        description: "Position new pump motor and secure with mounting bolts. Reconnect all electrical connections."
      },
      {
        step: 7,
        title: "Reassemble and test",
        description: "Reinstall access panel, slide dishwasher back into place, reconnect utilities, and run a test cycle."
      }
    ]
  },

  // Ice maker parts for Test Case 3 (Whirlpool refrigerator troubleshooting)
  {
    id: "3",
    partNumber: "W10873791",
    name: "Ice Maker Assembly",
    description: "Complete ice maker assembly for Whirlpool refrigerators. Includes ice maker module, wire harness, and mounting hardware.",
    category: "refrigerator",
    brand: "Whirlpool",
    compatibleModels: ["WRF989SDAM", "WRF767SDHZ", "WRF555SDFZ", "WRS325SDHZ"],
    price: 234.99,
    availability: "in-stock",
    installationDifficulty: "medium",
    estimatedInstallTime: 45,
    requiredTools: [
      "Phillips head screwdriver",
      "Flathead screwdriver",
      "1/4 inch nut driver"
    ],
    safetyWarnings: [
      "Unplug refrigerator before starting repair",
      "Turn off water supply to ice maker",
      "Allow ice maker to reach room temperature before handling"
    ]
  },

  {
    id: "4",
    partNumber: "W10190965",
    name: "Ice Maker Water Inlet Valve",
    description: "Water inlet valve that controls water flow to the ice maker. Common replacement part when ice maker stops producing ice.",
    category: "refrigerator",
    brand: "Whirlpool",
    compatibleModels: ["WRF989SDAM", "WRF767SDHZ", "WRF555SDFZ", "WRS325SDHZ"],
    price: 67.99,
    availability: "in-stock",
    installationDifficulty: "medium",
    estimatedInstallTime: 30,
    requiredTools: [
      "Adjustable wrench",
      "Phillips head screwdriver",
      "Towels"
    ],
    safetyWarnings: [
      "Turn off water supply before removal",
      "Unplug refrigerator",
      "Have towels ready for water spillage"
    ]
  },

  // Additional refrigerator parts
  {
    id: "5",
    partNumber: "W10312695",
    name: "Refrigerator Door Seal",
    description: "Door gasket seal for refrigerator fresh food compartment. Maintains proper temperature and humidity levels.",
    category: "refrigerator",
    brand: "Whirlpool",
    compatibleModels: ["WRF989SDAM", "WRF767SDHZ", "WRF540CWHZ"],
    price: 89.99,
    availability: "in-stock",
    installationDifficulty: "medium",
    estimatedInstallTime: 60,
    requiredTools: [
      "Phillips head screwdriver",
      "Hair dryer"
    ],
    safetyWarnings: [
      "Clean door surface before installation",
      "Use hair dryer to soften gasket for easier installation"
    ]
  },

  {
    id: "6",
    partNumber: "W10190929",
    name: "Evaporator Fan Motor",
    description: "Refrigerator evaporator fan motor that circulates cold air throughout the fresh food and freezer compartments.",
    category: "refrigerator",
    brand: "Whirlpool",
    compatibleModels: ["WRF989SDAM", "WRF767SDHZ", "WRF555SDFZ"],
    price: 156.99,
    availability: "in-stock",
    installationDifficulty: "hard",
    estimatedInstallTime: 75,
    requiredTools: [
      "Phillips head screwdriver",
      "Socket wrench set",
      "Wire nuts"
    ],
    safetyWarnings: [
      "Unplug refrigerator",
      "Remove all food from freezer",
      "Allow defrost cycle to complete"
    ]
  },

  // Additional dishwasher parts
  {
    id: "7",
    partNumber: "WPW10082861",
    name: "Dishwasher Drain Pump",
    description: "Drain pump assembly that removes wastewater from the dishwasher during drain cycles.",
    category: "dishwasher",
    brand: "Whirlpool",
    compatibleModels: ["WDT780SAEM1", "WDT780PAEM1", "WDT750SAHZ0"],
    price: 142.99,
    availability: "in-stock",
    installationDifficulty: "hard",
    estimatedInstallTime: 60,
    requiredTools: [
      "Phillips head screwdriver",
      "Pliers",
      "Socket wrench"
    ],
    safetyWarnings: [
      "Disconnect power and water",
      "Remove dishwasher from cabinet for access",
      "Drain all water before starting"
    ]
  },

  {
    id: "8",
    partNumber: "W10300924",
    name: "Dishwasher Door Latch",
    description: "Door latch assembly that secures the dishwasher door and activates the door switch to allow operation.",
    category: "dishwasher",
    brand: "Whirlpool",
    compatibleModels: ["WDT780SAEM1", "WDT780PAEM1", "WDT750SAHZ0", "KDTM404ESS0"],
    price: 78.99,
    availability: "in-stock",
    installationDifficulty: "medium",
    estimatedInstallTime: 30,
    requiredTools: [
      "Phillips head screwdriver",
      "Torx screwdriver set"
    ],
    safetyWarnings: [
      "Disconnect power before starting",
      "Test door operation after installation"
    ]
  },

  // GE/Frigidaire parts for variety
  {
    id: "9",
    partNumber: "WR49X10283",
    name: "GE Refrigerator Water Filter",
    description: "Genuine GE refrigerator water filter that reduces chlorine taste and odor, sediment, and other contaminants.",
    category: "refrigerator",
    brand: "GE",
    compatibleModels: ["GFE28HMKES", "GFE26JSMSS", "PFE28PBLTS"],
    price: 52.99,
    availability: "in-stock",
    installationDifficulty: "easy",
    estimatedInstallTime: 5,
    requiredTools: ["None"],
    safetyWarnings: [
      "Replace every 6 months",
      "Flush new filter before use"
    ]
  },

  {
    id: "10",
    partNumber: "5304505524",
    name: "Frigidaire Dishwasher Heating Element",
    description: "Heating element for Frigidaire dishwashers. Heats water during wash and dry cycles.",
    category: "dishwasher",
    brand: "Frigidaire",
    compatibleModels: ["FGID2466QF0A", "FGIP2468UF0A", "FFID2426TS0A"],
    price: 67.99,
    availability: "backordered",
    installationDifficulty: "medium",
    estimatedInstallTime: 45,
    requiredTools: [
      "Phillips head screwdriver",
      "Multimeter",
      "Wire nuts"
    ],
    safetyWarnings: [
      "Disconnect power before installation",
      "Test element with multimeter before installation",
      "Ensure proper electrical connections"
    ]
  }
];

// Troubleshooting symptoms for common issues
export const troubleshootingSymptoms: TroubleshootingSymptom[] = [
  {
    id: "ice-maker-not-working",
    description: "Ice maker not producing ice",
    category: "refrigerator",
    commonCauses: [
      "Water supply issue",
      "Faulty ice maker assembly",
      "Clogged water inlet valve",
      "Temperature too warm",
      "Electrical connection problem"
    ],
    diagnosticSteps: [
      {
        step: 1,
        description: "Check if the ice maker is turned on and the wire arm is down",
        expectedResult: "Ice maker should be in ON position",
        nextStepIfTrue: 2,
        nextStepIfFalse: undefined,
        recommendedAction: "Turn on ice maker and lower wire arm"
      },
      {
        step: 2,
        description: "Verify water supply - check if water dispenser works",
        expectedResult: "Water should flow from dispenser",
        nextStepIfTrue: 3,
        nextStepIfFalse: 4,
        recommendedAction: undefined
      },
      {
        step: 3,
        description: "Listen for ice maker cycling sounds (motor running, water filling)",
        expectedResult: "Should hear cycling sounds every few hours",
        nextStepIfTrue: undefined,
        nextStepIfFalse: 5,
        recommendedAction: "If no sounds, ice maker assembly may need replacement"
      },
      {
        step: 4,
        description: "Check water filter and water line connections",
        expectedResult: "Filter should be properly installed, lines connected",
        nextStepIfTrue: 2,
        nextStepIfFalse: undefined,
        recommendedAction: "Replace filter or check water line connections"
      },
      {
        step: 5,
        description: "Check freezer temperature (should be 0-5°F)",
        expectedResult: "Temperature should be within range",
        nextStepIfTrue: undefined,
        nextStepIfFalse: undefined,
        recommendedAction: "Adjust temperature or check for cooling system issues"
      }
    ],
    recommendedParts: ["W10873791", "W10190965", "PS11752778"]
  },

  {
    id: "dishwasher-not-draining",
    description: "Dishwasher not draining properly",
    category: "dishwasher",
    commonCauses: [
      "Clogged drain pump",
      "Blocked garbage disposal",
      "Kinked drain hose",
      "Faulty drain pump motor"
    ],
    diagnosticSteps: [
      {
        step: 1,
        description: "Check if garbage disposal is clear (if connected)",
        expectedResult: "Disposal should run freely without clogs",
        nextStepIfTrue: 2,
        nextStepIfFalse: undefined,
        recommendedAction: "Clear garbage disposal and run it"
      },
      {
        step: 2,
        description: "Inspect dishwasher filter at bottom of tub",
        expectedResult: "Filter should be clean and properly installed",
        nextStepIfTrue: 3,
        nextStepIfFalse: undefined,
        recommendedAction: "Clean or replace dishwasher filter"
      },
      {
        step: 3,
        description: "Listen for drain pump operation during drain cycle",
        expectedResult: "Should hear pump motor running",
        nextStepIfTrue: 4,
        nextStepIfFalse: 5,
        recommendedAction: undefined
      },
      {
        step: 4,
        description: "Check drain hose under sink for kinks or clogs",
        expectedResult: "Hose should be straight and unobstructed",
        nextStepIfTrue: undefined,
        nextStepIfFalse: undefined,
        recommendedAction: "Straighten hose or clear blockage"
      },
      {
        step: 5,
        description: "Drain pump may be faulty",
        expectedResult: "Pump motor should run when activated",
        nextStepIfTrue: undefined,
        nextStepIfFalse: undefined,
        recommendedAction: "Replace drain pump assembly"
      }
    ],
    recommendedParts: ["WPW10082861"]
  },

  {
    id: "refrigerator-too-warm",
    description: "Refrigerator not cooling properly",
    category: "refrigerator",
    commonCauses: [
      "Dirty condenser coils",
      "Faulty evaporator fan",
      "Bad door seals",
      "Temperature control issues",
      "Blocked air vents"
    ],
    diagnosticSteps: [
      {
        step: 1,
        description: "Check temperature settings (should be 35-38°F for fresh food)",
        expectedResult: "Temperature should be set correctly",
        nextStepIfTrue: 2,
        nextStepIfFalse: undefined,
        recommendedAction: "Adjust temperature settings"
      },
      {
        step: 2,
        description: "Check door seals for gaps or damage",
        expectedResult: "Doors should seal tightly with no gaps",
        nextStepIfTrue: 3,
        nextStepIfFalse: undefined,
        recommendedAction: "Replace door gasket seals"
      },
      {
        step: 3,
        description: "Listen for evaporator fan running in freezer",
        expectedResult: "Fan should run when compressor is running",
        nextStepIfTrue: 4,
        nextStepIfFalse: 5,
        recommendedAction: undefined
      },
      {
        step: 4,
        description: "Clean condenser coils (usually on back or bottom)",
        expectedResult: "Coils should be free of dust and debris",
        nextStepIfTrue: undefined,
        nextStepIfFalse: undefined,
        recommendedAction: "Clean coils with coil brush and vacuum"
      },
      {
        step: 5,
        description: "Evaporator fan motor may need replacement",
        expectedResult: "Fan should run smoothly without noise",
        nextStepIfTrue: undefined,
        nextStepIfFalse: undefined,
        recommendedAction: "Replace evaporator fan motor"
      }
    ],
    recommendedParts: ["W10312695", "W10190929"]
  }
];