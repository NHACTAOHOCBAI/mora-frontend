import type { PlanTier } from './services/billing-api';

export type PlanVisual = { label: string; order: string; cardClass: string; borderClass: string; stripeClass: string; dotClass: string; accentClass: string; description: string };

export const planVisuals: Record<PlanTier, PlanVisual> = {
  FREE: { label: 'Miễn phí', order: '01', cardClass: 'bg-card', borderClass: 'border-slate-300/70 dark:border-slate-600', stripeClass: 'bg-slate-500', dotClass: 'bg-slate-500', accentClass: 'text-slate-700 dark:text-slate-300', description: 'Bắt đầu tổ chức việc học cùng Mora.' },
  PRO: { label: 'Pro', order: '02', cardClass: 'bg-card', borderClass: 'border-violet-300/70 dark:border-violet-700', stripeClass: 'bg-violet-500', dotClass: 'bg-violet-500', accentClass: 'text-violet-700 dark:text-violet-300', description: 'Dành cho nhịp học sâu và đều đặn.' },
  TEAM: { label: 'Team', order: '03', cardClass: 'bg-card', borderClass: 'border-teal-300/70 dark:border-teal-700', stripeClass: 'bg-teal-500', dotClass: 'bg-teal-500', accentClass: 'text-teal-700 dark:text-teal-300', description: 'Cộng tác cùng nhóm trên nhiều học liệu.' },
};
