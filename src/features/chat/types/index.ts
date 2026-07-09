export interface Message {
  id: number;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string | Date;
}

export interface SpaceResponse {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

import type { DocumentResponse } from '../services/document-api';

export interface SpaceDetailResponse {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  documents?: DocumentResponse[];
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  result: T;
}
