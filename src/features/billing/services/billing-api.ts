import { apiClient } from '@/services/api-client';
import type { ApiResponse } from '@/features/chat/types';

export type PlanTier = 'FREE' | 'PRO' | 'TEAM';
export interface Plan { code: PlanTier; name: string; maxOwnedSpaces: number; tokenLimit: number; }
export interface Entitlement extends Plan {
  plan: PlanTier; planName: string; tokensUsed: number; tokensRemaining: number;
  ownedSpaces: number; periodStartedAt: string; periodEndsAt: string; scheduledPlan?: PlanTier;
}
export const billingApi = {
  entitlement: async () => (await apiClient.get<ApiResponse<Entitlement>>('/billing/entitlement')).data.result,
  plans: async () => (await apiClient.get<ApiResponse<Plan[]>>('/billing/plans')).data.result,
  changePlan: async (plan: PlanTier) => (await apiClient.post<ApiResponse<Entitlement>>('/billing/plan-change', { plan })).data.result,
};
