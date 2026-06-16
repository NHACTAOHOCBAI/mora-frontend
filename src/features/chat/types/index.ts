export interface Citation {
  quote: string;
  pageNumber: number;
}

export interface SpaceCitation {
  quote: string;
  documentId: number;
  pageNumber: number;
}

export interface DocumentChatRequest {
  documentId: number;
  question: string;
}

export interface DocumentChatResponse {
  answerFound: boolean;
  answer: string;
  citations: Citation[];
}

export interface SpaceChatRequest {
  spaceId: number;
  question: string;
}

export interface SpaceChatResponse {
  answerFound: boolean;
  answer: string;
  citations: SpaceCitation[];
}

export interface DocumentPageResponse {
  id: number;
  pageNumber: number;
  content: string;
}

export interface DocumentDetailResponse {
  id: number;
  fileName: string;
  fileType: string;
  storageUrl: string;
  createdAt: string;
  updatedAt: string;
  pages: DocumentPageResponse[];
  summary?: string;
  flashcards?: string;
}

export interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  citations?: (Citation | SpaceCitation)[];
  timestamp: Date;
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
  documents: {
    id: number;
    fileName: string;
    fileType: string;
    storageUrl: string;
    createdAt: string;
    updatedAt: string;
  }[];
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  result: T;
}
