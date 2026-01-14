import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Settings,
  Bookmark,
  FileCheck,
} from "lucide-react";

const adminMenu = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, rootPath: "/admin/dashboard" },
  { label: "Tenders", href: "/admin/tenders", icon: FileText, rootPath: "/admin/tenders" },
  { label: "Create Tender", href: "/admin/tender/create", icon: FileText, rootPath: "/admin/tender" },
  { label: "Bid Evaluation", href: "/admin/bid-evaluation", icon: FileCheck, rootPath: "/admin/bid-evaluation" },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3, rootPath: "/admin/analytics" },
  { label: "Profile", href: "/admin/profile", icon: Settings, rootPath: "/admin/profile" },
];

const bidderMenu = [
  { label: "Dashboard", href: "/bidder/dashboard", icon: LayoutDashboard },
  { label: "Available Tenders", href: "/bidder/tenders", icon: Bookmark },
  { label: "Saved Tenders", href: "/bidder/saved-tenders", icon: Bookmark },
  { label: "Proposals", href: "/bidder/proposals", icon: FileCheck },
  { label: "Profile", href: "/bidder/profile", icon: Settings },
];

/**
 * Check if a route is active.
 * For nested routes like /admin/tender/edit/123, check against rootPath (/admin/tender)
 */
function isRouteActive(currentPath, menuItem) {
  if (menuItem.rootPath) {
    return currentPath.startsWith(menuItem.rootPath);
  }
  return currentPath === menuItem.href;
}

export default function Sidebar({ role = "admin" }) {
  const location = useLocation();
  const menu = role === "admin" ? adminMenu : bidderMenu;

  return (
    <aside className="w-64 h-screen bg-neutral-950 text-white flex flex-col fixed top-0 left-0 overflow-y-auto">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-neutral-800">
        <Link to="/" className="font-semibold text-lg tracking-tight">
          TenderFlow AI
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">
        <ul className="space-y-2">
          {menu.map((item) => {
            const Icon = item.icon;
            const isActive = isRouteActive(location.pathname, item);
            return (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary-600 text-white"
                      : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-neutral-800 text-xs text-neutral-500">
        <p>Logged in as {role === "admin" ? "Authority" : "Bidder"}</p>
      </div>
    </aside>
  );
}
