import { fmtMart } from "@/lib/catalog";
import { MartMark } from "./icons";

export function Price({ value, className = "" }: { value: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 font-display font-bold tabular-nums ${className}`}>
      <MartMark />
      {fmtMart(value)}
      <span className="sr-only"> MART coins</span>
    </span>
  );
}
