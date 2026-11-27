import type { SVGProps } from "react";

const base = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;
type P = SVGProps<SVGSVGElement>;

export const Bag = (p: P) => (<svg {...base} {...p}><path d="M6 8h12l1 12H5L6 8z" /><path d="M9 8V7a3 3 0 0 1 6 0v1" /></svg>);
export const Wallet = (p: P) => (<svg {...base} {...p}><path d="M3 7a2 2 0 0 1 2-2h12v4" /><path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H5a2 2 0 0 1-2-2z" /><circle cx="16.5" cy="14" r="1" fill="currentColor" /></svg>);
export const Check = (p: P) => (<svg {...base} {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>);
export const X = (p: P) => (<svg {...base} {...p}><path d="M6 6l12 12M18 6L6 18" /></svg>);
export const Plus = (p: P) => (<svg {...base} {...p}><path d="M12 5v14M5 12h14" /></svg>);
export const Minus = (p: P) => (<svg {...base} {...p}><path d="M5 12h14" /></svg>);
export const Arrow = (p: P) => (<svg {...base} {...p}><path d="M5 12h14M13 6l6 6-6 6" /></svg>);
export const Star = (p: P) => (<svg {...base} fill="currentColor" stroke="none" {...p}><path d="M12 2.5l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 17.5l-5.9 3.2 1.2-6.6L2.5 9.5l6.6-.9L12 2.5z" /></svg>);
export const Copy = (p: P) => (<svg {...base} {...p}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h9" /></svg>);
export const Cube = (p: P) => (<svg {...base} {...p}><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" /><path d="M4 7.5l8 4.5 8-4.5M12 12v9" /></svg>);
export const Trash = (p: P) => (<svg {...base} {...p}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>);
export const Drop = (p: P) => (<svg {...base} {...p}><path d="M12 3s6 6.2 6 11a6 6 0 0 1-12 0c0-4.800 6-11 6-11z" /></svg>);

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-display text-[1.35rem] font-extrabold tracking-tight ${className}`}>
      <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-green text-white">
        <Cube width={18} height={18} strokeWidth={2.2} />
      </span>
      blockmart
    </span>
  );
}

export function MartMark({ className = "" }: { className?: string }) {
  return (
    <span aria-hidden className={`inline-grid place-items-center rounded-full bg-sun font-display font-extrabold text-ink ${className}`} style={{ width: "1.15em", height: "1.15em", fontSize: "0.82em" }}>
      <span style={{ fontSize: "0.72em" }}>M</span>
    </span>
  );
}
