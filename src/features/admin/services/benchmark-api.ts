import { apiClient } from '@/services/api-client';
import type { QueryParams } from '@/types/query';
import type { ApiResponse } from '@/features/chat/types';
import type { PageResponse } from './admin-api';

export interface BenchmarkQuestion {
  id: number;
  question: string;
  groundTruth: string;
  createdAt: string;
  updatedAt: string;
}

export interface BenchmarkDetail {
  id: number;
  question: string;
  retrievedContexts: string;
  generatedAnswer: string;
  latencyMs: number;
  faithfulness: number;
  answerRelevance: number;
  contextPrecision: number;
  contextRecall: number;
}

export interface BenchmarkRun {
  id: number;
  approachName: string;
  ragasFaithfulness: number;
  ragasAnswerRelevance: number;
  ragasContextPrecision: number;
  ragasContextRecall: number;
  avgLatencyMs: number;
  runAt: string;
  details?: BenchmarkDetail[];
}

export const benchmarkApi = {
  getQuestions: async (params?: QueryParams): Promise<PageResponse<BenchmarkQuestion>> => {
    const response = await apiClient.get<ApiResponse<PageResponse<BenchmarkQuestion>>>('/benchmark-questions', { params });
    return response.data.result;
  },

  createQuestion: async (data: { question: string; groundTruth: string }): Promise<BenchmarkQuestion> => {
    const response = await apiClient.post<ApiResponse<BenchmarkQuestion>>('/benchmark-questions', data);
    return response.data.result;
  },

  updateQuestion: async (id: number, data: { question: string; groundTruth: string }): Promise<BenchmarkQuestion> => {
    const response = await apiClient.put<ApiResponse<BenchmarkQuestion>>(`/benchmark-questions/${id}`, data);
    return response.data.result;
  },

  deleteQuestion: async (id: number): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(`/benchmark-questions/${id}`);
  },

  getHistory: async (params?: QueryParams): Promise<PageResponse<BenchmarkRun>> => {
    const response = await apiClient.get<ApiResponse<PageResponse<BenchmarkRun>>>('/benchmarks/history', { params });
    return response.data.result;
  },

  getRunDetails: async (id: number | string): Promise<BenchmarkRun> => {
    const response = await apiClient.get<ApiResponse<BenchmarkRun>>(`/benchmarks/history/${id}`);
    return response.data.result;
  },

  runBenchmark: async (data: { approachName: string }): Promise<BenchmarkRun> => {
    const response = await apiClient.post<ApiResponse<BenchmarkRun>>('/benchmarks/run', data);
    return response.data.result;
  },

  deleteRun: async (id: number): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(`/benchmarks/history/${id}`);
  },
};
