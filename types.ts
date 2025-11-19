
export type RenovationCategory = 'Curb Appeal' | 'Kitchen' | 'Bathroom' | 'Interior' | 'Outdoor' | 'General';

export interface RenovationSuggestion {
  id: string;
  name: string;
  description: string;
  avgCost: number;
  roi: number;
  category: RenovationCategory;
  rationale?: string; // New: Explain why the ROI is high/low for this location
}

export interface ProductSuggestion {
  name: string;
  description: string;
  project: string; // The name of the RenovationSuggestion it belongs to
}

export interface StoredImage {
  id: string;
  dataUrl: string;
}

export interface FeedItem {
  id: string;
  type: 'image' | 'video';
  prompt: string;
  contentUrl: string;
  status: 'pending' | 'generating' | 'complete' | 'error';
}

export interface Project extends RenovationSuggestion {
    isSaved: boolean;
    actualCost?: number; // New: Track real spending via receipts
    zipCode?: string; // New: For local product sourcing
}

export interface HomeAnalysis {
  id: string;
  image: StoredImage;
  zipCode?: string; // New: Store location context
  suggestions: RenovationSuggestion[];
  summary: string;
  state: 'loading' | 'results' | 'error';
  error: string | null;
}

export interface RenovationPlan {
    phases: {
        phaseName: string;
        tasks: string[]; // Names of projects in this phase
        duration: string;
        description: string;
    }[];
    totalDuration: string;
    advice: string;
}

export interface ShoppingResult {
    text: string;
    sources: { title: string; uri: string }[];
}
