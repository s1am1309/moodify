import Link from "next/link";
export default function Home() {
  return (
    <main className="min-h-screen bg-[#050505] text-white">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-6 md:px-12">
        <div className="text-xl font-semibold tracking-tight">
          Moodify
        </div>

        <button className="rounded-full border border-white/10 px-5 py-2 text-sm text-white/70 transition hover:bg-white/10">
          About
        </button>
      </nav>

      {/* Hero */}
      <section className="flex min-h-[80vh] items-center justify-center px-6">
        <div className="max-w-4xl text-center">

          <p className="mb-6 text-sm uppercase tracking-[0.3em] text-white/40">
            Understand your emotions
          </p>

          <h1 className="text-6xl font-bold tracking-tight md:text-8xl">
            Moodify
          </h1>

          <p className="mx-auto mt-8 max-w-xl text-lg leading-8 text-white/50">
            A simple way to understand how you feel,
            express your emotions, and discover your mood.
          </p>

          <Link
            href="/detect"
            className="mt-10 inline-block rounded-full bg-white px-8 py-4 font-medium text-black transition hover:scale-105 hover:bg-white/90"
          >
            Get Started →
          </Link>

        </div>
      </section>

      {/* Bottom text */}
      <footer className="px-6 pb-8 text-center text-sm text-white/30">
        Moodify · Explore your emotions
      </footer>
    </main>
  );
}