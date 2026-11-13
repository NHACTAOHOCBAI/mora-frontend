import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createStudySet, deleteStudySet, getStudySets, gradeQuiz } from '../services/study-api';
export const useStudySets = (spaceId:number) => useQuery({queryKey:['study-sets',spaceId],queryFn:()=>getStudySets(spaceId),enabled:spaceId>0});
export const useCreateStudySet = () => { const qc=useQueryClient(); return useMutation({mutationFn:({spaceId,documentIds,cardCount}:{spaceId:number;documentIds:number[];cardCount:number})=>createStudySet(spaceId,documentIds,cardCount),onSuccess:(_,v)=>qc.invalidateQueries({queryKey:['study-sets',v.spaceId]})}); };
export const useDeleteStudySet = () => { const qc=useQueryClient(); return useMutation({mutationFn:deleteStudySet,onSuccess:()=>qc.invalidateQueries({queryKey:['study-sets']})}); };
export const useGradeQuiz = () => useMutation({mutationFn:({id,answers}:{id:number;answers:{questionId:number;selectedOptionIndex:number}[]})=>gradeQuiz(id,answers)});
