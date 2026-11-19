import { useEffect, useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAdminAiSettings } from '@/features/admin/hooks/useAdminOperations';
import { adminApi, type AdminAiSettingsUpdate, type AiModelPrice } from '@/features/admin/services/admin-api';
import { getErrorMessage } from '@/lib/api-error';

type PriceRows = Record<string, AiModelPrice>;
const emptyPrice: AiModelPrice = { inputPerMillionUsd: 0, cachedInputPerMillionUsd: 0, outputPerMillionUsd: 0 };

export function AdminAiSettingsPage() {
  const query = useAdminAiSettings();
  const [form, setForm] = useState<AdminAiSettingsUpdate | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [benchmarkApiKey, setBenchmarkApiKey] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (query.data) setForm({ chatModel: query.data.chatModel, parserModel: query.data.parserModel, embeddingModel: query.data.embeddingModel, benchmarkJudgeModel: query.data.benchmarkJudgeModel, benchmarkJudgeEmbeddingModel: query.data.benchmarkJudgeEmbeddingModel, vndPerUsd: query.data.vndPerUsd, pricingVersion: query.data.pricingVersion, modelPrices: query.data.modelPrices }); }, [query.data]);
  if (query.isLoading || !form) return <div className="p-6 text-sm text-muted-foreground">Đang tải cấu hình AI...</div>;
  const currentSettings = query.data;
  const setPrice = (model: string, field: keyof AiModelPrice, value: number) => setForm(current => current ? { ...current, modelPrices: { ...current.modelPrices, [model]: { ...current.modelPrices[model], [field]: value } } } : current);
  const removePrice = (model: string) => setForm(current => { if (!current) return current; const prices = { ...current.modelPrices }; delete prices[model]; return { ...current, modelPrices: prices }; });
  const addPrice = () => { const name = `new-model-${Object.keys(form.modelPrices).length + 1}`; setForm({ ...form, modelPrices: { ...form.modelPrices, [name]: emptyPrice } }); };
  const renamePrice = (oldName: string, name: string) => setForm(current => { if (!current || !name || name === oldName) return current; const prices: PriceRows = { ...current.modelPrices }; const price = prices[oldName]; delete prices[oldName]; prices[name] = price; return { ...current, modelPrices: prices }; });
  const save = async () => { setSaving(true); try { const saved = await adminApi.updateAiSettings({ ...form, apiKey: apiKey || undefined, benchmarkApiKey: benchmarkApiKey || undefined }); setApiKey(''); setBenchmarkApiKey(''); setForm({ chatModel: saved.chatModel, parserModel: saved.parserModel, embeddingModel: saved.embeddingModel, benchmarkJudgeModel: saved.benchmarkJudgeModel, benchmarkJudgeEmbeddingModel: saved.benchmarkJudgeEmbeddingModel, vndPerUsd: saved.vndPerUsd, pricingVersion: saved.pricingVersion, modelPrices: saved.modelPrices }); await query.refetch(); toast.success('Đã áp dụng cấu hình AI cho request mới.'); } catch (error) { toast.error(getErrorMessage(error)); } finally { setSaving(false); } };
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <header><h1 className="type-page-title">Cài đặt AI</h1><p className="mt-1 text-sm text-muted-foreground">Thay đổi có hiệu lực với yêu cầu mới.</p></header>

      <div className="grid items-start gap-5 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Chat</CardTitle>
            <CardDescription>Hỏi đáp, xử lý PDF và tính năng ôn tập.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Field label="OpenAI API key" type="password" value={apiKey} onChange={setApiKey}
              placeholder={currentSettings?.apiKeyConfigured ? 'Để trống để giữ key hiện tại' : 'Nhập API key cho Chat'} />
            {currentSettings?.apiKeyConfigured && <p className="-mt-2 text-xs text-muted-foreground">Đã cấu hình · {currentSettings.keyFingerprint ?? '—'}</p>}
            <Field label="Model trả lời" value={form.chatModel} onChange={value => setForm({ ...form, chatModel: value })} />
            <Field label="Model phân tích PDF" value={form.parserModel} onChange={value => setForm({ ...form, parserModel: value })} />
            <Field label="Model embedding" value={form.embeddingModel} onChange={value => setForm({ ...form, embeddingModel: value })} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Benchmark</CardTitle>
            <CardDescription>Chấm và đánh giá kết quả benchmark.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Field label="OpenAI API key" type="password" value={benchmarkApiKey} onChange={setBenchmarkApiKey}
              placeholder={currentSettings?.benchmarkApiKeyConfigured ? 'Để trống để giữ key hiện tại' : 'Nhập API key cho Benchmark'} />
            {currentSettings?.benchmarkApiKeyConfigured && <p className="-mt-2 text-xs text-muted-foreground">Đã cấu hình · {currentSettings.benchmarkKeyFingerprint ?? '—'}</p>}
            <Field label="Model chấm điểm" value={form.benchmarkJudgeModel} onChange={value => setForm({ ...form, benchmarkJudgeModel: value })} />
            <Field label="Model embedding" value={form.benchmarkJudgeEmbeddingModel} onChange={value => setForm({ ...form, benchmarkJudgeEmbeddingModel: value })} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Tỷ giá và phiên bản giá</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Tỷ giá VND / USD" type="number" value={form.vndPerUsd} onChange={value => setForm({ ...form, vndPerUsd: Number(value) })} />
          <Field label="Phiên bản giá" value={form.pricingVersion} onChange={value => setForm({ ...form, pricingVersion: value })} />
        </CardContent>
      </Card>

      <Card><CardHeader><div className="flex items-center justify-between gap-3"><div><CardTitle>Bảng giá model</CardTitle><CardDescription>USD trên 1 triệu token.</CardDescription></div><Button size="sm" variant="outline" onClick={addPrice}><Plus className="size-4" />Thêm model</Button></div></CardHeader><CardContent className="space-y-3">{Object.entries(form.modelPrices).map(([model, price]) => <div key={model} className="grid gap-2 rounded-lg border p-3 md:grid-cols-[1.5fr_1fr_1fr_1fr_auto] md:items-end"><Input defaultValue={model} aria-label="Tên model" onBlur={e => renamePrice(model, e.target.value.trim())} /><PriceInput label="Input" value={price.inputPerMillionUsd} onChange={value => setPrice(model, 'inputPerMillionUsd', value)} /><PriceInput label="Cached input" value={price.cachedInputPerMillionUsd} onChange={value => setPrice(model, 'cachedInputPerMillionUsd', value)} /><PriceInput label="Output" value={price.outputPerMillionUsd} onChange={value => setPrice(model, 'outputPerMillionUsd', value)} /><Button size="icon" variant="ghost" className="text-destructive" onClick={() => removePrice(model)} aria-label={`Xóa ${model}`}><Trash2 className="size-4" /></Button></div>)}</CardContent></Card><div className="flex justify-end"><Button onClick={save} disabled={saving}>{saving ? 'Đang lưu...' : <><Save className="size-4" />Lưu và áp dụng</>}</Button></div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder }: { label: string; value: string | number; onChange: (value: string) => void; type?: string; placeholder?: string }) { return <label className="grid gap-1.5 text-sm font-medium"><span>{label}</span><Input type={type} placeholder={placeholder} autoComplete={type === 'password' ? 'new-password' : undefined} value={value} onChange={e => onChange(e.target.value)} /></label>; }
function PriceInput({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) { return <label className="grid gap-1 text-xs text-muted-foreground"><span>{label}</span><Input min="0" step="0.001" type="number" value={value} onChange={e => onChange(Number(e.target.value))} /></label>; }
