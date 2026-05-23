"use client"

import Image from "next/image"
import Link from "next/link"
import { useRef } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { exploreButtonClassName } from "@/components/explore-button"

export function HeroScene() {
  const rootRef = useRef<HTMLElement>(null)
  const imageLayerRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const exploreRef = useRef<HTMLAnchorElement>(null)

  useGSAP(
    () => {
      const imageLayer = imageLayerRef.current
      const glow = glowRef.current
      const explore = exploreRef.current
      if (!imageLayer || !glow || !explore) return

      const prefersReduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches

      if (prefersReduced) {
        gsap.set([imageLayer, glow, explore], {
          clearProps: "all",
          opacity: 1,
          scale: 1,
          y: 0,
        })
        return
      }

      gsap.set(imageLayer, { scale: 1.08, opacity: 0 })
      gsap.set(glow, { opacity: 0 })
      gsap.set(explore, { opacity: 0, y: -10 })

      const intro = gsap.timeline({ defaults: { ease: "power2.out" } })
      intro
        .to(imageLayer, { opacity: 1, duration: 2.2 }, 0)
        .to(imageLayer, { scale: 1, duration: 3.2, ease: "power3.out" }, 0)
        .to(glow, { opacity: 1, duration: 2.8 }, 0.4)
        .to(explore, { opacity: 1, y: 0, duration: 1.1, ease: "power2.out" }, 1.4)

      gsap.to(imageLayer, {
        scale: 1.035,
        duration: 32,
        ease: "none",
        repeat: -1,
        yoyo: true,
        delay: 3.5,
      })

      gsap.to(glow, {
        opacity: 0.55,
        duration: 14,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        delay: 4,
      })
    },
    { scope: rootRef },
  )

  return (
    <main
      ref={rootRef}
      className="relative h-dvh w-full overflow-hidden bg-[var(--landing-bg)]"
    >
      <div
        ref={imageLayerRef}
        className="absolute inset-0 will-change-transform"
        aria-hidden
      >
        <Image
          src="/hero1.png"
          alt="Golden hour sunset over a distant city skyline"
          fill
          priority
          className="object-cover object-bottom"
          sizes="100vw"
        />
      </div>

      <div
        ref={glowRef}
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1a120e]/25 via-transparent to-[#f4c9a0]/20 mix-blend-soft-light"
        aria-hidden
      />

      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--landing-bg)]/30"
        aria-hidden
      />

      <Link
        ref={exploreRef}
        href="/life"
        className={`absolute top-6 right-6 z-10 ${exploreButtonClassName}`}
      >
        explore
      </Link>
    </main>
  )
}
