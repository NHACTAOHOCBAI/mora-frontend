import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { aiSettingsApi } from '../services/ai-settings-api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Key } from 'lucide-react';

export const GlobalApiKeyPrompt: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  // Chỉ fetch dữ liệu khi user đã đăng nhập
  const { data: settings, isSuccess } = useQuery({
    queryKey: ['user-ai-settings'],
    queryFn: aiSettingsApi.getSettings,
    enabled: !!user,
  });

  useEffect(() => {
    // Nếu user đã đăng nhập và đã tải xong settings
    if (user && isSuccess && settings) {
      // Bỏ qua nếu đang ở trang cấu hình/profile
      if (location.pathname.includes('/profile')) return;

      const hasPrompted = sessionStorage.getItem('hasPromptedApiKey');
      
      // Nếu chưa có API Key và chưa từng hiển thị prompt trong session này
      if (!settings.hasApiKey && !hasPrompted) {
        setIsOpen(true);
        sessionStorage.setItem('hasPromptedApiKey', 'true');
      }
    }
  }, [user, isSuccess, settings, location.pathname]);

  const handleSetupNow = () => {
    setIsOpen(false);
    navigate('/profile?tab=guide-api-key');
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Key className="w-5 h-5" />
            Cần Cấu Hình API Key
          </DialogTitle>
          <DialogDescription className="pt-3 leading-relaxed text-sm text-muted-foreground">
            Để trải nghiệm đầy đủ các tính năng AI của Mora, bạn cần cung cấp Google Gemini API Key. Quá trình lấy Key hoàn toàn miễn phí và chỉ mất chưa đầy 1 phút.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 flex gap-2 sm:justify-end">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Để sau
          </Button>
          <Button onClick={handleSetupNow}>
            Xem hướng dẫn & Cấu hình ngay
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
