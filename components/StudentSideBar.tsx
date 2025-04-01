// components/StudentSideBar.tsx
import { useState } from "react";
import { Menu, X, User, Home, FileText, Calendar, ClipboardList, TrendingUp } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiArrowLeft } from 'react-icons/fi';

const StudentSideBar = ({ userId }: { userId: string }) => {
  const [isOpen, setIsOpen] = useState(true);
  const pathname = usePathname(); 

  const navLinks = [
    {
      label: "Dashboard",
      href: `/patients/${userId}/student`,
      icon: <Home className="w-5 h-5" />
    },
    {
      label: "My Details",
      href: `/patients/${userId}/studentDetail`,
      icon: <FileText className="w-5 h-5" />
    },
    {
      label: "My Calendar",
      href: `/patients/${userId}/student/calendar`,
      icon: <Calendar className="w-5 h-5" />
    },
    {
      label: "My Appointments",
      href: `/patients/${userId}/student/myAppointments`,
      icon: <ClipboardList className="w-5 h-5" />
    },
    {
      name: "My Progress",
      href: `/patients/${userId}/student/progress`,
      icon: <TrendingUp className="w-5 h-5" />,
    },
    {
      label: "Go Back Home",
      href: `/`,
      icon: <FiArrowLeft className="w-5 h-5" />
    }
  ];

  return (
    <div className={`${isOpen ? "w-64" : "w-16"} bg-indigo-700 text-white min-h-screen transition-all duration-300`}>
      <div className="flex justify-between items-center p-4">
        {isOpen && <h2 className="text-xl font-bold">Guidance Portal - Student</h2>}
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="p-2 text-white hover:bg-indigo-600 rounded-md"
        >
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      <nav className="mt-8">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-3 p-4 hover:bg-indigo-600 transition-colors ${
              pathname === link.href ? "bg-indigo-800" : ""
            }`}
          >
            <span className="flex-shrink-0">
              {link.icon}
            </span>
            {isOpen && <span>{link.label}</span>}
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default StudentSideBar;