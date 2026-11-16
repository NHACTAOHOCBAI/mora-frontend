import { useCallback, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api-error";
import { getMessagePins, setMessagePinned } from "../services/pins-api";

export const useMessagePins = (spaceId: number, enabled: boolean) => {
  const queryClient = useQueryClient();
  const key = ["message-pins", spaceId];
  const query = useQuery({
    enabled: enabled && Number.isFinite(spaceId) && spaceId > 0,
    queryKey: key,
    queryFn: () => getMessagePins(spaceId),
    refetchOnWindowFocus: "always",
    refetchOnReconnect: "always",
  });
  const busy = useRef(new Set<number>());
  const [pendingIds, setPendingIds] = useState<ReadonlySet<number>>(new Set());
  const mutation = useMutation({
    mutationFn: ({ messageId, pinned }: { messageId: number; pinned: boolean }) =>
      setMessagePinned(spaceId, messageId, pinned),
    onSuccess: async (_, { pinned }) => {
      await queryClient.invalidateQueries({ queryKey: key });
      toast.success(pinned ? "Đã ghim tin nhắn cho nhóm" : "Đã bỏ ghim tin nhắn");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const { mutateAsync } = mutation;
  const togglePin = useCallback(async (messageId: number, pinned: boolean) => {
    if (busy.current.has(messageId)) return;
    busy.current.add(messageId);
    setPendingIds(new Set(busy.current));
    try {
      await mutateAsync({ messageId, pinned });
    } catch {
      // The mutation reports errors; retain the server's previous state.
    } finally {
      busy.current.delete(messageId);
      setPendingIds(new Set(busy.current));
    }
  }, [mutateAsync]);
  return { ...query, pendingIds, togglePin };
};
