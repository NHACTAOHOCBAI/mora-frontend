import { Crown, Edit3, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SpaceRole } from "../types";
import { ROLE_DETAILS } from "../utils/member-management";

interface MemberRoleSelectProps {
  value: SpaceRole;
  onChange: (role: "EDITOR" | "VIEWER") => void;
  label: string;
  disabled?: boolean;
}
export function MemberRoleSelect({
  value,
  onChange,
  label,
  disabled,
}: MemberRoleSelectProps) {
  return (
    <Select
      value={value}
      disabled={disabled}
      onValueChange={(next) => {
        if (next === "EDITOR" || next === "VIEWER") onChange(next);
      }}
    >
      <SelectTrigger aria-label={label} className="min-w-36 h-9">
        <SelectValue>{ROLE_DETAILS[value].label}</SelectValue>
      </SelectTrigger>
      <SelectContent
        alignItemWithTrigger={false}
        className="w-72 max-w-[calc(100vw-3rem)]"
      >
        {(["EDITOR", "VIEWER"] as const).map((role) => (
          <SelectItem key={role} value={role} className="py-2">
            <span className="flex flex-col gap-1">
              <span className="font-medium">{ROLE_DETAILS[role].label}</span>
              <span className="text-xs text-muted-foreground whitespace-normal">
                {ROLE_DETAILS[role].description}
              </span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
export function MemberRoleBadge({ role }: { role: SpaceRole }) {
  const Icon = role === "OWNER" ? Crown : role === "EDITOR" ? Edit3 : Eye;
  return (
    <Badge variant="outline" className="gap-1.5 font-normal whitespace-nowrap">
      <Icon className="size-3" />
      {ROLE_DETAILS[role].label}
    </Badge>
  );
}

interface MemberRoleChoicesProps {
  value: "EDITOR" | "VIEWER";
  onChange: (value: "EDITOR" | "VIEWER") => void;
  name: string;
  disabled?: boolean;
}
export function MemberRoleChoices({
  value,
  onChange,
  name,
  disabled,
}: MemberRoleChoicesProps) {
  return (
    <fieldset className="space-y-2" disabled={disabled}>
      <legend className="text-sm font-medium mb-2">Quyền khi tham gia</legend>
      {(["EDITOR", "VIEWER"] as const).map((role) => (
        <label
          key={role}
          className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${value === role ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"}`}
        >
          <input
            type="radio"
            name={name}
            value={role}
            checked={value === role}
            onChange={() => onChange(role)}
            className="mt-1 accent-current"
          />
          <span>
            <span className="block text-sm font-medium">
              {ROLE_DETAILS[role].label}
            </span>
            <span className="block text-xs text-muted-foreground leading-5 mt-0.5">
              {ROLE_DETAILS[role].description}
            </span>
          </span>
        </label>
      ))}
    </fieldset>
  );
}
