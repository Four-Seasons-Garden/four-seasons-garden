import Link from "next/link";
import type { ReactNode } from "react";

const NAV = [
  { href: "/", label: "Garden" },
  { href: "/greenhouse", label: "Greenhouse" },
  { href: "/nursery", label: "Nursery" },
  { href: "/pond", label: "Pond" },
  { href: "/garden-sutra", label: "Garden Sutra" },
];

export function AppShell({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: ReactNode;
}) {
  return (
    <main className="app-screen">
      <header className="app-topbar">
        <Link href="/" className="app-wordmark">
          Four Seasons <em>Garden</em>
        </Link>
        <nav className="app-nav" aria-label="Garden sections">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <section className="app-heading">
        <p>{eyebrow}</p>
        <h1>{title}</h1>
      </section>
      {children}
    </main>
  );
}
