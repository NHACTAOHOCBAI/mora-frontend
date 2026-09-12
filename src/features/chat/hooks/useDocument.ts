import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadDocument, deleteDocument } from '../services/document-api';

export const useUploadDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ spaceId, file }: { spaceId: number; file: File }) =>
      uploadDocument(spaceId, file),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['space', variables.spaceId] });
    },
  });
};

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: number; spaceId: number }) => deleteDocument(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['space', variables.spaceId] });
    },
  });
};
