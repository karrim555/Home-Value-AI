export type RenovationCategory = 'Curb Appeal' | 'Kitchen' | 'Bathroom' | 'Interior' | 'Outdoor' | 'General';

export interface RenovationSuggestion {
  id: string;
  name: string;
  description: string;
  avgCost: number;
  roi: number;
  category: RenovationCategory;
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
}

export interface HomeAnalysis {
  id: string;
  image: StoredImage;
  suggestions: RenovationSuggestion[];
  summary: string;
  state: 'loading' | 'results' | 'error';
  error: string | null;
}
