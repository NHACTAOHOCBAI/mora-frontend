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

export interface SpaceDetailResponse {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  result: T;
}
