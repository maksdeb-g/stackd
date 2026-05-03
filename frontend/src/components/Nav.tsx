"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, FolderOpen, BarChart3, Layers } from "lucide-react";
import clsx from "clsx";

const links = [
  { href: "/", label: "Search", icon: Search },
  { href: "/folders", label: "Folders", icon: FolderOpen },
  { href: "/progress", label: "Progress", icon: BarChart3 },
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav className="sticky top-0 z-50 border-b border-ink-muted bg-ink/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-yellow">
            <Layers className="h-4 w-4 text-ink" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight text-cream group-hover:text-accent-yellow transition-colors">
            Stackd
          </span>
        </Link>

        {/* Links */}
        <div className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active = path === href || (href !== "/" && path.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
                  active
                    ? "bg-accent-yellow text-ink"
                    : "text-cream/60 hover:bg-ink-muted hover:text-cream"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
