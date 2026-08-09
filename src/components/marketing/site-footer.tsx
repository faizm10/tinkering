import Link from "next/link";

import { Wordmark } from "@/components/layout/wordmark";

/** Every link here resolves to a real route or a real section on this page. */
const columns = [
  {
    heading: "Product",
    links: [
      { href: "/#how-it-works", label: "How it works" },
      { href: "/#use-cases", label: "Use cases" },
      { href: "/#security", label: "Security" },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
  {
    heading: "Account",
    links: [
      { href: "/login", label: "Sign in" },
      { href: "/register", label: "Get started" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-hairline">
      <div className="mx-auto max-w-[1200px] px-5 py-12 lg:px-8 lg:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_repeat(4,1fr)]">
          <div className="space-y-3">
            <Wordmark href="/" />
            <p className="type-meta max-w-56">
              Prepared for what’s next.
            </p>
          </div>

          {columns.map((column) => (
            <nav key={column.heading} aria-label={column.heading}>
              <h2 className="type-label">{column.heading}</h2>
              <ul className="mt-1 lg:mt-3 lg:space-y-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      // 44px rows on touch widths; compact text links on desktop.
                      className="inline-flex min-h-11 items-center text-sm text-body transition-colors duration-[var(--dur-hover)] hover:text-ink lg:min-h-0"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <p className="type-meta mt-12 border-t border-hairline-soft pt-6">
          © {new Date().getFullYear()} Sonae
        </p>
      </div>
    </footer>
  );
}
