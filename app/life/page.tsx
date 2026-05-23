import { ExploreButton } from "@/components/explore-button"

export default function LifePage() {
  return (
    <main className="relative min-h-dvh w-full bg-[var(--landing-bg)]">
      <ExploreButton
        href="/"
        className="absolute top-6 right-6 z-10"
        aria-label="Back to home"
      >
        explore
      </ExploreButton>
    </main>
  )
}
