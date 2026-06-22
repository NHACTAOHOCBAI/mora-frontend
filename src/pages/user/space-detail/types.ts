import type {
  SpaceDetailResponse,
  DocumentDetailResponse,
  DocumentImageDebugResponse,
} from '@/features/chat/types';

export interface DebugImageProps {
  docId: number;
  pageNumber: number;
  imgName: string;
  onZoom: (url: string) => void;
}

export interface DebugModalProps {
  showDebugModal: boolean;
  setShowDebugModal: (show: boolean) => void;
  debugDocName: string;
  isDebugImagesLoading: boolean;
  debugImagesData: DocumentImageDebugResponse[];
  selectedDocId: number | null;
  setZoomImageUrl: (url: string | null) => void;
  zoomImageUrl: string | null;
}

export interface StudyNotesTabProps {
  document: DocumentDetailResponse | undefined;
  isDocLoading: boolean;
  generateNotesPending: boolean;
  handleTriggerGenerateNotes: () => void;
}

export interface SpaceSidebarProps {
  space: SpaceDetailResponse | undefined;
  isSpaceLoading: boolean;
  selectedDocId: number | null;
  setSelectedDocId: (id: number | null) => void;
  chatMode: 'document' | 'space';
  setChatMode: (mode: 'document' | 'space') => void;
  activePage: number;
  setActivePage: (page: number) => void;
  isChatCollapsed: boolean;
  setIsChatCollapsed: (collapsed: boolean) => void;
  isUploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isDebugMode: boolean;
  setIsDebugMode: (mode: boolean) => void;
  vectorPathThreshold: number;
  setVectorPathThreshold: (val: number) => void;
  handleThresholdChangeFinished: (val: number) => void;
  updateThresholdPending: boolean;
  editingDocId: number | null;
  setEditingDocId: (id: number | null) => void;
  renameValue: string;
  setRenameValue: (val: string) => void;
  handleRenameClick: (e: React.MouseEvent, id: number, name: string) => void;
  handleRenameConfirm: (e: React.FormEvent | React.MouseEvent, id: number) => void;
  handleRenameCancel: (e: React.MouseEvent | React.KeyboardEvent) => void;
  renamePending: boolean;
  setDocToDelete: (doc: { id: number; name: string } | null) => void;
  handleOpenDebugModal: (e: React.MouseEvent, id: number, name: string) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
}
