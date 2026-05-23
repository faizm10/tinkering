import Link from "next/link"
import type { ComponentPropsWithoutRef } from "react"

export const exploreButtonClassName =
  "inline-flex rounded-none border border-purple-900/40 bg-gradient-to-br from-[#a855f7] via-[#7c3aed] to-[#5b21b6] px-5 py-2.5 text-sm font-medium tracking-wide text-white shadow-md shadow-purple-900/30 transition-[filter,transform] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400 active:scale-[0.98]"

type ExploreButtonProps = ComponentPropsWithoutRef<typeof Link> & {
  href: string
}

export function ExploreButton({ className = "", ...props }: ExploreButtonProps) {
  return (
    <Link
      className={`${exploreButtonClassName} ${className}`.trim()}
      {...props}
    />
  )
}
