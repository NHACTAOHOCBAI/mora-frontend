import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Chữ cái đầu của hai phần cuối trong họ tên; giữ nguyên dấu tiếng Việt. */
export const toAlias = (name?: string | null) => {
  const value = name?.trim() || "";
  if (!value) return "?";
  if (value.includes("@")) return value.split("@")[0].slice(0, 2).toLocaleUpperCase("vi");
  return value.split(/\s+/).slice(-2)
    .map(part => Array.from(part)[0]).join("").toLocaleUpperCase("vi");
};

/** Format ngày giờ đầy đủ theo locale vi-VN */
export const formatDateTime = (iso: string) =>
  new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(iso));
