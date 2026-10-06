import React from 'react';
import { ExternalLink, CheckCircle2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { BorderedCard } from '@/components/shared/BorderedCard';

export const GuideApiKeyTab: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full animate-in fade-in duration-300">
      <BorderedCard
        title="Hướng Dẫn Lấy Google Gemini API Key"
        description="Làm theo 4 bước đơn giản dưới đây để lấy khóa API từ Google AI Studio hoàn toàn miễn phí."
        icon={<Info className="w-5 h-5 text-primary" />}
      >
        <div className="flex flex-col gap-8">
          {/* Bước 1 */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold shrink-0">1</div>
              <h3 className="font-semibold text-lg text-foreground">Đăng Nhập Google AI Studio</h3>
            </div>
            <p className="text-sm text-muted-foreground ml-11">
              Truy cập vào trang quản lý API Key của Google AI Studio và đăng nhập bằng tài khoản Google của bạn.
            </p>
            <div className="ml-11">
              <Button 
                className="w-full sm:w-auto gap-2 cursor-pointer" 
                onClick={() => window.open('https://aistudio.google.com/app/apikey', '_blank')}
              >
                Mở Google AI Studio <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
            
            <img 
              src="/images/guide/step1.png" 
              alt="Hướng dẫn bước 1" 
              className="mt-4 ml-11 rounded-lg border border-border/50 shadow-sm max-w-3xl w-full object-cover"
            />
          </div>

          {/* Bước 2 */}
          <div className="space-y-4 pt-6 border-t border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold shrink-0">2</div>
              <h3 className="font-semibold text-lg text-foreground">Tạo API Key Mới</h3>
            </div>
            <p className="text-sm text-muted-foreground ml-11">
              Bấm vào nút <strong>"Create API key"</strong>. Chọn một dự án có sẵn (nếu có) hoặc tạo một dự án mới (Create API key in a new project).
            </p>
            
            <img 
              src="/images/guide/step2.png" 
              alt="Hướng dẫn bước 2" 
              className="mt-4 ml-11 rounded-lg border border-border/50 shadow-sm max-w-3xl w-full object-cover"
            />
          </div>

          {/* Bước 3 */}
          <div className="space-y-4 pt-6 border-t border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold shrink-0">3</div>
              <h3 className="font-semibold text-lg text-foreground">Sao Chép API Key</h3>
            </div>
            <p className="text-sm text-muted-foreground ml-11">
              Một cửa sổ chứa mã API Key sẽ hiện lên. Mã này thường bắt đầu bằng <code>AIzaSy...</code>. Bấm vào nút <strong>Copy</strong> để sao chép.
            </p>
            
            <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-3 rounded-lg text-xs flex gap-2 items-start mt-2 max-w-3xl ml-11">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <p>Lưu ý: Không chia sẻ mã API Key này cho bất kỳ ai để tránh việc bị sử dụng hết hạn mức hoặc phát sinh chi phí ngoài ý muốn.</p>
            </div>

            <img 
              src="/images/guide/step3.png" 
              alt="Hướng dẫn bước 3" 
              className="mt-4 ml-11 rounded-lg border border-border/50 shadow-sm max-w-3xl w-full object-cover"
            />
          </div>

          {/* Bước 4 */}
          <div className="space-y-4 pt-6 border-t border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">4</div>
              <h3 className="font-semibold text-lg text-foreground">Dán Vào Mora App</h3>
            </div>
            <p className="text-sm text-muted-foreground ml-11">
              Chuyển sang tab <strong>Cấu hình AI & Hạn mức (BYOK)</strong> và dán khóa API vào ô <strong>"Google Gemini API Key"</strong>. Bấm nút "Lưu Cấu Hình AI" để hoàn tất.
            </p>
            
            <div className="ml-11">
              <Button 
                variant="default"
                className="w-full sm:w-auto gap-2 mt-2 cursor-pointer" 
                onClick={() => navigate('?tab=ai-settings')}
              >
                <CheckCircle2 className="w-4 h-4" /> Sang Tab Cài Đặt AI
              </Button>
            </div>

            <img 
              src="/images/guide/step4.png" 
              alt="Hướng dẫn bước 4" 
              className="mt-4 ml-11 rounded-lg border border-border/50 shadow-sm max-w-3xl w-full object-cover"
            />
          </div>
        </div>
      </BorderedCard>
    </div>
  );
};
