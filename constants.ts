export const ROI_DATA: { [key: string]: { avgCost: number; roi: number; category: 'Curb Appeal' | 'Kitchen' | 'Bathroom' | 'Interior' | 'Outdoor' } } = {
  // Curb Appeal
  'Paint Front Door': { avgCost: 350, roi: 101, category: 'Curb Appeal' },
  'Update Outdoor Lighting': { avgCost: 450, roi: 75, category: 'Curb Appeal' },
  'Install New House Numbers': { avgCost: 100, roi: 150, category: 'Curb Appeal' },
  'Basic Landscaping': { avgCost: 1500, roi: 100, category: 'Curb Appeal' },
  'Garage Door Replacement': { avgCost: 4513, roi: 194, category: 'Curb Appeal' },
  'Entry Door Replacement (Steel)': { avgCost: 2355, roi: 188, category: 'Curb Appeal' },


  // Kitchen
  'Install New Kitchen Faucet': { avgCost: 400, roi: 150, category: 'Kitchen' },
  'Replace Cabinet Hardware': { avgCost: 250, roi: 200, category: 'Kitchen' },
  'Add a Tile Backsplash': { avgCost: 1200, roi: 80, category: 'Kitchen' },
  'Install Under-Cabinet Lighting': { avgCost: 350, roi: 70, category: 'Kitchen' },
  'Minor Kitchen Remodel': { avgCost: 27492, roi: 96, category: 'Kitchen' },


  // Bathroom
  'Replace Bathroom Faucet': { avgCost: 300, roi: 100, category: 'Bathroom' },
  'Reglaze Bathtub': { avgCost: 500, roi: 120, category: 'Bathroom' },
  'Install New Vanity': { avgCost: 1000, roi: 70, category: 'Bathroom' },
  'Update Bathroom Lighting': { avgCost: 400, roi: 65, category: 'Bathroom' },


  // Interior
  'Install Smart Thermostat': { avgCost: 250, roi: 100, category: 'Interior' },
  'Neutral Interior Paint': { avgCost: 2500, roi: 60, category: 'Interior' },
  'Replace Old Light Fixtures': { avgCost: 600, roi: 70, category: 'Interior' },
  'Install Crown Molding': { avgCost: 1500, roi: 80, category: 'Interior' },
};

export const VALID_CATEGORIES = Object.keys(ROI_DATA);

export const getFinancialGrade = (roi: number) => {
  if (roi >= 100) {
    return {
      grade: 'A+',
      label: 'High Profit',
      bannerLabel: 'EXCELLENT RETURN',
      textColor: 'text-emerald-800',
      bgColor: 'bg-emerald-100',
      dividerColor: 'bg-emerald-500',
    };
  }
  if (roi >= 60) {
    return {
      grade: 'B',
      label: 'Solid Value',
      bannerLabel: 'SOLID VALUE',
      textColor: 'text-sky-800',
      bgColor: 'bg-sky-100',
      dividerColor: 'bg-sky-500',
    };
  }
  return {
    grade: 'C-',
    label: 'Luxury Risk',
    bannerLabel: 'LUXURY RISK',
    textColor: 'text-red-800',
    bgColor: 'bg-red-100',
    dividerColor: 'bg-red-500',
  };
};
