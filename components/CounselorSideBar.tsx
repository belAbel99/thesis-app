"use client";

import { useState } from "react";
import { Menu, X, Calendar, ClipboardList, Home, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logoutCounselor } from "@/lib/actions/counselor.actions"; // Import logoutCounselor

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
      label: "Appointments",
      href: "/admin/counselors/appointments",
      icon: <ClipboardList className="w-5 h-5" />,
    },
    {
      label: "Calendar",
      href: "/admin/counselors/calendar",
      icon: <Calendar className="w-5 h-5" />,
    },
  ];

  return (
    <div className={`fixed left-0 top-0 h-screen transition-all duration-300 ${isOpen ? "w-64" : "w-16"} bg-white shadow-lg border-r border-gray-200 flex flex-col z-10`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="m-4 flex items-center gap-2 text-blue-700 hover:text-blue-900 transition duration-300"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isOpen && (
        <nav className="p-4 flex flex-col justify-between h-full">
          <ul className="space-y-4">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`flex items-center gap-2 text-blue-700 hover:bg-blue-100 px-4 py-2 rounded transition duration-300 ${pathname === link.href ? "bg-blue-100" : ""}`}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              </li>
            ))}
          </ul>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-500 hover:text-red-700 px-4 py-2 rounded transition duration-300"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </nav>
      )}
    </div>
  );
};

export default CounselorSideBar;