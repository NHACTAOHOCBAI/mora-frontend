import type { DocumentResponse } from '../services/document-api';

export type SpaceRole = 'OWNER' | 'EDITOR' | 'VIEWER';
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
export type MessageType = 'USER_MESSAGE' | 'AI_QUERY' | 'AI_RESPONSE';

export interface Message {
  id: number;
  sender: 'user' | 'assistant';
  messageType?: MessageType;
  text: string;
  userId?: number;
  userName?: string;
  userAvatar?: string;
  timestamp: string | Date;
  citations?: any[];
  condensedQuestion?: string;
  promptSent?: string;
  selectedDocumentIds?: number[];
}

export interface SpaceMemberResponse {
  id: number;
  userId: number;
  username: string;
  fullName?: string;
  avatarUrl?: string;
  role: SpaceRole;
  joinedAt: string;
}

export interface SpaceInvitationResponse {
  id: number;
  spaceId: number;
  spaceName: string;
  inviteCode: string;
  inviteEmail?: string;
  role: SpaceRole;
  status: InvitationStatus;
  expiresAt?: string;
  createdAt: string;
  inviterName?: string;
}

export interface SpaceJoinPreviewResponse {
  spaceId: number;
  spaceName: string;
  spaceDescription?: string;
  inviterName?: string;
  inviterAvatar?: string;
  role: SpaceRole;
  memberCount: number;
  documentCount: number;
  isAlreadyMember: boolean;
}

export interface SpaceResponse {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  currentUserRole?: SpaceRole;
  memberCount?: number;
  documentCount?: number;
  ownerName?: string;
}

export interface SpaceDetailResponse {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  currentUserRole?: SpaceRole;
  memberCount?: number;
  documents?: DocumentResponse[];
  members?: SpaceMemberResponse[];
  ownerName?: string;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  result: T;
}
