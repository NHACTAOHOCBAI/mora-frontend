export interface Citation {
  quote: string;
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
}

export interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  citations?: Citation[];
  timestamp: Date;
}
