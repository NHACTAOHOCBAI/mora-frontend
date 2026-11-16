import { FileQuestion } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ErrorView } from "@/components/shared/ErrorView";

export const NotFoundPage = () => (
  <ErrorView icon={<FileQuestion />} code="404" title="Không tìm thấy trang"
    description="Trang bạn đang tìm không tồn tại hoặc đã được chuyển sang địa chỉ khác.">
    <Button className="h-10 w-full" render={<Link to="/" />}>Về trang chủ</Button>
  </ErrorView>
);
