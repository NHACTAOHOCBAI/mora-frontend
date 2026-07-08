export interface Message {
  id: number;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string | Date;
}

export interface SpaceDetailResponse {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}
