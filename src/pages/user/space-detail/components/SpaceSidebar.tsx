import React, { useRef, useEffect } from "react";
import { FileText, Upload, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popconfirm } from "@/components/ui/popconfirm";
import type { SpaceSidebarProps } from "../types";
import {
  useUploadDocument,
  useDeleteDocument,
} from "@/features/chat/hooks/useDocument";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";

export const SpaceSidebar: React.FC<SpaceSidebarProps> = ({
  space,
  isSpaceLoading,
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  selectedDocumentId,
  onSelectDocument,
  currentUserId,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadDocument();
  const deleteMutation = useDeleteDocument();

  const processingDocsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!space?.documents) return;

    space.documents.forEach((doc) => {
      const isProcessing =
        doc.status === "UPLOADING" ||
        doc.status === "PARSING" ||
        doc.status === "INDEXING";
      const isReady = doc.status === "READY";
      const isFailed = doc.status === "FAILED";

      if (isProcessing) {
        processingDocsRef.current.add(doc.id);
      } else if (isReady && processingDocsRef.current.has(doc.id)) {
        toast.success(`Tài liệu "${doc.name}" đã sẵn sàng`);
        processingDocsRef.current.delete(doc.id);
      } else if (isFailed && processingDocsRef.current.has(doc.id)) {
        toast.error(`Xử lý tài liệu "${doc.name}" thất bại`);
        processingDocsRef.current.delete(doc.id);
      }
    });
  }, [space?.documents]);

  const isOwner = space?.currentUserRole === "OWNER";
  const isViewer = space?.currentUserRole === "VIEWER";
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !space) return;

    if (isViewer) {
      toast.error("Người xem không có quyền tải lên tài liệu");
      return;
    }

    if (file.type !== "application/pdf") {
      toast.error("Chỉ hỗ trợ tải lên tệp tin PDF");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      toast.error("Kích thước tài liệu không được vượt quá 15MB");
      return;
    }

    uploadMutation.mutate(
      { spaceId: space.id, file },
      {
        onSuccess: () => {
          toast.info("Tệp đã được tải lên. Hệ thống đang xử lý...");
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        },
        onError: (error: unknown) => {
          toast.error(getErrorMessage(error));
        },
      },
    );
  };

  const deleteDocument = async (docId: number) => {
    if (!space) return;
    await deleteMutation.mutateAsync({ id: docId, spaceId: space.id });
    toast.success("Xóa tài liệu thành công");
    if (selectedDocumentId === docId) {
      onSelectDocument(null);
    }
  };

  const closeSidebar = () => {
    setIsSidebarCollapsed(true);
    document.getElementById("space-documents-toggle")?.focus();
  };

  useEffect(() => {
    if (isSidebarCollapsed) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) {
        setIsSidebarCollapsed(true);
        document.getElementById("space-documents-toggle")?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isSidebarCollapsed, setIsSidebarCollapsed]);
  return (
    <>
      <button
        aria-label="Đóng danh sách tài liệu"
        aria-hidden={isSidebarCollapsed}
        tabIndex={-1}
        className={cn(
          "absolute inset-0 z-40 bg-background/80 md:hidden transition-opacity duration-300 ease-in-out motion-reduce:transition-none",
          isSidebarCollapsed ? "opacity-0 pointer-events-none" : "opacity-100",
        )}
        onClick={closeSidebar}
      />
      <aside
        id="space-documents-sidebar"
        aria-label="Danh sách tài liệu"
        aria-hidden={isSidebarCollapsed}
        inert={isSidebarCollapsed}
        data-state={isSidebarCollapsed ? "closed" : "open"}
        className={cn(
          "absolute inset-y-0 left-0 z-50 w-[280px] max-w-[85vw] md:relative md:max-w-none shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out motion-reduce:transition-none",
          isSidebarCollapsed ? "pointer-events-none md:w-0" : "md:w-[280px]",
        )}
      >
        <div
          className={cn(
            "w-[280px] max-w-[85vw] h-full border-r border-border bg-card flex flex-col transition-transform duration-300 ease-in-out motion-reduce:transition-none",
            isSidebarCollapsed ? "-translate-x-full" : "translate-x-0",
          )}
        >
          <div className="flex items-center justify-between px-4 py-5">
            <h2 className="text-sm font-medium">
              Tài liệu{" "}
              <span className="ml-2 text-muted-foreground">
                {space?.documents?.length || 0}
              </span>
            </h2>
          </div>
          <div className="px-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleFileUpload}
            />
            {!isViewer && (
              <Button
                variant="outline"
                className="w-full bg-muted/50"
                disabled={uploadMutation.isPending}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Upload className="size-4" />
                )}
                Tải PDF lên
              </Button>
            )}
            <p className="text-xs text-muted-foreground mt-2 px-1">
              PDF · tối đa 15 MB
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-3 mt-3 space-y-2">
            {isSpaceLoading ? (
              <Loader2 className="size-5 animate-spin mx-auto" />
            ) : !space?.documents?.length ? (
              <p className="text-xs text-muted-foreground p-3">
                Chưa có tài liệu. Tải PDF lên để bắt đầu.
              </p>
            ) : (
              space.documents.map((doc) => {
                const processing = !["READY", "FAILED"].includes(doc.status);
                return (
                  <div
                    key={doc.id}
                    className={`flex items-start gap-2 p-2 rounded-lg ${selectedDocumentId === doc.id ? "bg-primary/10" : "hover:bg-muted/60"}`}
                  >
                    <button
                      className="flex min-w-0 flex-1 items-start gap-3 text-left rounded-md focus-visible:outline-2 focus-visible:outline-ring"
                      onClick={() => {
                        if (doc.status === "READY") {
                          onSelectDocument(
                            selectedDocumentId === doc.id ? null : doc,
                          );
                          if (window.innerWidth < 768) closeSidebar();
                        } else
                          toast.info(
                            doc.status === "FAILED"
                              ? "Tài liệu bị lỗi xử lý"
                              : "Tài liệu đang xử lý, vui lòng đợi",
                          );
                      }}
                    >
                      <span className="flex size-8 shrink-0 self-start items-center justify-center rounded-lg bg-primary/5 text-primary">
                        {processing ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <FileText className="size-4" />
                        )}
                      </span>
                      <span className="min-w-0 text-sm">
                        <span className="line-clamp-2 break-words">
                          {doc.name}
                        </span>
                        <span className="block text-xs text-muted-foreground mt-1">
                          {processing
                            ? "Đang xử lý..."
                            : doc.status === "FAILED"
                              ? "Lỗi xử lý"
                              : doc.uploadedByName}
                        </span>
                      </span>
                    </button>
                    {(isOwner || doc.uploadedById === currentUserId) && (
                      <Popconfirm
                        title="Xóa tài liệu?"
                        description={`“${doc.name}” sẽ bị xóa vĩnh viễn.`}
                        confirmLabel="Xóa tài liệu"
                        pending={deleteMutation.isPending}
                        onConfirm={() => deleteDocument(doc.id)}
                        trigger={<Button variant="ghost" size="icon" className="size-7 shrink-0 text-muted-foreground hover:text-destructive" title="Xóa tài liệu" disabled={processing || deleteMutation.isPending} onClick={(event) => event.stopPropagation()}><Trash2 className="size-3.5" /></Button>}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
