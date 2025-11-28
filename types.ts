
export interface HistoryItem {
  id: string;
  question: string;
  answer: string;
  timestamp: string;
  sourceType: 'text' | 'image' | 'document' | 'video';
  mode?: SolverMode;
}

export interface Source {
  title: string;
  uri: string;
}

export interface SolveResponse {
  answer: string;
  steps: string[];
  concept: string;
  sources?: Source[];
}

export interface FileData {
  base64: string;
  mimeType: string;
  name: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  fileData?: FileData;
  response?: SolveResponse;
  timestamp: string;
}

export interface FlashcardData {
  front: string;
  back: string;
  tip: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  provider: 'google' | 'apple';
}

export type SolverMode = 'standard' | 'fast' | 'search';

export type PageType = 'home' | 'about' | 'video' | 'live';
