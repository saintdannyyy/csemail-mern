import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Mail,
  FileText,
  BarChart3,
  Settings,
  Shield,
  Database,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    roles: ["admin", "editor", "viewer"],
  },
  {
    name: "Contacts",
    href: "/contacts",
    icon: Users,
    roles: ["admin", "editor"],
  },
  {
    name: "Campaigns",
    href: "/campaigns",
    icon: Mail,
    roles: ["admin", "editor"],
  },
  {
    name: "Templates",
    href: "/templates",
    icon: FileText,
    roles: ["admin", "editor"],
  },
  {
    name: "Reports",
    href: "/reports",
    icon: BarChart3,
    roles: ["admin", "editor", "viewer"],
  },
  { name: "Queue Monitor", href: "/queue", icon: Database, roles: ["admin"] },
  { name: "User Management", href: "/users", icon: Shield, roles: ["admin"] },
  { name: "Settings", href: "/settings", icon: Settings, roles: ["admin"] },
];

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  // console.log('Authenticated user:', user);

  const filteredNavigation = navigation.filter(
    (item) => user && item.roles.includes(user.role)
  );

  return (
    <div className="w-64 bg-white shadow-sm border-r border-gray-200 h-full">
      <div className="flex flex-col h-full">
        <div className="flex items-center h-16 px-4 border-b border-gray-200">
          <div className="flex items-center">
            <Mail className="w-8 h-8 text-blue-600" />
            <div className="ml-2">
              <h1 className="text-lg font-semibold text-gray-900">Emmisor</h1>
              <p className="text-xs text-gray-500">CodLogics Internal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {filteredNavigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`
              }
            >
              <item.icon
                className="mr-3 h-5 w-5 flex-shrink-0"
                aria-hidden="true"
              />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.firstName?.[0]}
                  {user?.lastName?.[0]}
                </span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
