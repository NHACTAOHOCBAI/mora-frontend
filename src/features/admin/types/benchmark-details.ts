export interface CalculationDetails { version: number; complete: boolean; durationMs?: number }
export interface SourceContext { text: string; documentId?: number; documentName?: string; pageNumber: number }
export interface PrecisionDetails extends CalculationDetails {
  rows: { rank: number; context: SourceContext; verdict: number; reason: string; cumulativeRelevant: number; precisionAtK: number; contribution: number }[];
  expectedContexts: number; relevantCount: number; numerator: number; epsilon: number; denominator: number;
}
export interface FaithfulnessDetails extends CalculationDetails {
  generatedStatements: string[];
  statements: { statement: string; reason: string; verdict: number }[];
  supportedCount: number; statementCount: number;
}
export interface RelevanceDetails extends CalculationDetails {
  rows: { question: string; noncommittal: number; used: boolean; dotProduct: number | null; generatedNorm: number | null; cosine: number | null }[];
  originalNorm: number | null; usedCount: number; meanCosine: number | null; substantiveFactor: number;
}
export interface CitationDetails extends CalculationDetails {
  expectedSources: { documentCode: string; pageNumber: number }[];
  rows: { documentId: number; documentCode: string; pageNumber: number; correct: boolean }[];
  matchedCount: number; predictedCount: number;
}
export interface LatencyDetails extends CalculationDetails {
  totalMs?: number; routerMs?: number; retrievalMs?: number; synthesisMs?: number; evaluatorMs?: number;
  componentSumMs?: number; overheadMs?: number;
}
export interface BenchmarkMetric<T extends CalculationDetails> {
  value: number | null; status: 'ok' | 'error' | 'not_applicable'; reason?: string | null; details?: T;
}
export interface BenchmarkMetrics {
  contextPrecision?: BenchmarkMetric<PrecisionDetails>;
  faithfulness?: BenchmarkMetric<FaithfulnessDetails>;
  answerRelevance?: BenchmarkMetric<RelevanceDetails>;
  citationAccuracy?: BenchmarkMetric<CitationDetails>;
  latency?: BenchmarkMetric<LatencyDetails>;
}
export interface BenchmarkTrace {
  response?: { answer?: string };
  pipeline?: { timings?: { totalMs?: number } };
}
