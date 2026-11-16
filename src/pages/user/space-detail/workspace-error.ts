import { AppApiError } from "../../../lib/api-error.ts";

export const workspaceError = (error: unknown, invalidId: boolean) => {
  const api = error instanceof AppApiError ? error : undefined;
  if (invalidId || api?.status === 404 || api?.code === 1011) {
    return { kind: "missing", title: "Không tìm thấy không gian",
      description: "Không gian này không tồn tại hoặc địa chỉ không hợp lệ.", retry: false } as const;
  }
  if (api?.status === 403 || api?.code === 1007 || api?.code === 1026) {
    return { kind: "forbidden", title: "Bạn không có quyền truy cập",
      description: "Bạn chưa có quyền truy cập không gian này. Hãy liên hệ chủ nhóm để được hỗ trợ.", retry: false } as const;
  }
  return { kind: "unavailable", title: "Không thể tải không gian",
    description: "Vui lòng kiểm tra kết nối và thử lại. Phiên đăng nhập của bạn vẫn được giữ.", retry: true } as const;
};
