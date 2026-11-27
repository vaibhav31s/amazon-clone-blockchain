"use client";

import Link from "next/link";
import { Arrow } from "./icons";
import { useStore } from "./store";

export function HeroActions() {
  const s = useStore();
  return (
    <div className="mt-8 flex flex-wrap items-center gap-3">
      {s.ready && s.address ? (
        <a href="#shop" className="btn btn-primary !px-6 !py-3.5">
          Start shopping <Arrow width={18} height={18} />
        </a>
      ) : (
        <button onClick={() => void s.startDemo()} disabled={s.connecting} className="btn btn-primary !px-6 !py-3.5">
          {s.connecting ? <span className="spinner" /> : null}
          {s.connecting ? "Setting up…" : "Try it with a demo wallet"}
          {!s.connecting && <Arrow width={18} height={18} />}
        </button>
      )}
      <Link href="/how-it-works" className="btn btn-ghost !px-6 !py-3.5">
        How it works
      </Link>
    </div>
  );
}
