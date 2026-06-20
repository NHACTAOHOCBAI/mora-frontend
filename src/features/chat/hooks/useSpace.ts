import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSpaces, getSpace, createSpace, deleteSpace, uploadDocument, deleteDocument, renameDocument, updateDocumentThreshold } from '../services/space-api';

export const useSpaces = () => {
  return useQuery({
    queryKey: ['spaces'],
    queryFn: getSpaces,
  });
};

export const useSpaceDetail = (id: number) => {
  return useQuery({
    queryKey: ['space', id],
    queryFn: () => getSpace(id),
    enabled: !isNaN(id) && id > 0,
  });
};

export const useCreateSpace = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, description }: { name: string; description: string }) => 
      createSpace(name, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
    },
  });
};

export const useDeleteSpace = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteSpace(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
    },
  });
};

export const useUploadDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, spaceId, vectorPathThreshold }: { file: File; spaceId: number; vectorPathThreshold?: number }) => 
      uploadDocument(file, spaceId, vectorPathThreshold),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['space', variables.spaceId] });
    },
  });
};

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: number; spaceId: number }) => 
      deleteDocument(vars.id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['space', variables.spaceId] });
    },
  });
};

export const useRenameDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: number; fileName: string; spaceId: number }) => 
      renameDocument(vars.id, vars.fileName),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['space', variables.spaceId] });
      queryClient.invalidateQueries({ queryKey: ['document', variables.id] });
    },
  });
};

export const useUpdateDocumentThreshold = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: number; threshold: number; spaceId: number }) =>
      updateDocumentThreshold(vars.id, vars.threshold),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['space', variables.spaceId] });
      queryClient.invalidateQueries({ queryKey: ['document', variables.id] });
    },
  });
};
