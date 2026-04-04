import Image from "next/image"

export default function Page() {
  return (
    <main className="flex h-[100dvh] flex-col bg-white">

      {/* Image — fills the viewport, thin strip at the bottom */}
      <div className="relative flex-1 min-h-0">
        <Image
          src="/hero.png"
          alt=""
          fill
          className="object-cover"
          priority
          sizes="100vw"
          unoptimized
        />
      </div>

      {/* Bottom strip */}
      <div className="flex items-center justify-between px-8 py-5 md:px-12 md:py-6">
        <span className="font-mono text-[0.6rem] tracking-[0.3em] text-neutral-400 uppercase select-none">
          Studio / 2026
        </span>
        <span className="text-sm text-neutral-500 tracking-wide">
          currently tinkering something new
        </span>
      </div>

    </main>
  )
}
