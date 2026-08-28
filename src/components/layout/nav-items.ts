import {
  Bot,
  CalendarRange,
  Clock,
  History,
  LayoutGrid,
  ListTodo,
  Settings,
  SquareCheck,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  /** Shorter label for the mobile bar, where five items share the width. */
  shortLabel?: string;
  icon: LucideIcon;
};

export const primaryNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", shortLabel: "Today", icon: LayoutGrid },
  { href: "/assistant", label: "Assistant", shortLabel: "Ask", icon: Bot },
  { href: "/events", label: "Life Events", shortLabel: "Events", icon: CalendarRange },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/waiting", label: "Waiting On", shortLabel: "Waiting", icon: Clock },
  { href: "/approvals", label: "Approvals", icon: SquareCheck },
  { href: "/history", label: "History", icon: History },
  { href: "/settings", label: "Settings", shortLabel: "Profile", icon: Settings },
];

/** The four destinations that earn a slot in the mobile bar, either side of Add. */
export const mobileNav: NavItem[] = ["/dashboard", "/assistant", "/waiting", "/settings"].map(
  (href) => primaryNav.find((item) => item.href === href)!,
);

/** A nav item is active on its own route and on anything nested beneath it. */
export function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
