import axios from 'axios';

export interface ApiErrorPayload {
  code?: number;
  message?: string;
}

export class AppApiError extends Error {
  readonly status?: number;
  readonly code?: number;

  constructor(message: string, options: { status?: number; code?: number } = {}) {
    super(message);
    this.name = 'AppApiError';
    this.status = options.status;
    this.code = options.code;
  }
}

const fallbackByStatus: Record<number, string> = {
  400: 'Dữ liệu gửi lên không hợp lệ. Vui lòng kiểm tra lại.',
  401: 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.',
  403: 'Bạn không có quyền thực hiện thao tác này.',
  404: 'Không tìm thấy dữ liệu yêu cầu.',
  413: 'Tệp tải lên vượt quá dung lượng cho phép.',
  429: 'Thao tác đang được thực hiện quá nhiều. Vui lòng thử lại sau.',
  500: 'Hệ thống đang gặp sự cố. Vui lòng thử lại sau.',
  502: 'Dịch vụ hiện chưa sẵn sàng. Vui lòng thử lại sau.',
  503: 'Dịch vụ hiện chưa sẵn sàng. Vui lòng thử lại sau.',
};

export const toAppApiError = (error: unknown): AppApiError => {
  if (error instanceof AppApiError) return error;

  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const payload = error.response?.data as ApiErrorPayload | undefined;
    const message = payload?.message
      || (status ? fallbackByStatus[status] : undefined)
      || (error.code === 'ECONNABORTED'
        ? 'Yêu cầu mất quá nhiều thời gian. Vui lòng thử lại.'
        : 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.');
    return new AppApiError(message, { status, code: payload?.code });
  }

  return new AppApiError('Đã xảy ra lỗi không mong muốn. Vui lòng thử lại sau.');
};

export const getErrorMessage = (error: unknown, fallback?: string): string =>
  toAppApiError(error).message || fallback || 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại sau.';
