import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

interface PasswordRecoveryCardProps {
  title: string;
  description: string;
  children: ReactNode;
  icon?: ReactNode;
}
export const PasswordRecoveryCard = ({ title, description, children, icon }: PasswordRecoveryCardProps) => (
  <div className="flex w-full min-w-0 flex-1 items-center justify-center bg-muted/20 px-4 py-8 sm:p-8">
    <Card className="mx-auto w-full max-w-md gap-6 rounded-2xl p-6 sm:p-8">
      <div className="flex flex-col items-center gap-4 text-center">
        {icon && <span aria-hidden="true" className="inline-flex size-12 shrink-0 items-center justify-center rounded-full border border-border bg-muted/60 text-foreground [&_svg]:size-6 [&_svg]:stroke-[1.75]">{icon}</span>}
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </Card>
  </div>
);
