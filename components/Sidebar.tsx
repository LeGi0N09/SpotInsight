"use client";

import { LayoutDashboard, HelpCircle, Menu, X, History } from "lucide-react";
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
    { href: "/plays", label: "Latest Plays", icon: History },
    {
      href: "/status",
      label: "Sync Status",
      icon: (props) => (
        <svg
          {...props}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
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
          w-20 bg-[#0c0c0c] bg-gradient-to-b from-[#121212] to-[#050505]
          p-3 flex flex-col items-center
          border-r border-white/10
          shadow-xl shadow-black/40
          transform transition-transform duration-300 ease-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo Section */}
        <div className="mb-8 flex justify-center">
          <div className="w-10 h-10 rounded-full bg-[#00e461] flex items-center justify-center font-black text-black text-sm shadow-md hover:scale-110 transition-transform">
            S
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-4 w-full">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`
                  group flex justify-center p-3 rounded-lg relative
                  transition-all duration-200
                  ${
                    active
                      ? "bg-[#00e461]/15 text-[#00e461]"
                      : "text-white/80 hover:bg-white/5 hover:text-[#00e461]"
                  }
                `}
                title={item.label}
              >
                {/* Active Left Bar */}
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#00e461] rounded-r-md" />
                )}

                {/* Icon Only */}
                <Icon className="w-6 h-6" />
              </Link>
            );
          })}
        </nav>

        {/* Help */}
        <div className="mt-auto pt-4 border-t border-white/5 w-full flex justify-center">
          <div
            className="p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors text-white/60 hover:text-[#00e461]"
            title="Help"
          >
            <HelpCircle className="w-5 h-5" />
          </div>
        </div>
      </aside>
    </>
  );
}
