import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  Plus,
  Users,
  FileText,
  Upload,
  BarChart3,
  Settings,
  Clock,
  Library,
  ChevronRight,
} from "lucide-react";

interface QuickLinkItem {
  icon: React.ReactNode;
  label: string;
  description: string;
  path: string;
  color: string;
  roles?: string[]; // Optional: restrict by role
}

const QuickLinks: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const quickLinks: QuickLinkItem[] = [
    {
      icon: <Plus className="h-5 w-5" />,
      label: "Create Campaign",
      description: "Start a new email campaign",
      path: "/campaigns",
      color: "text-blue-600 bg-blue-50",
      roles: ["admin", "editor"],
    },
    {
      icon: <FileText className="h-5 w-5" />,
      label: "Create Template",
      description: "Design a new email template",
      path: "/templates",
      color: "text-purple-600 bg-purple-50",
      roles: ["admin", "editor"],
    },
    {
      icon: <Upload className="h-5 w-5" />,
      label: "Import Contacts",
      description: "Upload CSV or Excel file",
      path: "/contacts",
      color: "text-green-600 bg-green-50",
      roles: ["admin", "editor"],
    },
    {
      icon: <Library className="h-5 w-5" />,
      label: "Template Library",
      description: "Browse predefined templates",
      path: "/templates",
      color: "text-indigo-600 bg-indigo-50",
    },
    {
      icon: <Users className="h-5 w-5" />,
      label: "Manage Lists",
      description: "Organize contact lists",
      path: "/contacts",
      color: "text-orange-600 bg-orange-50",
      roles: ["admin", "editor"],
    },
    {
      icon: <BarChart3 className="h-5 w-5" />,
      label: "View Reports",
      description: "Campaign analytics",
      path: "/reports",
      color: "text-teal-600 bg-teal-50",
    },
    {
      icon: <Clock className="h-5 w-5" />,
      label: "Queue Monitor",
      description: "Track email sending status",
      path: "/queue",
      color: "text-yellow-600 bg-yellow-50",
    },
    {
      icon: <Settings className="h-5 w-5" />,
      label: "Settings",
      description: "Configure SMTP & preferences",
      path: "/settings",
      color: "text-gray-600 bg-gray-50",
      roles: ["admin"],
    },
  ];

  // Filter links based on user role
  const filteredLinks = quickLinks.filter(
    (link) => !link.roles || (user && link.roles.includes(user.role))
  );

  const handleLinkClick = (path: string) => {
    navigate(path);
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
        <p className="text-sm text-gray-600 mt-1">
          Fast access to common tasks
        </p>
      </div>
      <div className="p-4">
        <div className="space-y-2">
          {filteredLinks.map((link, index) => (
            <button
              key={index}
              onClick={() => handleLinkClick(link.path)}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors duration-150 group"
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`flex-shrink-0 p-2 rounded-lg ${link.color} group-hover:scale-110 transition-transform duration-150`}
                >
                  {link.icon}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                    {link.label}
                  </p>
                  <p className="text-xs text-gray-500">{link.description}</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-150" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuickLinks;
