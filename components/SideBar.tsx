"use client";

import { useState } from "react";
import { Menu, X, Briefcase, Users, Calendar, ClipboardList, Home, BarChart2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

const SideBar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const pathname = usePathname();

  const navLinks = [
    {
      label: "Dashboard",
      href: "/admin",
      icon: <Home className="w-5 h-5" />
    },
    {
      label: "Calendar",
      href: "/admin/calendar",
      icon: <Calendar className="w-5 h-5" />
    },
    {
      label: "Appointments",
      href: "/admin/appointments",
      icon: <ClipboardList className="w-5 h-5" />
    },
    {
      label: "Students and Counselors",
      href: "/admin/students",
      icon: <Users className="w-5 h-5" />
    },
    {
      label: "Add A Program",
      href: "/admin/program",
      icon: <Briefcase className="w-5 h-5" />
    },
    {
      label: "Reports",
      href: "/counselor/reports",
      icon: <BarChart2 className="w-5 h-5" />
    }
  ];

  return (
    <div
      className={`fixed left-0 top-0 h-screen transition-all duration-300 ${
        isOpen ? "w-64" : "w-20"
      } bg-white shadow-lg border-r border-gray-200 flex flex-col z-10`}
    >
      {/* Sidebar Toggle Button */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {isOpen && (
          <h2 className="text-xl font-semibold text-blue-700">Admin Portal</h2>
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

      {/* Sidebar Links */}
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

      {/* Collapsed View Icons */}
      {!isOpen && (
        <nav className="flex-1 p-2 overflow-y-auto">
          <ul className="space-y-4">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`flex items-center justify-center p-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors ${
                    pathname === link.href ? "bg-blue-50 text-blue-600" : ""
                  }`}
                  title={link.label}
                >
                  {link.icon}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
};

export default SideBar;