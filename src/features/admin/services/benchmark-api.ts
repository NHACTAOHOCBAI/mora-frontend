import { apiClient } from '@/services/api-client';

export interface Source { documentCode: string; pageNumber: number }
export interface BenchmarkQuestion {
  id: number; code: string; type: 'DIRECT' | 'SYNTHESIS' | 'VISUAL'; question: string;
  referenceAnswer: string; explanation: string; sources: Source[]; approved: boolean;
}
export interface BenchmarkDocument {
  code: string; fileName: string; sha256: string; pageCount: number;
  documentId: number | null; status: string; storageUrl: string;
}
export interface BenchmarkDataset {
  id: number; name: string; description: string; spaceId: number;
  documents: BenchmarkDocument[]; questions: BenchmarkQuestion[];
}
export interface DatasetRow { id: number; name: string; spaceId: number }
export interface BenchmarkRun {
  id: number; datasetId: number; status: string; smoke: boolean; createdAt: string;
  snapshotJson: string; configJson: string;
}
export interface MetricSummary { mean: number | null; median?: number; p95?: number; valid: number; errors: number; missing: number; notApplicable: number }
export interface GroupSummary {
  total: number; completed: number; errors: number; traced: number; fallbackRate: number | null; rerankRate: number | null;
  contextPrecision: MetricSummary; faithfulness: MetricSummary; answerRelevance: MetricSummary;
  citationAccuracy: MetricSummary; latency: MetricSummary;
}
export interface BenchmarkSample {
  id: number; questionCode: string; questionType: string; repetition: number; status: string;
  traceJson: string | null; metricsJson: string | null; error: string | null;
}
export interface RunDetail { run: BenchmarkRun; samples: BenchmarkSample[]; summary: Record<string, GroupSummary> }
const root = '/admin/benchmarks';
async function get<T>(path: string): Promise<T> { return (await apiClient.get<{ result: T }>(root + path)).data.result; }
async function post<T>(path: string, body: unknown = {}): Promise<T> { return (await apiClient.post<{ result: T }>(root + path, body)).data.result; }
export const benchmarkApi = {
  datasets: () => get<DatasetRow[]>('/datasets'),
  dataset: (id: number) => get<BenchmarkDataset>(`/datasets/${id}`),
  importDataset: (data: unknown) => post<DatasetRow>('/datasets', data),
  saveQuestion: async (id: number, question: BenchmarkQuestion) => {
    await apiClient.put(root + `/datasets/${id}/questions/${question.id}`, question);
  },
  approve: (id: number, q: BenchmarkQuestion) => post(`/datasets/${id}/questions/${q.id}/approval`, { approved: !q.approved }),
  upload: async (id: number, code: string, file: File) => {
    const form = new FormData(); form.append('file', file);
    await apiClient.post(root + `/datasets/${id}/documents/${code}`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  runs: () => get<BenchmarkRun[]>('/runs'),
  run: (id: number) => get<RunDetail>(`/runs/${id}`),
  start: (id: number, smoke: boolean) => post<BenchmarkRun>(`/datasets/${id}/runs`, { smoke }),
  resume: (id: number) => post(`/runs/${id}/resume`),
  retryJudge: (id: number) => post(`/runs/${id}/retry-judge`),
  download: async (path: string, filename: string) => {
    const response = await apiClient.get(root + path, { responseType: 'blob' });
    const url = URL.createObjectURL(response.data); const link = document.createElement('a');
    link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url);
  },
};
