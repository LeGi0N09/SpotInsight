"use client";

import { LayoutDashboard, HelpCircle, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type NavIconType =
  | React.ComponentType<React.SVGProps<SVGSVGElement>>
  | ((props: React.SVGProps<SVGSVGElement>) => React.ReactNode);

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const navItems: Array<{
    href: string;
    label: string;
    icon: NavIconType;
  }> = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },

    {
      href: "/artists",
      label: "Top Artists",
      icon: (props) => (
        <svg
          {...props}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M12 12c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4z" />
          <path d="M3 20c0-3 4-5 9-5s9 2 9 5" />
        </svg>
      ),
    },

    {
      href: "/tracks",
      label: "Top Tracks",
      icon: (props) => (
        <svg
          {...props}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="3" fill="currentColor" />
        </svg>
      ),
    },

    {
      href: "/activity",
      label: "Activity",
      icon: (props) => (
        <svg
          {...props}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },

    {
      href: "/health",
      label: "Health",
      icon: (props) => (
        <svg
          {...props}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      ),
    },
  ];

  return (
    <>
      {/* Mobile Trigger */}
      {!mobileOpen && (
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-[40] bg-[#0e0e0e] p-2.5 rounded-xl border border-[#00e461]/40 shadow-lg backdrop-blur-sm"
        >
          <Menu className="w-5 h-5 text-[#00e461]" />
        </button>
      )}

      {/* Overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-[45]"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-[50]
          w-64 bg-[#0c0c0c] bg-gradient-to-b from-[#121212] to-[#050505]
          p-5 flex flex-col
          border-r border-white/10
          shadow-xl shadow-black/40
          transform transition-transform duration-300 ease-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo Section */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-full bg-[#00e461] flex items-center justify-center font-black text-black text-base shadow-md">
              S
            </div>
            <div>
              <div className="text-base font-semibold tracking-wide">
                Spotify
              </div>
              <div className="text-xs opacity-50">Analytics</div>
            </div>
          </div>

          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-[#00e461]" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`
                  group flex items-center gap-3 py-2.5 px-3 rounded-lg text-sm relative
                  transition-all duration-200
                  ${
                    active
                      ? "bg-[#00e461]/15 text-[#00e461]"
                      : "text-white/80 hover:bg-white/5"
                  }
                `}
              >
                {/* Active Left Bar */}
                {active && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00e461] rounded-r-md" />
                )}

                {/* Icon */}
                <span
                  className={`
                    flex-none w-5 h-5 flex items-center justify-center
                    transition-colors
                    ${
                      active
                        ? "text-[#00e461]"
                        : "text-white/80 group-hover:text-[#00e461]"
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                </span>

                {/* Label */}
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Help */}
        <div className="mt-6 pt-4 border-t border-white/5">
          <div className="flex items-center gap-2 px-3 py-2 text-xs opacity-60 hover:opacity-100 cursor-pointer transition-opacity">
            <HelpCircle className="w-4 h-4" />
            <span>Help</span>
          </div>
        </div>
      </aside>
    </>
  );
}
