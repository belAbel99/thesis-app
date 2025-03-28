'use client';

import { useState } from "react";
import { Menu, X, User, Home, FileText, Calendar, ClipboardList } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiArrowLeft } from 'react-icons/fi';

const EmployeeSideBar = ({ userId }: { userId: string }) => {
  const [isOpen, setIsOpen] = useState(true);
  const pathname = usePathname();

  const navLinks = [
    {
      label: "Dashboard",
      href: `/patients/${userId}/employee`,
      icon: <Home className="w-5 h-5" /> 
    },
    {
      label: "My Details",
      href: `/patients/${userId}/employeeDetail`,
      icon: <FileText className="w-5 h-5" />
    },
    {
      label: "My Calendar",
      href: `/patients/${userId}/employee/calendar`,
      icon: <Calendar className="w-5 h-5" />
    },
    {
      label: "My Appointments",
      href: `/patients/${userId}/employee/myAppointments`,
      icon: <ClipboardList className="w-5 h-5" />
    },
    {
      label: "Go Back Home",
      href: `/`,
      icon: <FiArrowLeft className="w-5 h-5" />
    }
  ];

  return (
    <div className={`${isOpen ? "w-64" : "w-16"} bg-white text-blue-700 min-h-screen transition-all duration-300`}>
      <div className="flex justify-between items-center p-4">
        {isOpen && <h2 className="text-xl font-bold">Employee Portal</h2>}
        <button onClick={() => setIsOpen(!isOpen)} className="p-2">
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      <nav className="mt-8">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-2 p-4 hover:bg-blue-100 transition-colors ${
              pathname === link.href ? "bg-blue-100" : ""
            }`}
          >
            {link.icon}
            {isOpen && <span>{link.label}</span>}
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default EmployeeSideBar; 