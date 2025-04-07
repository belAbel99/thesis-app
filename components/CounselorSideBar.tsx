"use client";

import { useState } from "react";
import { Menu, X, Calendar, ClipboardList, Home, LogOut, TrendingUp, BarChart2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { logoutCounselor } from "@/lib/actions/counselor.actions";
import { ProfileBadge } from "@/components/ProfileBadge";

const CounselorSideBar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const response = await logoutCounselor();
    if (response.success) {
      router.push("/admin/counselors/login");
    }
  };

  const navLinks = [
    {
      label: "Dashboard",
      href: "/admin/counselors",
      icon: <Home className="w-5 h-5" />,
    },
    {
      label: "Student Progress",
      href: "/admin/counselors/progress",
      icon: <TrendingUp className="w-5 h-5" />,
    },
    {
      label: "Appointments",
      href: "/admin/counselors/appointments",
      icon: <ClipboardList className="w-5 h-5" />,
    },
    {
      label: "Calendar",
      href: "/admin/counselors/calendar",
      icon: <Calendar className="w-5 h-5" />,
    },
    {
      label: "Reports",
      href: "/admin/counselors/reports",
      icon: <BarChart2 className="w-5 h-5" />
    }
  ];

  return (
    <div className={`fixed left-0 top-0 h-screen transition-all duration-300 ${
      isOpen ? "w-64" : "w-20"
    } bg-white shadow-lg border-r border-gray-200 flex flex-col z-10`}>
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {isOpen && (
          <h2 className="text-xl font-semibold text-blue-700">Counselor Portal</h2>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="text-gray-500 hover:text-gray-700"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </div>

      {/* Profile Badge */}
      {isOpen && (
        <div className="p-4 border-b border-gray-200">
          <ProfileBadge name="Counselor Name" role="Guidance Counselor" />
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 p-2 overflow-y-auto">
        <ul className="space-y-1">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`flex items-center gap-3 p-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors ${
                  pathname === link.href ? "bg-blue-50 text-blue-600" : ""
                }`}
              >
                <span className="flex-shrink-0">
                  {link.icon}
                </span>
                {isOpen && <span className="text-sm font-medium">{link.label}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-200">
        <Button
          variant="ghost"
          className="w-full flex items-center gap-3 text-red-500 hover:bg-red-50 hover:text-red-600"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5" />
          {isOpen && <span>Logout</span>}
        </Button>
      </div>
    </div>
  );
};

export default CounselorSideBar;