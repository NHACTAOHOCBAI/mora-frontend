import { apiClient } from '@/services/api-client';
import type {
  SpaceResponse,
  SpaceDetailResponse,
  SpaceMemberResponse,
  SpaceInvitationResponse,
  SpaceJoinPreviewResponse,
  SpaceRole,
  ApiResponse,
} from '../types';

export const getSpaces = async (): Promise<SpaceResponse[]> => {
  const response = await apiClient.get<ApiResponse<SpaceResponse[]>>('/spaces');
  return response.data.result;
};

export const getSpace = async (id: number): Promise<SpaceDetailResponse> => {
  const response = await apiClient.get<ApiResponse<SpaceDetailResponse>>(`/spaces/${id}`);
  return response.data.result;
};

export const createSpace = async (name: string, description: string): Promise<SpaceResponse> => {
  const response = await apiClient.post<ApiResponse<SpaceResponse>>('/spaces', { name, description });
  return response.data.result;
};

export const deleteSpace = async (id: number): Promise<void> => {
  await apiClient.delete<ApiResponse<void>>(`/spaces/${id}`);
};

// ==========================================
// TẦNG CỘNG TÁC: THÀNH VIÊN (MEMBERS)
// ==========================================

export const getSpaceMembers = async (spaceId: number): Promise<SpaceMemberResponse[]> => {
  const response = await apiClient.get<ApiResponse<SpaceMemberResponse[]>>(`/spaces/${spaceId}/members`);
  return response.data.result;
};

export const addSpaceMember = async (
  spaceId: number,
  data: { usernameOrEmail: string; role?: SpaceRole }
): Promise<SpaceMemberResponse> => {
  const response = await apiClient.post<ApiResponse<SpaceMemberResponse>>(`/spaces/${spaceId}/members`, data);
  return response.data.result;
};

export const updateMemberRole = async (
  spaceId: number,
  userId: number,
  data: { role: SpaceRole }
): Promise<SpaceMemberResponse> => {
  const response = await apiClient.patch<ApiResponse<SpaceMemberResponse>>(`/spaces/${spaceId}/members/${userId}`, data);
  return response.data.result;
};

export const removeSpaceMember = async (spaceId: number, userId: number): Promise<void> => {
  await apiClient.delete<ApiResponse<void>>(`/spaces/${spaceId}/members/${userId}`);
};

// ==========================================
// TẦNG CỘNG TÁC: LỜI MỜI (INVITATIONS)
// ==========================================

export const createSpaceInvitation = async (
  spaceId: number,
  data: { role: SpaceRole; durationDays?: number; inviteEmail?: string }
): Promise<SpaceInvitationResponse> => {
  const response = await apiClient.post<ApiResponse<SpaceInvitationResponse>>(`/spaces/${spaceId}/invitations`, data);
  return response.data.result;
};

export const getSpaceInvitations = async (spaceId: number): Promise<SpaceInvitationResponse[]> => {
  const response = await apiClient.get<ApiResponse<SpaceInvitationResponse[]>>(`/spaces/${spaceId}/invitations`);
  return response.data.result;
};

export const revokeSpaceInvitation = async (spaceId: number, invitationId: number): Promise<void> => {
  await apiClient.delete<ApiResponse<void>>(`/spaces/${spaceId}/invitations/${invitationId}`);
};

export const previewSpaceInvitation = async (inviteCode: string): Promise<SpaceJoinPreviewResponse> => {
  const response = await apiClient.get<ApiResponse<SpaceJoinPreviewResponse>>(`/spaces/join/${inviteCode}`);
  return response.data.result;
};

export const joinSpaceByInviteCode = async (inviteCode: string): Promise<SpaceResponse> => {
  const response = await apiClient.post<ApiResponse<SpaceResponse>>(`/spaces/join/${inviteCode}`);
  return response.data.result;
};
