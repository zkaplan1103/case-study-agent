// Sample PartSelect product data for testing and development
export const sampleProducts = [
  {
    id: "ps11752778",
    partNumber: "PS11752778",
    name: "Ice Maker Assembly",
    description: "Complete ice maker assembly for refrigerators. Includes ice maker unit, mounting hardware, and installation instructions.",
    category: "refrigerator" as const,
    brand: "Whirlpool",
    price: 189.99,
    imageUrl: "/parts/ps11752778.jpg",
    availability: "in_stock" as const,
    compatibleModels: ["WDT780SAEM1", "WRF535SWHZ", "WRS325SDHZ", "GI15NDXZS"],
    symptoms: ["no ice production", "ice maker not working", "no ice"],
    toolsRequired: ["Phillips screwdriver", "Flat-head screwdriver", "Needle-nose pliers"],
    installationDifficulty: "medium" as const,
    installationTime: 45, // minutes
    warranty: "1 year manufacturer warranty"
  },
  {
    id: "wpw10348269",
    partNumber: "WPW10348269",
    name: "Dishwasher Door Seal",
    description: "Replacement door seal gasket for dishwashers. Prevents water leaks around the door.",
    category: "dishwasher" as const,
    brand: "Whirlpool",
    price: 34.99,
    imageUrl: "/parts/wpw10348269.jpg",
    availability: "in_stock" as const,
    compatibleModels: ["WDT780SAEM1", "WDTA50SAHZ", "WDF520PADM"],
    symptoms: ["water leak", "door seal damaged", "dishwasher leaking"],
    toolsRequired: ["Phillips screwdriver", "Putty knife"],
    installationDifficulty: "easy" as const,
    installationTime: 30,
    warranty: "1 year manufacturer warranty"
  },
  {
    id: "w10295370a",
    partNumber: "W10295370A",
    name: "Refrigerator Water Filter",
    description: "NSF certified water filter for refrigerator water and ice dispensers. Reduces chlorine taste and odor.",
    category: "refrigerator" as const,
    brand: "Whirlpool",
    price: 49.99,
    imageUrl: "/parts/w10295370a.jpg",
    availability: "in_stock" as const,
    compatibleModels: ["WRF535SWHZ", "WRS325SDHZ", "WRF757SDEM", "GI15NDXZS"],
    symptoms: ["bad water taste", "slow ice production", "filter light on"],
    toolsRequired: ["No tools required"],
    installationDifficulty: "easy" as const,
    installationTime: 5,
    warranty: "6 months manufacturer warranty"
  },
  {
    id: "wpw10441006",
    partNumber: "WPW10441006",
    name: "Dishwasher Wash Pump Motor",
    description: "Replacement wash pump motor assembly for dishwashers. Powers the main wash and rinse cycles.",
    category: "dishwasher" as const,
    brand: "Whirlpool",
    price: 156.99,
    imageUrl: "/parts/wpw10441006.jpg",
    availability: "backorder" as const,
    compatibleModels: ["WDT780SAEM1", "WDTA50SAHZ", "WDF520PADM", "WDT730PAHZ"],
    symptoms: ["dishwasher not cleaning", "no wash action", "pump noise"],
    toolsRequired: ["Phillips screwdriver", "Torx screwdriver", "Multimeter"],
    installationDifficulty: "hard" as const,
    installationTime: 90,
    warranty: "1 year manufacturer warranty"
  },
  {
    id: "w11244269",
    partNumber: "W11244269",
    name: "Ice Maker Water Fill Cup",
    description: "Replacement water fill cup for ice makers. Directs water into ice cube molds.",
    category: "refrigerator" as const,
    brand: "Whirlpool",
    price: 12.99,
    imageUrl: "/parts/w11244269.jpg",
    availability: "in_stock" as const,
    compatibleModels: ["WRF535SWHZ", "WRS325SDHZ", "GI15NDXZS"],
    symptoms: ["ice cubes malformed", "incomplete ice cubes", "water overflow"],
    toolsRequired: ["Phillips screwdriver"],
    installationDifficulty: "easy" as const,
    installationTime: 15,
    warranty: "90 days manufacturer warranty"
  }
];

// Installation guides for sample parts
export const installationGuides = {
  "PS11752778": {
    partNumber: "PS11752778",
    title: "Ice Maker Assembly Installation",
    difficulty: "medium" as const,
    estimatedTime: 45,
    toolsRequired: ["Phillips screwdriver", "Flat-head screwdriver", "Needle-nose pliers"],
    safetyWarnings: [
      "Disconnect power to refrigerator before beginning installation",
      "Turn off water supply to ice maker",
      "Allow refrigerator to warm up if frost is present"
    ],
    steps: [
      {
        stepNumber: 1,
        title: "Preparation",
        instruction: "Unplug the refrigerator and locate the ice maker in the freezer compartment.",
        tips: ["Take photos of existing connections before removal"]
      },
      {
        stepNumber: 2,
        title: "Remove Old Ice Maker",
        instruction: "Disconnect the wire harness and water line, then remove the mounting screws.",
        tips: ["Keep track of small parts", "Use needle-nose pliers for tight connections"]
      },
      {
        stepNumber: 3,
        title: "Install New Ice Maker",
        instruction: "Position the new ice maker and secure with mounting screws.",
        tips: ["Ensure proper alignment before tightening screws"]
      },
      {
        stepNumber: 4,
        title: "Connect Water and Power",
        instruction: "Reconnect the water line and wire harness.",
        tips: ["Ensure connections are snug but not over-tightened"]
      },
      {
        stepNumber: 5,
        title: "Test Operation",
        instruction: "Plug in refrigerator, turn on ice maker, and test operation.",
        tips: ["Allow 24 hours for first ice production", "Check for leaks"]
      }
    ]
  },
  "WPW10348269": {
    partNumber: "WPW10348269",
    title: "Dishwasher Door Seal Replacement",
    difficulty: "easy" as const,
    estimatedTime: 30,
    toolsRequired: ["Phillips screwdriver", "Putty knife"],
    safetyWarnings: [
      "Disconnect power to dishwasher",
      "Ensure dishwasher has cooled down if recently used"
    ],
    steps: [
      {
        stepNumber: 1,
        title: "Access the Door Seal",
        instruction: "Open dishwasher door and locate the door seal around the opening.",
        tips: ["Clean the area before starting"]
      },
      {
        stepNumber: 2,
        title: "Remove Old Seal",
        instruction: "Carefully pull the old seal from the door frame groove.",
        tips: ["Use putty knife if seal is stuck", "Work slowly to avoid damage"]
      },
      {
        stepNumber: 3,
        title: "Install New Seal",
        instruction: "Press the new seal into the groove, starting at the top and working around.",
        tips: ["Ensure seal is fully seated in groove", "Check for gaps or bubbles"]
      },
      {
        stepNumber: 4,
        title: "Test the Door",
        instruction: "Close and open the door to ensure proper seal contact.",
        tips: ["Run a test cycle to check for leaks"]
      }
    ]
  }
};

// Compatibility database
export const compatibilityDatabase = {
  modelCompatibility: [
    {
      modelNumber: "WDT780SAEM1",
      brand: "Whirlpool",
      type: "dishwasher",
      compatibleParts: ["WPW10348269", "WPW10441006"]
    },
    {
      modelNumber: "WRF535SWHZ",
      brand: "Whirlpool", 
      type: "refrigerator",
      compatibleParts: ["PS11752778", "W10295370A", "W11244269"]
    },
    {
      modelNumber: "WRS325SDHZ",
      brand: "Whirlpool",
      type: "refrigerator",
      compatibleParts: ["PS11752778", "W10295370A", "W11244269"]
    },
    {
      modelNumber: "GI15NDXZS",
      brand: "Whirlpool",
      type: "refrigerator",
      compatibleParts: ["PS11752778", "W10295370A", "W11244269"]
    }
  ]
};

// Troubleshooting knowledge base
export const troubleshootingDatabase = {
  refrigerator: {
    "ice maker not working": {
      possibleCauses: [
        "Faulty ice maker assembly",
        "Water supply issue",
        "Temperature too high",
        "Clogged water filter"
      ],
      recommendedParts: ["PS11752778", "W10295370A"],
      diagnosticSteps: [
        "Check if ice maker is turned on",
        "Verify water supply to refrigerator",
        "Check freezer temperature (should be 0°F)",
        "Inspect water filter for clogs"
      ]
    },
    "no ice production": {
      possibleCauses: [
        "Ice maker assembly malfunction",
        "Water fill cup damaged",
        "Low water pressure"
      ],
      recommendedParts: ["PS11752778", "W11244269"],
      diagnosticSteps: [
        "Listen for ice maker cycling sounds",
        "Check water fill cup for damage",
        "Verify adequate water pressure"
      ]
    }
  },
  dishwasher: {
    "water leak": {
      possibleCauses: [
        "Damaged door seal",
        "Loose hose connections",
        "Cracked wash pump"
      ],
      recommendedParts: ["WPW10348269", "WPW10441006"],
      diagnosticSteps: [
        "Inspect door seal for tears or displacement",
        "Check all hose connections",
        "Run diagnostic cycle to identify leak source"
      ]
    },
    "dishwasher not cleaning": {
      possibleCauses: [
        "Faulty wash pump motor",
        "Clogged spray arms",
        "Insufficient water temperature"
      ],
      recommendedParts: ["WPW10441006"],
      diagnosticSteps: [
        "Check if spray arms are rotating",
        "Test water temperature (should be 120°F)",
        "Listen for unusual pump noises"
      ]
    }
  }
};