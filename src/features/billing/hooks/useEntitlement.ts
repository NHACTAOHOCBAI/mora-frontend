import { useQuery } from '@tanstack/react-query';
import { billingApi } from '../services/billing-api';
export const useEntitlement = (enabled = true) => useQuery({ queryKey: ['billing-entitlement'], queryFn: billingApi.entitlement, enabled });
