import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { benchmarkApi } from '../services/benchmark-api';
import type { QueryParams } from '@/types/query';

export const useBenchmarkQuestionsQuery = (params: QueryParams) => {
  return useQuery({
    queryKey: ['benchmarkQuestions', params],
    queryFn: () => benchmarkApi.getQuestions(params),
  });
};

export const useBenchmarkHistoryQuery = (params: QueryParams) => {
  return useQuery({
    queryKey: ['benchmarkHistory', params],
    queryFn: () => benchmarkApi.getHistory(params),
  });
};

export const useAdminBenchmarks = () => {
  const queryClient = useQueryClient();

  const createQuestionMutation = useMutation({
    mutationFn: (data: { question: string; groundTruth: string }) =>
      benchmarkApi.createQuestion(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['benchmarkQuestions'] });
    },
  });

  const updateQuestionMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { question: string; groundTruth: string } }) =>
      benchmarkApi.updateQuestion(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['benchmarkQuestions'] });
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: (id: number) => benchmarkApi.deleteQuestion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['benchmarkQuestions'] });
    },
  });

  const runBenchmarkMutation = useMutation({
    mutationFn: (data: { approachName: string }) => benchmarkApi.runBenchmark(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['benchmarkHistory'] });
    },
  });

  const deleteRunMutation = useMutation({
    mutationFn: (id: number) => benchmarkApi.deleteRun(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['benchmarkHistory'] });
    },
  });

  return {
    createQuestion: createQuestionMutation.mutateAsync,
    isCreatingQuestion: createQuestionMutation.isPending,
    
    updateQuestion: updateQuestionMutation.mutateAsync,
    isUpdatingQuestion: updateQuestionMutation.isPending,
    
    deleteQuestion: deleteQuestionMutation.mutateAsync,
    isDeletingQuestion: deleteQuestionMutation.isPending,

    runBenchmark: runBenchmarkMutation.mutateAsync,
    isRunningBenchmark: runBenchmarkMutation.isPending,

    deleteRun: deleteRunMutation.mutateAsync,
    isDeletingRun: deleteRunMutation.isPending,
  };
};
