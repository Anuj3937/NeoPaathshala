
"use client";

import * as React from "react";
import { Laptop, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ThemeSwitcher() {
  const [theme, setThemeState] = React.useState<"theme-light" | "dark" | "system">("system");

  React.useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains("dark");
    setThemeState(isDarkMode ? "dark" : "theme-light");
  }, []);

  React.useEffect(() => {
    const isDark =
      theme === "dark" ||
      (theme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList[isDark ? "add" : "remove"]("dark");
  }, [theme]);
  
  const setTheme = (t: "theme-light" | "dark" | "system") => {
    setThemeState(t);
     if (typeof window !== 'undefined') {
       localStorage.setItem('theme', t);
       document.documentElement.classList.remove('dark', 'light');
       document.documentElement.classList.add(t);
       if (t === 'system') {
          const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
          document.documentElement.classList.add(systemTheme);
       }
    }
  }


  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="outline"
        size="icon"
        className={cn(theme === "theme-light" && "bg-accent")}
        onClick={() => setTheme("theme-light")}
      >
        <Sun className="h-5 w-5" />
        <span className="sr-only">Light theme</span>
      </Button>
      <Button
        variant="outline"
        size="icon"
        className={cn(theme === "dark" && "bg-accent")}
        onClick={() => setTheme("dark")}
      >
        <Moon className="h-5 w-5" />
        <span className="sr-only">Dark theme</span>
      </Button>
      <Button
        variant="outline"
        size="icon"
        className={cn(theme === "system" && "bg-accent")}
        onClick={() => setTheme("system")}
      >
        <Laptop className="h-5 w-5" />
        <span className="sr-only">System theme</span>
      </Button>
    </div>
  );
}
