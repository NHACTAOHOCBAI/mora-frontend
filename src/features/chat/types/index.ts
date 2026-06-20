export interface Citation {
  quote: string;
  pageNumber: number;
  documentId?: number;
  documentName?: string;
}

export interface SpaceCitation {
  quote: string;
  documentId: number;
  documentName?: string;
  pageNumber: number;
}

export interface ChatHistoryMessage {
  sender: 'user' | 'assistant';
  text: string;
}

export interface DocumentChatRequest {
  documentId: number;
  question: string;
  history?: ChatHistoryMessage[];
}

export interface DocumentChatResponse {
  answerFound: boolean;
  answer: string;
  citations: Citation[];
  condensedQuestion?: string;
  promptSent?: string;
}

export interface SpaceChatRequest {
  spaceId: number;
  question: string;
  history?: ChatHistoryMessage[];
}

export interface SpaceChatResponse {
  answerFound: boolean;
  answer: string;
  citations: SpaceCitation[];
  condensedQuestion?: string;
  promptSent?: string;
}

export interface DocumentPageResponse {
  id: number;
  pageNumber: number;
  content: string;
  hasImage?: boolean;
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
  vectorPathThreshold?: number;
}

export interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  citations?: (Citation | SpaceCitation)[];
  timestamp: Date;
  condensedQuestion?: string;
  promptSent?: string;
}

export interface ChatMessageResponse {
  id: number;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  citations?: (Citation | SpaceCitation)[];
  condensedQuestion?: string;
  promptSent?: string;
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
    pagesWithImages?: number[];
    vectorPathThreshold?: number;
  }[];
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  result: T;
}

export interface ImageDebugInfo {
  name: string;
  type: string;
  width: number;
  height: number;
  accepted: boolean;
  filterReason?: string;
}

export interface DocumentImageDebugResponse {
  pageNumber: number;
  pageContent?: string;
  images: ImageDebugInfo[];
  vectorPathCount?: number;
}
