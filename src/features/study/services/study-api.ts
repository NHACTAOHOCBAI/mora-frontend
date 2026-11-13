import { apiClient } from '@/services/api-client';
import type { ApiResponse } from '@/features/chat/types';

export type Citation = { documentId: number; documentName: string; pageNumber: number; quote: string };
export type StudySet = { id: number; spaceId: number; title: string; createdByName?: string; createdAt: string; sourceDocuments: {id:number;name:string}[]; flashcards: {id:number;front:string;back:string;citation:Citation}[]; quizQuestions: {id:number;question:string;options:string[];citation:Citation}[] };
export type QuizGrade = { score:number; total:number; results:{questionId:number;correct:boolean;correctOptionIndex:number;explanation:string;citation:Citation}[] };
export const getStudySets = async (spaceId:number) => (await apiClient.get<ApiResponse<StudySet[]>>(`/spaces/${spaceId}/study-sets`)).data.result;
export const createStudySet = async (spaceId:number, documentIds:number[], cardCount:number) => (await apiClient.post<ApiResponse<StudySet>>(`/spaces/${spaceId}/study-sets`, {documentIds, cardCount})).data.result;
export const deleteStudySet = async (id:number) => { await apiClient.delete(`/study-sets/${id}`); };
export const gradeQuiz = async (id:number, answers:{questionId:number;selectedOptionIndex:number}[]) => (await apiClient.post<ApiResponse<QuizGrade>>(`/study-sets/${id}/quiz/grade`, {answers})).data.result;
