const phases = [
  { n: 1, title: "Planning", status: "In review" },
  { n: 2, title: "Public website", status: "Next" },
  { n: 3, title: "Admin system", status: "Planned" },
  { n: 4, title: "Integration", status: "Planned" },
  { n: 5, title: "Quality assurance", status: "Planned" },
];

export default function Home() {
  return (
    <>
      <div className="bg-ink px-4 py-2 text-center text-xs text-ivory/80">
        Demo prototype by BinaLab — not affiliated with or endorsed by BEZ Car Rental.
      </div>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-10 px-4 py-16 sm:px-6">
        <div>
          <p className="mb-3 inline-block rounded bg-petrol px-2 py-0.5 font-display text-sm font-extrabold tracking-widest text-ivory">
            BEZ
          </p>
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Car rental, booking &amp; fleet management.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-steel">
            A prototype for Pengkalan Chepa, Kota Bharu. The full demo is under construction — this
            page confirms the deployment pipeline is live.
          </p>
        </div>

        <ol className="divide-y divide-line rounded-xl border border-line">
          {phases.map((p) => (
            <li key={p.n} className="flex items-center justify-between gap-4 px-4 py-3">
              <span>
                <span className="mr-3 tabular-nums text-steel">0{p.n}</span>
                <span className="font-medium">{p.title}</span>
              </span>
              <span
                className={
                  p.status === "In review"
                    ? "rounded-full bg-amber/15 px-2.5 py-0.5 text-xs font-semibold text-amber"
                    : "rounded-full bg-steel/10 px-2.5 py-0.5 text-xs font-semibold text-steel"
                }
              >
                {p.status}
              </span>
            </li>
          ))}
        </ol>
      </main>
      <footer className="border-t border-line px-4 py-6 text-center text-sm text-steel">
        Prepared by BinaLab · All vehicles, prices and business details in this demo are placeholders.
      </footer>
    </>
  );
}
