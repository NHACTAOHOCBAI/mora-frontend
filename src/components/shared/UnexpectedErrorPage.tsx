import { AlertCircle } from "lucide-react";
import { ErrorView } from "./ErrorView";
import { ErrorPageFrame } from "./ErrorPageFrame";

const actionClass = "h-10 rounded-lg px-4 text-sm font-medium focus-visible:outline-2 focus-visible:outline-ring";
export const UnexpectedErrorPage = () => (
  <ErrorPageFrame>
    <ErrorView icon={<AlertCircle />} title="Không thể mở trang này"
      description="Đã xảy ra sự cố khi mở trang. Bạn có thể tải lại hoặc quay về trang chủ.">
      <button type="button" onClick={() => window.location.reload()} className={actionClass + " bg-primary text-primary-foreground hover:bg-primary/80"}>Tải lại trang</button>
      <a href="/" className={actionClass + " text-muted-foreground hover:bg-muted hover:text-foreground"}>Về trang chủ</a>
    </ErrorView>
  </ErrorPageFrame>
);
