
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface NavItem {
  path: string;
  label: string;
}

interface NavigationMenuProps {
  items: NavItem[];
}

export function NavigationMenu({ items }: NavigationMenuProps) {
  const location = useLocation();
  
  return (
    <div className="flex items-center space-x-2">
      {items.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={cn(
            "px-3 py-2 rounded-md text-sm font-medium transition-colors",
            location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
              ? "bg-purple-800/50 text-purple-100"
              : "text-gray-300 hover:bg-purple-800/30 hover:text-purple-100"
          )}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
