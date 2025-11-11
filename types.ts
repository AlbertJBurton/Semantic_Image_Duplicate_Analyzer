export type ImageStatus = 'unprocessed' | 'processing' | 'unique' | 'duplicate';

export interface ImageFile {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  status: ImageStatus;
  caption?: string;
  comparisons?: number;
  totalComparisons?: number;
}

export interface AnalysisResult {
  verdict: 'DUPLICATE' | 'UNIQUE' | 'UNKNOWN';
  analysis: string;
  reasoning: string;
}