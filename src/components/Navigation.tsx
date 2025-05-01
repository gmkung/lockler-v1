
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

export function Navigation() {
  const location = useLocation();
  
  const navItems = [
    { path: "/setup", label: "Create Lockler" },
    { path: "/release", label: "Release Funds" },
    { path: "/myLocklers", label: "My Locklers" }
  ];
  
  return (
    <nav className="bg-white border-b mb-6 px-4 py-3 shadow-sm">
      <div className="container mx-auto flex items-center justify-between">
        <div className="font-bold text-xl">Lockler</div>
        
        <div className="flex space-x-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "px-3 py-2 rounded-md text-sm font-medium",
                location.pathname === item.path
                  ? "bg-primary text-primary-foreground"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
