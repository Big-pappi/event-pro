const steps = [
  {
    n: '01',
    title: 'Create your event',
    desc: 'Set up the event details, venue and date in seconds.',
  },
  {
    n: '02',
    title: 'Design the invitation',
    desc: 'Pick a template or start from scratch in the drag-and-drop editor.',
  },
  {
    n: '03',
    title: 'Add your guests',
    desc: 'Import invitees by CSV or add them one by one, grouped however you like.',
  },
  {
    n: '04',
    title: 'Send & track',
    desc: 'Deliver over WhatsApp, SMS or Email and watch RSVPs roll in.',
  },
]

export function HowItWorks() {
  return (
    <section id="how" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-balance font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
          Live in four simple steps
        </h2>
        <p className="mt-4 text-pretty text-muted-foreground">
          No design skills, no spreadsheets, no juggling apps.
        </p>
      </div>
      <ol className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((s) => (
          <li
            key={s.n}
            className="relative rounded-2xl border border-border bg-card p-6"
          >
            <span className="font-serif text-3xl font-semibold text-primary/30">
              {s.n}
            </span>
            <h3 className="mt-3 font-semibold">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {s.desc}
            </p>
          </li>
        ))}
      </ol>
    </section>
  )
}
