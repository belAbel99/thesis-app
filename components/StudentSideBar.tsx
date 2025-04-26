// components/StudentSideBar.tsx
import { useState } from "react";
import { Menu, X, Home, FileText, Calendar, ClipboardList, TrendingUp, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import Cookies from "js-cookie";

const StudentSideBar = ({ userId }: { userId: string }) => {
  const [isOpen, setIsOpen] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

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
      label: "My Progress",
      href: `/patients/${userId}/student/progress`,
      icon: <TrendingUp className="w-5 h-5" />
    }
  ];

  const handleLogout = async () => {
    try {
      // Clear cookies or session data
      Cookies.remove("studentToken");
      
      // Redirect to login page
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className={`${isOpen ? "w-64" : "w-20"} bg-gradient-to-b from-indigo-700 to-indigo-800 text-white min-h-screen flex flex-col transition-all duration-300`}>
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-indigo-600">
        {isOpen && (
          <h2 className="text-xl font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
            Student Portal
          </h2>
        )}
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="p-2 rounded-lg hover:bg-indigo-600 transition-colors"
          aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isOpen ? (
            <X className="w-5 h-5 text-indigo-100" />
          ) : (
            <Menu className="w-5 h-5 text-indigo-100" />
          )}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-3 p-4 mx-2 my-1 rounded-lg hover:bg-indigo-600 transition-colors ${
              pathname === link.href ? "bg-indigo-900 shadow-md" : ""
            }`}
          >
            <span className={`flex-shrink-0 ${pathname === link.href ? "text-white" : "text-indigo-200"}`}>
              {link.icon}
            </span>
            {isOpen && (
              <span className={`${pathname === link.href ? "font-semibold" : "font-medium"}`}>
                {link.label}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-indigo-600">
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 w-full p-3 rounded-lg hover:bg-indigo-600 transition-colors ${
            isOpen ? "justify-start" : "justify-center"
          }`}
        >
          <LogOut className="w-5 h-5 text-indigo-200" />
          {isOpen && <span className="font-medium">Log Out</span>}
        </button>
      </div>
    </div>
  );
};

export default StudentSideBar;