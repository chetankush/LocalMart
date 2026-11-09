import type { ReactNode } from "react";

export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "";

export interface LegalSection {
  title: string;
  /** Paragraphs and bullet lists, in order */
  body: ReactNode[];
}

/** A plain reading page for the privacy policy and the terms: title, date, numbered sections */
export default function LegalPage({
  title,
  hindi,
  updated,
  intro,
  sections,
}: {
  title: string;
  hindi: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
      <h1 className="text-[30px] font-bold leading-tight tracking-[-0.01em] text-label sm:text-[36px]">{title}</h1>
      <p className="mt-1 text-[15px] text-label-2">{hindi}</p>
      <p className="mt-3 text-[13px] text-label-3">Last updated {updated}</p>
      <p className="mt-6 text-[17px] leading-relaxed text-label">{intro}</p>

      <nav aria-label="On this page" className="mt-8 rounded-2xl bg-card p-4 sm:p-5">
        <p className="text-[13px] font-semibold uppercase tracking-wide text-label-3">On this page</p>
        <ol className="mt-2 list-inside list-decimal space-y-1 text-[15px] text-label-2">
          {sections.map((s, i) => (
            <li key={s.title}>
              <a href={`#s${i + 1}`} className="text-tint hover:underline">
                {s.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-8 space-y-9">
        {sections.map((s, i) => (
          <section key={s.title} id={`s${i + 1}`} className="scroll-mt-24">
            <h2 className="text-[21px] font-bold leading-snug text-label">
              {i + 1}. {s.title}
            </h2>
            <div className="mt-3 space-y-3 text-[16px] leading-relaxed text-label-2 [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-label [&_ul]:space-y-1.5">
              {s.body.map((b, j) => (
                <div key={j}>{b}</div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

/** "Email us at …" when the support address is set; otherwise nothing is invented */
export function ContactLine({ what }: { what: string }) {
  return SUPPORT_EMAIL ? (
    <p>
      {what}{" "}
      <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-tint hover:underline">
        {SUPPORT_EMAIL}
      </a>
      .
    </p>
  ) : (
    <p>{what} Use the “Questions &amp; answers” page of the app.</p>
  );
}
