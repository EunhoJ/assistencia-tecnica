"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

// Toaster do sonner — montado uma única vez no layout [token] (Story 2.6).
// `theme="system"` segue o `prefers-color-scheme` (mesmo critério do dark mode
// do Tailwind no projeto). Sem next-themes: o app não usa ThemeProvider.
const Toaster = (props: ToasterProps) => {
  return (
    <Sonner
      theme="system"
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
