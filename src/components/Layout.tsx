import { Link, Outlet, useLocation } from "react-router-dom";
import { useStore } from "@/store";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/cn";

export function Layout() {
  const darkMode = useStore((s) => s.preferences.darkMode);
  const toggleDarkMode = useStore((s) => s.toggleDarkMode);
  const location = useLocation();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 py-4 flex items-center justify-between border-b border-border">
        <Link to="/" className="font-display text-2xl">
          P(Pass)
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <NavLink to="/train" active={location.pathname.startsWith("/train")}>
            Trainieren
          </NavLink>
          <NavLink to="/dashboard" active={location.pathname.startsWith("/dashboard")}>
            Dashboard
          </NavLink>
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-md hover:bg-muted"
            aria-label="Theme umschalten"
          >
            {darkMode ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
        </nav>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}

function NavLink({
  to,
  active,
  children,
}: {
  to: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      className={cn("hover:text-accent", active && "text-accent font-medium")}
    >
      {children}
    </Link>
  );
}
