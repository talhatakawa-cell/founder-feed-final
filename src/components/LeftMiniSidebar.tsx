import { Link, useLocation } from "react-router-dom";
import { BookOpen, HelpCircle, HandCoins, Rocket, Users, MoreVertical, X } from "lucide-react";
import { useState } from "react";

export default function LeftMiniSidebar() {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const items = [
    { name: "Feed", path: "/", icon: Rocket },
    { name: "Success Stories", path: "/stories", icon: BookOpen },
    { name: "Q&A", path: "/qa", icon: HelpCircle },
    { name: "Get Investor", path: "/investors", icon: HandCoins },
    { name: "Find Partner", path: "/find-partner", icon: Users },
  ];

  return (
    <>
      {/* MOBILE 3 DOT BUTTON */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed left-3 top-20 z-50 
        bg-white dark:bg-zinc-900 
        border border-zinc-200 dark:border-zinc-800 
        p-2 rounded-lg shadow"
      >
        <MoreVertical className="w-5 h-5 text-zinc-900 dark:text-zinc-100" />
      </button>

      {/* DESKTOP SIDEBAR */}
      <div className="hidden lg:block w-60 pr-4">
        <div className="sticky top-24 space-y-2">
          {items.map((item) => {
            const Icon = item.icon;

            const active =
              item.path === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl border
                  transition-all duration-200
                  ${
                    active
                      ? "bg-emerald-500 text-zinc-950 border-emerald-500 font-bold shadow-sm"
                      : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/40 hover:bg-emerald-500/5"
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* MOBILE OVERLAY SIDEBAR */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">

          {/* SIDEBAR (LEFT) */}
          <div className="w-64 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 p-4 space-y-2">

            {/* CLOSE BUTTON */}
            <button
              onClick={() => setOpen(false)}
              className="mb-4 text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {items.map((item) => {
              const Icon = item.icon;

              const active =
                item.path === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl border
                    transition-all duration-200
                    ${
                      active
                        ? "bg-emerald-500 text-zinc-950 border-emerald-500 font-bold shadow-sm"
                        : "bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/40 hover:bg-emerald-500/5"
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm">{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* BACKDROP */}
          <div
            className="flex-1 bg-black/50"
            onClick={() => setOpen(false)}
          />
        </div>
      )}
    </>
  );
}