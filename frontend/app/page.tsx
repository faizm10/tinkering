import Image from "next/image"

export default function Page() {
  return (
    <main className="flex h-[100dvh] flex-col bg-white">
      {/* fill image */}
      <div className="relative min-h-0 flex-1">
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

      {/* couple of words */}
      <div className="flex items-center justify-between px-8 py-5 md:px-12 md:py-6">
        <span className="font-mono text-[0.6rem] tracking-[0.3em] text-neutral-400 uppercase select-none">
          faiz mustansar | 2026
        </span>
        <span className="text-sm tracking-wide text-neutral-500">
          currently tinkering something new
        </span>
      </div>
    </main>
  )
}
