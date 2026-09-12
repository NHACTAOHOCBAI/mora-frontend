import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Sparkles, 
  ExternalLink, 
  Eye, 
  EyeOff, 
  Save, 
  Loader2, 
  Gauge, 
  Zap, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRightLeft,
  Bot
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BorderedCard } from '@/components/shared/BorderedCard';
import { useAiSettings, useUpdateAiSettings, useTestApiKey, useDailyQuota } from '../hooks/useAiSettings';
import { toast } from 'sonner';

export const AiSettingsTab: React.FC = () => {
  const { data: settings, isLoading: isSettingsLoading } = useAiSettings();
  const { data: quotas, isLoading: isQuotaLoading, refetch: refetchQuota } = useDailyQuota();
  const updateSettingsMutation = useUpdateAiSettings();
  const testApiKeyMutation = useTestApiKey();

  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [chatModel, setChatModel] = useState('gemini-3.5-flash-lite');
  const [routerModel, setRouterModel] = useState('gemini-3.1-flash-lite');
  const [evaluatorModel, setEvaluatorModel] = useState('gemini-3.1-flash-lite');
  const [parserModel, setParserModel] = useState('gemini-3.5-flash-lite');
  const [summarizerModel, setSummarizerModel] = useState('gemini-3.1-flash-lite');
  const [testResult, setTestResult] = useState<{ valid: boolean; message: string } | null>(null);

  useEffect(() => {
    if (settings) {
      if (settings.hasApiKey) {
        setApiKey(settings.maskedApiKey);
      }
      if (settings.chatModel) setChatModel(settings.chatModel);
      if (settings.routerModel) setRouterModel(settings.routerModel);
      if (settings.evaluatorModel) setEvaluatorModel(settings.evaluatorModel);
      if (settings.parserModel) setParserModel(settings.parserModel);
      if (settings.summarizerModel) setSummarizerModel(settings.summarizerModel);
    }
  }, [settings]);

  // Áp dụng Preset
  const handleApplyPreset = (type: 'cost' | 'balanced' | 'quality') => {
    if (type === 'cost') {
      setChatModel('gemini-3.1-flash-lite');
      setRouterModel('gemini-3.1-flash-lite');
      setEvaluatorModel('gemini-3.1-flash-lite');
      setParserModel('gemini-3.5-flash-lite');
      setSummarizerModel('gemini-3.1-flash-lite');
      toast.info('Đã chọn cấu hình: Tiết kiệm hạn mức tối đa (500 lượt/ngày)');
    } else if (type === 'balanced') {
      setChatModel('gemini-3.5-flash-lite');
      setRouterModel('gemini-3.1-flash-lite');
      setEvaluatorModel('gemini-3.1-flash-lite');
      setParserModel('gemini-3.5-flash-lite');
      setSummarizerModel('gemini-3.1-flash-lite');
      toast.info('Đã chọn cấu hình: Cân bằng Flash Lite (500 lượt/ngày - Khuyên dùng)');
    } else if (type === 'quality') {
      setChatModel('gemini-3.7-flash');
      setRouterModel('gemini-3.1-flash-lite');
      setEvaluatorModel('gemini-3.1-flash-lite');
      setParserModel('gemini-3.5-flash-lite');
      setSummarizerModel('gemini-3.1-flash-lite');
      toast.info('Đã chọn cấu hình: Chất lượng cao nhất (Gemini 3.7 Flash - 20 lượt/ngày)');
    }
  };

  // Test API Key
  const handleTestKey = () => {
    if (!apiKey.trim()) {
      toast.error('Vui lòng nhập API Key trước khi kiểm tra');
      return;
    }
    if (apiKey.includes('****')) {
      toast.info('API Key hiện tại đã được lưu và đang hoạt động.');
      return;
    }

    testApiKeyMutation.mutate(
      { apiKey: apiKey.trim(), modelName: chatModel },
      {
        onSuccess: (res) => {
          setTestResult(res);
          if (res.valid) {
            toast.success('Kiểm tra thành công: API Key hợp lệ!');
          } else {
            toast.error(res.message);
          }
        },
        onError: (err: any) => {
          const msg = err.response?.data?.message || err.message;
          setTestResult({ valid: false, message: msg });
          toast.error(`Kiểm tra thất bại: ${msg}`);
        },
      }
    );
  };

  // Lưu cấu hình
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      toast.error('Gemini API Key không được để trống');
      return;
    }

    updateSettingsMutation.mutate(
      {
        geminiApiKey: apiKey.trim(),
        chatModel,
        routerModel,
        evaluatorModel,
        parserModel,
        summarizerModel,
      },
      {
        onSuccess: () => {
          toast.success('Cập nhật cấu hình AI thành công!');
          refetchQuota();
        },
        onError: (err: any) => {
          const msg = err.response?.data?.message || err.message;
          toast.error(`Cập nhật thất bại: ${msg}`);
        },
      }
    );
  };

  if (isSettingsLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 1. Phần cấu hình API Key & Models */}
      <BorderedCard
        title={
          <div className="flex items-center gap-2">
            <span>Cấu Hình Gemini API Key (BYOK)</span>
            {settings?.hasApiKey ? (
              <span className="text-xs bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Đã kích hoạt
              </span>
            ) : (
              <span className="text-xs bg-destructive/10 text-destructive border border-destructive/20 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Chưa nhập Key
              </span>
            )}
          </div>
        }
        description="Nhập API Key cá nhân từ Google AI Studio để không bị giới hạn tốc độ và chủ động chọn model cho từng Agent."
        icon={<Key className="w-5 h-5 text-primary" />}
        action={
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline px-3 py-1.5 bg-muted/60 hover:bg-muted rounded-lg border border-border transition-colors cursor-pointer"
          >
            Lấy Key tại Google AI Studio <ExternalLink className="w-3.5 h-3.5" />
          </a>
        }
      >
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* Ô nhập API Key */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground flex items-center justify-between">
              <span>Google Gemini API Key</span>
              <span className="text-xs text-muted-foreground font-normal">Bắt đầu bằng `AIzaSy...`</span>
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showKey ? 'text' : 'password'}
                  placeholder="Dán mã Gemini API Key của bạn vào đây..."
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setTestResult(null);
                  }}
                  className="pr-10 font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleTestKey}
                disabled={testApiKeyMutation.isPending || !apiKey.trim()}
                className="shrink-0 cursor-pointer flex items-center gap-1.5"
              >
                {testApiKeyMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-primary" />
                )}
                Kiểm tra kết nối
              </Button>
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  testResult.valid
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                    : 'bg-destructive/10 border-destructive/30 text-destructive'
                }`}
              >
                {testResult.valid ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>

          {/* Preset Buttons */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Chọn cấu hình mẫu nhanh (Presets)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleApplyPreset('cost')}
                className="p-3.5 rounded-xl border border-border bg-card hover:bg-muted/40 text-left transition-all cursor-pointer flex flex-col justify-between space-y-1 hover:border-primary/40"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-500" /> Tiết kiệm tối đa
                  </span>
                  <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono font-medium">500 RPD</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Toàn bộ Flash-Lite siêu nhanh, hạn mức ngày lớn nhất (500 lượt).
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('balanced')}
                className="p-3.5 rounded-xl border border-primary/40 bg-primary/5 hover:bg-primary/10 text-left transition-all cursor-pointer flex flex-col justify-between space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-primary" /> Cân bằng (Khuyên dùng)
                  </span>
                  <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-mono font-medium">500 RPD</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Flash-Lite 3.5 cho Chat & Flash-Lite 3.1 cho Router/QC.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('quality')}
                className="p-3.5 rounded-xl border border-border bg-card hover:bg-muted/40 text-left transition-all cursor-pointer flex flex-col justify-between space-y-1 hover:border-primary/40"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <Bot className="w-4 h-4 text-purple-500" /> Chất lượng cao nhất
                  </span>
                  <span className="text-[10px] bg-purple-500/10 text-purple-600 px-1.5 py-0.5 rounded font-mono font-medium">20 RPD</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Gemini 3.7 Flash lập luận thông minh vượt bậc (20 lượt).
                </p>
              </button>
            </div>
          </div>

          {/* Model Selection per Agent */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h4 className="text-sm font-bold text-foreground">
              Tùy Chọn Model Cho Từng Vai Trò Agent
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Chat & Synthesis Agent */}
              <div className="space-y-1.5 p-4 rounded-xl border border-border bg-muted/20">
                <label className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span>🤖 Trợ lý Chat Chính (Synthesis Agent)</span>
                  <span className="text-[11px] text-muted-foreground font-normal">Trả lời câu hỏi & RAG</span>
                </label>
                <select
                  value={chatModel}
                  onChange={(e) => setChatModel(e.target.value)}
                  className="w-full bg-card border border-border text-foreground text-sm rounded-lg px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-primary font-medium"
                >
                  <option value="gemini-3.5-flash-lite">Gemini 3.5 Flash Lite (500 lượt/ngày - Khuyên dùng)</option>
                  <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (500 lượt/ngày - Siêu tốc)</option>
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash (20 lượt/ngày - Chuẩn)</option>
                  <option value="gemini-3.7-flash">Gemini 3.7 Flash (20 lượt/ngày - Suy luận mới nhất)</option>
                  <option value="gemini-3.5-flash">Gemini 3.5 Flash (20 lượt/ngày - Lập luận cao cấp)</option>
                  <option value="gemini-2.5-pro">Gemini 2.5 Pro (20 lượt/ngày - Học thuật chuyên sâu)</option>
                </select>
              </div>

              {/* Router Agent */}
              <div className="space-y-1.5 p-4 rounded-xl border border-border bg-muted/20">
                <label className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span>🔀 Định Tuyến Ý Định (Router Agent)</span>
                  <span className="text-[11px] text-muted-foreground font-normal">Phân loại RAG hay General</span>
                </label>
                <select
                  value={routerModel}
                  onChange={(e) => setRouterModel(e.target.value)}
                  className="w-full bg-card border border-border text-foreground text-sm rounded-lg px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-primary font-medium"
                >
                  <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (Khuyên dùng - 500 lượt/ngày)</option>
                  <option value="gemini-3.5-flash-lite">Gemini 3.5 Flash Lite (500 lượt/ngày)</option>
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash (20 lượt/ngày)</option>
                </select>
              </div>

              {/* QC Evaluator Agent */}
              <div className="space-y-1.5 p-4 rounded-xl border border-border bg-muted/20">
                <label className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span>⚖️ Kiểm Định Chất Lượng (QC Evaluator)</span>
                  <span className="text-[11px] text-muted-foreground font-normal">Chống ảo giác (Hallucination)</span>
                </label>
                <select
                  value={evaluatorModel}
                  onChange={(e) => setEvaluatorModel(e.target.value)}
                  className="w-full bg-card border border-border text-foreground text-sm rounded-lg px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-primary font-medium"
                >
                  <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (Khuyên dùng - 500 lượt/ngày)</option>
                  <option value="gemini-3.5-flash-lite">Gemini 3.5 Flash Lite (500 lượt/ngày)</option>
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash (20 lượt/ngày)</option>
                </select>
              </div>

              {/* PDF Parser Agent */}
              <div className="space-y-1.5 p-4 rounded-xl border border-border bg-muted/20">
                <label className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span>📄 Trích Xuất Sơ Đồ PDF (Vision Parser)</span>
                  <span className="text-[11px] text-muted-foreground font-normal">Đọc biểu đồ & ảnh PDF</span>
                </label>
                <select
                  value={parserModel}
                  onChange={(e) => setParserModel(e.target.value)}
                  className="w-full bg-card border border-border text-foreground text-sm rounded-lg px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-primary font-medium"
                >
                  <option value="gemini-3.5-flash-lite">Gemini 3.5 Flash Lite (Khuyên dùng Vision - 500 lượt/ngày)</option>
                  <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (500 lượt/ngày)</option>
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash (20 lượt/ngày)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={updateSettingsMutation.isPending}
              className="cursor-pointer flex items-center gap-2 px-6"
            >
              {updateSettingsMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Lưu Cấu Hình AI
            </Button>
          </div>
        </form>
      </BorderedCard>

      {/* 2. Phần theo dõi hạn mức sử dụng (Daily Quota Monitor) */}
      <BorderedCard
        title="Theo Dõi Hạn Mức Sử Dụng Hôm Nay (Daily Quota Monitor)"
        description="Cập nhật số lượt gọi thực tế theo hạn mức Free Tier của Google AI Studio (RPD)."
        icon={<Gauge className="w-5 h-5 text-primary" />}
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchQuota()}
            disabled={isQuotaLoading}
            className="cursor-pointer text-xs"
          >
            Làm mới
          </Button>
        }
      >
        <div className="space-y-4">
          {quotas && quotas.length > 0 ? (
            <div className="space-y-3">
              {quotas.map((quota) => {
                const isDanger = quota.status === 'DANGER';
                const isWarning = quota.status === 'WARNING';
                const barColor = isDanger 
                  ? 'bg-destructive' 
                  : isWarning 
                    ? 'bg-amber-500' 
                    : 'bg-emerald-500';

                return (
                  <div
                    key={quota.modelName}
                    className={`p-4 rounded-xl border transition-all ${
                      isDanger
                        ? 'bg-destructive/5 border-destructive/30'
                        : isWarning
                          ? 'bg-amber-500/5 border-amber-500/20'
                          : 'bg-muted/20 border-border'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-foreground">
                            {quota.displayName}
                          </span>
                          <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-md bg-muted font-medium">
                            {quota.agentRole}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {quota.recommendation}
                        </p>
                      </div>

                      <div className="text-right shrink-0 flex items-center sm:flex-col sm:items-end justify-between gap-1">
                        <span className="text-sm font-bold font-mono text-foreground">
                          {quota.todayRequests} / {quota.dailyLimit} lượt
                        </span>
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            isDanger
                              ? 'bg-destructive/10 text-destructive'
                              : isWarning
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {quota.usagePercent}%
                        </span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-muted/60 rounded-full h-2 mt-3 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${barColor}`}
                        style={{ width: `${Math.max(quota.usagePercent, 2)}%` }}
                      />
                    </div>

                    {/* Nút chuyển đổi nhanh nếu chạm ngưỡng đỏ */}
                    {isDanger && (
                      <div className="mt-3 pt-3 border-t border-destructive/20 flex items-center justify-between text-xs">
                        <span className="text-destructive font-medium flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Model sắp hết lượt gọi trong ngày!
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setChatModel('gemini-3.1-flash-lite');
                            toast.info('Đã gán Gemini 3.1 Flash Lite cho Chat Chính. Hãy nhấn "Lưu Cấu Hình AI" ở trên.');
                          }}
                          className="h-7 text-xs border-destructive/40 hover:bg-destructive/10 text-destructive cursor-pointer flex items-center gap-1"
                        >
                          <ArrowRightLeft className="w-3 h-3" /> Đổi Chat sang Flash Lite (1,500 RPD)
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Chưa có dữ liệu thống kê sử dụng hôm nay.
            </div>
          )}
        </div>
      </BorderedCard>
    </div>
  );
};
