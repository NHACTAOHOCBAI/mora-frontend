import type { SpaceDetailResponse } from '@/features/chat/types';
import type { DocumentResponse } from '@/features/chat/services/document-api';

export interface SpaceSidebarProps {
  space: (SpaceDetailResponse & { documents?: DocumentResponse[] }) | undefined;
  isSpaceLoading: boolean;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  selectedDocumentId: number | null;
  onSelectDocument: (doc: DocumentResponse | null) => void;
}
