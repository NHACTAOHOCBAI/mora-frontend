import type { SpaceDetailResponse } from '@/features/chat/types';

export interface SpaceSidebarProps {
  space: SpaceDetailResponse | undefined;
  isSpaceLoading: boolean;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
}
