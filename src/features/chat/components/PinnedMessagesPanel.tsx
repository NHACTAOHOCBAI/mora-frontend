import { useState, type RefObject } from "react";
import { Pin, Search, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PinnedMessageResponse } from "../types";

interface PinnedMessagesPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pins: PinnedMessageResponse[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  pendingIds: ReadonlySet<number>;
  onUnpin: (messageId: number) => void;
  onJump: (messageId: number) => void;
  returnFocus: RefObject<HTMLButtonElement | null>;
}

export const PinnedMessagesPanel = ({
  open, onOpenChange, pins, isLoading, isError, onRetry,
  pendingIds, onUnpin, onJump, returnFocus,
}: PinnedMessagesPanelProps) => {
  const [search, setSearch] = useState("");
  const normalized = search.trim().toLocaleLowerCase("vi");
  const filtered = pins.filter(({ message }) =>
    [message.text, message.sender === "assistant" ? "Trợ lý AI Mora" : message.fullName || "Thành viên"]
      .some(value => value.toLocaleLowerCase("vi").includes(normalized)));
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        showCloseButton={false}
        finalFocus={returnFocus}
        className="data-[side=right]:w-full data-[side=right]:sm:max-w-[420px] h-dvh gap-0 motion-reduce:transition-none"
      >
        <SheetHeader className="border-b pr-12">
          <SheetTitle className="flex items-center gap-2"><Pin className="size-4" />Tin đã ghim <span className="text-muted-foreground text-xs">{pins.length}</span></SheetTitle>
          <SheetDescription className="text-xs">Mọi thành viên đều có thể ghim và bỏ ghim.</SheetDescription>
          <SheetClose render={<Button variant="ghost" size="icon" className="absolute right-3 top-3" />} aria-label="Đóng tin đã ghim"><X className="size-4" /></SheetClose>
        </SheetHeader>
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
            <Input type="search" aria-label="Tìm tin đã ghim" placeholder="Tìm nội dung hoặc người gửi..." value={search} onChange={event => setSearch(event.target.value)} className="pl-9 h-10" />
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4 space-y-3" aria-live="polite">
          {isLoading ? <p className="py-8 text-center text-muted-foreground">Đang tải tin đã ghim...</p> :
            isError ? <div className="py-8 text-center space-y-3"><p>Không thể tải tin đã ghim.</p><Button variant="outline" onClick={onRetry}>Thử lại</Button></div> :
            filtered.length === 0 ? <div className="py-8 text-center space-y-2 text-muted-foreground"><Pin className="mx-auto size-6" /><p>{normalized ? "Không tìm thấy tin phù hợp." : "Chưa có tin nhắn được ghim."}</p><p className="text-xs">{normalized ? "Thử tìm bằng từ khóa khác." : "Dùng nút ghim cạnh tin nhắn để cả nhóm dễ tìm lại."}</p></div> :
            filtered.map(pin => (
              <article key={pin.message.id} className="rounded-xl border p-3 space-y-2 min-w-0">
                <p className="text-xs font-semibold truncate">{pin.message.sender === "assistant" ? "Trợ lý AI Mora" : pin.message.fullName || "Thành viên"}</p>
                <p className="whitespace-pre-wrap break-words line-clamp-4 text-sm">{pin.message.text}</p>
                <p className="type-meta text-muted-foreground break-words">{pin.pinnedByName} đã ghim · {new Date(pin.pinnedAt).toLocaleString("vi-VN")}</p>
                <div className="flex justify-between gap-2">
                  <Button size="sm" variant="outline" onClick={() => onJump(pin.message.id)}>Xem trong hội thoại</Button>
                  <Button size="sm" variant="ghost" disabled={pendingIds.has(pin.message.id)} onClick={() => onUnpin(pin.message.id)}>Bỏ ghim</Button>
                </div>
              </article>
            ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};
