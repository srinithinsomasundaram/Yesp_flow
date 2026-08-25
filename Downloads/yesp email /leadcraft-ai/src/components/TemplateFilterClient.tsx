"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useCallback, useState } from "react";

export function TemplateFilterClient({
  categories,
  currentCategory,
  currentSearch,
}: {
  categories: string[];
  currentCategory: string;
  currentSearch: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(currentSearch);

  const buildHref = useCallback(
    (cat: string, q: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (cat === "All") {
        params.delete("category");
      } else {
        params.set("category", cat);
      }
      if (q) {
        params.set("q", q);
      } else {
        params.delete("q");
      }
      return `${pathname}?${params.toString()}`;
    },
    [pathname, searchParams]
  );

  const handleSearch = (value: string) => {
    setSearch(value);
    router.push(buildHref(currentCategory, value));
  };

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search templates..."
          className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-white"
        />
      </div>

      {/* Category tabs */}
      <div className="flex gap-0 border-b border-slate-200 overflow-x-auto">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => router.push(buildHref(cat, search))}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
              currentCategory === cat
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}
