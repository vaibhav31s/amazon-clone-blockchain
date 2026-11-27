import Link from "next/link";

export default function NotFound() {
  return (
    <div className="wrap max-w-xl pt-20 text-center">
      <p className="hash text-muted">404</p>
      <h1 className="mt-2 font-display text-4xl font-extrabold tracking-[-0.03em]">Nothing on this shelf.</h1>
      <p className="mt-3 text-lg text-muted">That page, product or transaction does not exist.</p>
      <Link href="/" className="btn btn-primary mt-7">Back to the shop</Link>
    </div>
  );
}
