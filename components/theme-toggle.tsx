"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";

type Theme = "dark" | "light";

// Source of truth: the "dark" class on <html> (set by the layout and the <head> script).
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}
const getTheme = (): Theme =>
  document.documentElement.classList.contains("dark") ? "dark" : "light";
const getServerTheme = (): Theme => "dark";

type Props = {
  className?: string;
};

export function ThemeToggle({ className }: Props) {
  const theme = useSyncExternalStore(subscribe, getTheme, getServerTheme);
  const next: Theme = theme === "dark" ? "light" : "dark";

  function toggle() {
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem("theme", next);
    } catch {
      // Storage unavailable: theme still switches, it just isn't remembered.
    }
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggle}
      aria-label={`Switch to ${next} theme`}
      className={className}
    >
      {theme === "dark" ? <Sun /> : <Moon />}
    </Button>
  );
}
