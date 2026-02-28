import { ReactNode } from "react";

interface TierRowProps {
  tier: string;
  children: ReactNode;
}

const tierColors: Record<string, string> = {
  S: "bg-tier-s/20 border-tier-s text-tier-s",
  A: "bg-tier-a/20 border-tier-a text-tier-a",
  B: "bg-tier-b/20 border-tier-b text-tier-b",
  C: "bg-tier-c/20 border-tier-c text-tier-c",
  D: "bg-tier-d/20 border-tier-d text-tier-d",
  F: "bg-tier-f/20 border-tier-f text-tier-f",
};

const tierBg: Record<string, string> = {
  S: "bg-tier-s",
  A: "bg-tier-a",
  B: "bg-tier-b",
  C: "bg-tier-c",
  D: "bg-tier-d",
  F: "bg-tier-f",
};

export default function TierRow({ tier, children }: TierRowProps) {
  return (
    <div className={`flex border rounded-xl overflow-hidden ${tierColors[tier] || "border-border"}`}>
      <div className={`flex items-center justify-center w-16 shrink-0 ${tierBg[tier]} text-primary-foreground`}>
        <span className="font-display text-2xl font-bold">{tier}</span>
      </div>
      <div className="flex-1 p-3 flex flex-wrap gap-2 min-h-[80px] items-center">
        {children}
      </div>
    </div>
  );
}
