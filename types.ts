export enum AppStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export interface GeneratedImage {
  originalUrl: string;
  colorizedUrl: string;
}

export interface ProcessingError {
  message: string;
  details?: string;
}

export type ColorizationStyle = 'vibrant' | 'pastel' | 'gritty' | 'retro' | 'painterly' | 'custom';

export interface BatchItem {
  id: string;
  file: File;
  previewUrl: string;
  status: 'QUEUED' | 'PROCESSING' | 'SUCCESS' | 'ERROR';
  resultBase64?: string;
  error?: string;
}