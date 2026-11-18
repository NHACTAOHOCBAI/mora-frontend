import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseQueryOptions } from '@tanstack/react-query';
import {
  getSpaces,
  getDashboard,
  getSpace,
  createSpace,
  updateSpace,
  deleteSpace,
  leaveSpace,
  getSpaceMembers,
  addSpaceMember,
  updateMemberRole,
  removeSpaceMember,
  createSpaceInvitation,
  getSpaceInvitations,
  revokeSpaceInvitation,
  previewSpaceInvitation,
  joinSpaceByInviteCode,
  respondToMemberInvitation,
} from '../services/space-api';
import type {
  SpaceDetailResponse,
  SpaceRole,
  SpaceMemberResponse,
  SpaceInvitationResponse,
  SpaceJoinPreviewResponse,
} from '../types';

export const useSpaces = () => {
  return useQuery({
    queryKey: ['spaces'],
    queryFn: getSpaces,
  });
};

export const useDashboard = (enabled = true) => useQuery({
  queryKey: ['dashboard'],
  queryFn: getDashboard,
  enabled,
});

export const useSpaceDetail = (id: number, options?: Omit<UseQueryOptions<SpaceDetailResponse>, 'queryKey' | 'queryFn'>) => {
  return useQuery<SpaceDetailResponse>({
    queryKey: ['space', id],
    queryFn: () => getSpace(id),
    enabled: !isNaN(id) && id > 0,
    ...options,
  });
};

export const useCreateSpace = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, description }: { name: string; description: string }) => 
      createSpace(name, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useDeleteSpace = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteSpace(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useUpdateSpace = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ spaceId, data }: { spaceId: number; data: { name: string; description: string } }) => updateSpace(spaceId, data),
    onSuccess: (_, { spaceId }) => Promise.all([
      queryClient.invalidateQueries({ queryKey: ['space', spaceId] }),
      queryClient.invalidateQueries({ queryKey: ['spaces'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    ]),
  });
};

export const useLeaveSpace = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ spaceId, successorUserId }: { spaceId: number; successorUserId?: number }) => leaveSpace(spaceId, successorUserId),
    onSuccess: () => Promise.all([
      queryClient.invalidateQueries({ queryKey: ['spaces'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    ]),
  });
};

// ==========================================
// TẦNG CỘNG TÁC: MEMBER HOOKS
// ==========================================

export const useSpaceMembers = (spaceId: number, options?: { enabled?: boolean }) => {
  return useQuery<SpaceMemberResponse[]>({
    queryKey: ['space-members', spaceId],
    queryFn: () => getSpaceMembers(spaceId),
    enabled: !isNaN(spaceId) && spaceId > 0 && (options?.enabled ?? true),
  });
};

export const useAddSpaceMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ spaceId, data }: { spaceId: number; data: { email: string; role?: SpaceRole } }) =>
      addSpaceMember(spaceId, data),
    onSuccess: (_, { spaceId }) => {
      queryClient.invalidateQueries({ queryKey: ['space-members', spaceId] });
      queryClient.invalidateQueries({ queryKey: ['space', spaceId] });
    },
  });
};

export const useUpdateMemberRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ spaceId, userId, role }: { spaceId: number; userId: number; role: SpaceRole }) =>
      updateMemberRole(spaceId, userId, { role }),
    onSuccess: (_, { spaceId }) => {
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: ['space-members', spaceId] }),
        queryClient.invalidateQueries({ queryKey: ['space', spaceId] }),
      ]);
    },
  });
};

export const useRemoveSpaceMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ spaceId, userId }: { spaceId: number; userId: number }) =>
      removeSpaceMember(spaceId, userId),
    onSuccess: (_, { spaceId }) => {
      queryClient.invalidateQueries({ queryKey: ['space-members', spaceId] });
      queryClient.invalidateQueries({ queryKey: ['space', spaceId] });
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
    },
  });
};

// ==========================================
// TẦNG CỘNG TÁC: INVITATION HOOKS
// ==========================================

export const useSpaceInvitations = (spaceId: number, options?: { enabled?: boolean }) => {
  return useQuery<SpaceInvitationResponse[]>({
    queryKey: ['space-invitations', spaceId],
    queryFn: () => getSpaceInvitations(spaceId),
    enabled: !isNaN(spaceId) && spaceId > 0 && (options?.enabled ?? true),
  });
};

export const useCreateSpaceInvitation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      spaceId,
      data,
    }: {
      spaceId: number;
      data: { role: SpaceRole; durationDays?: number };
    }) => createSpaceInvitation(spaceId, data),
    onSuccess: (_, { spaceId }) => {
      queryClient.invalidateQueries({ queryKey: ['space-invitations', spaceId] });
    },
  });
};

export const useRevokeSpaceInvitation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ spaceId, invitationId }: { spaceId: number; invitationId: number }) =>
      revokeSpaceInvitation(spaceId, invitationId),
    onSuccess: (_, { spaceId }) => {
      queryClient.invalidateQueries({ queryKey: ['space-invitations', spaceId] });
    },
  });
};

export const usePreviewSpaceInvitation = (inviteCode: string) => {
  return useQuery<SpaceJoinPreviewResponse>({
    queryKey: ['space-invitation-preview', inviteCode],
    queryFn: () => previewSpaceInvitation(inviteCode),
    enabled: !!inviteCode && inviteCode.trim().length > 0,
    retry: false,
    refetchOnMount: 'always',
  });
};

export const useJoinSpaceByInviteCode = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (inviteCode: string) => joinSpaceByInviteCode(inviteCode),
    onSuccess: () => Promise.all([
      queryClient.invalidateQueries({ queryKey: ['spaces'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    ]),
  });
};
export const useRespondToMemberInvitation = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: ({ id, action }: { id: number; action: 'accept' | 'decline' }) => respondToMemberInvitation(id, action), onSuccess: () => Promise.all([queryClient.invalidateQueries({ queryKey: ['dashboard'] }), queryClient.invalidateQueries({ queryKey: ['spaces'] })]) });
};
