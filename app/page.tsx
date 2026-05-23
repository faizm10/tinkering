import Image from "next/image"

export default function Page() {
  return (
    <main className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-black">
      <div className="relative h-dvh w-full max-w-[100dvh]">
        <Image
          src="/hero.png"
          alt="Los Angeles skyline at golden hour"
          fill
          priority
          className="object-contain object-center"
          sizes="(max-width: 100dvh) 100vw, 100vw"
        />
      </div>
    </main>
  )
}
