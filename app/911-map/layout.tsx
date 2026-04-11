import type { ReactNode } from "react"
import type { Viewport } from "next"

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#050707",
}

export default function NineOneOneMapLayout({
  children,
}: {
  children: ReactNode
}) {
  return children
}
