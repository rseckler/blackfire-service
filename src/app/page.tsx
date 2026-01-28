export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between text-center">
        <h1 className="mb-4 text-6xl font-bold">
          Blackfire <span className="text-primary">Service</span>
        </h1>
        <p className="mb-8 text-xl text-muted-foreground">
          Stock Investment Analysis Platform
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/dashboard"
            className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Get Started
          </a>
          <a
            href="/about"
            className="rounded-lg border border-border px-6 py-3 font-semibold hover:bg-accent transition-colors"
          >
            Learn More
          </a>
        </div>
      </div>
    </main>
  )
}
