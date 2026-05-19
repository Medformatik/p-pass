import { Link, Outlet, useLocation } from "react-router-dom";
import { useStore } from "@/store";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { Sun, Moon, Monitor, Flame, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/cn";
import { NumberTicker } from "./NumberTicker";
import type { ThemeMode } from "@/store";

const THEME_CYCLE: Record<ThemeMode, ThemeMode> = {
  system: "light",
  light: "dark",
  dark: "system",
};

const THEME_LABEL: Record<ThemeMode, string> = {
  system: "System",
  light: "Hell",
  dark: "Dunkel",
};

function ThemeIcon({ theme }: { theme: ThemeMode }) {
  if (theme === "system") return <Monitor className="size-4" />;
  if (theme === "light") return <Sun className="size-4" />;
  return <Moon className="size-4" />;
}

export function Layout() {
  const theme = useStore((s) => s.preferences.theme);
  const setTheme = useStore((s) => s.setTheme);
  const soundEnabled = useStore((s) => s.preferences.soundEnabled);
  const toggleSound = useStore((s) => s.toggleSound);
  const streakCurrent = useStore((s) => s.streak.current);
  const location = useLocation();

  useEffect(() => {
    const apply = () => {
      const isDark =
        theme === "dark" ||
        (theme === "system" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);
      document.documentElement.classList.toggle("dark", isDark);
    };
    apply();
    if (theme === "system") {
      const mql = window.matchMedia("(prefers-color-scheme: dark)");
      mql.addEventListener("change", apply);
      return () => mql.removeEventListener("change", apply);
    }
  }, [theme]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b border-border gap-2">
        <Link to="/" className="font-display text-xl sm:text-2xl shrink-0">
          P(Pass)
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4 text-sm overflow-x-auto">
          <NavLink to="/train" active={location.pathname.startsWith("/train")}>
            Trainieren
          </NavLink>
          <NavLink to="/mock" active={location.pathname.startsWith("/mock")}>
            Mock-Klausur
          </NavLink>
          <NavLink to="/dashboard" active={location.pathname.startsWith("/dashboard")}>
            Dashboard
          </NavLink>
          <NavLink to="/inspector" active={location.pathname.startsWith("/inspector")}>
            Bayes
          </NavLink>
          {streakCurrent > 0 && (
            <span
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium"
              aria-label={`Aktuelle Streak: ${streakCurrent} Tage`}
              title={`${streakCurrent}-Tage-Streak`}
            >
              <Flame className="size-3" aria-hidden="true" />
              <NumberTicker value={streakCurrent} />
            </span>
          )}
          <button
            onClick={toggleSound}
            className="p-2.5 rounded-md hover:bg-muted"
            aria-label="Sound umschalten"
          >
            {soundEnabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
          </button>
          <button
            onClick={() => setTheme(THEME_CYCLE[theme])}
            className="p-2.5 rounded-md hover:bg-muted"
            aria-label={`Theme: ${THEME_LABEL[theme]} (klicken zum Wechseln)`}
            title={`Theme: ${THEME_LABEL[theme]}`}
          >
            <ThemeIcon theme={theme} />
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
