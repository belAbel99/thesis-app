// components/ProfileBadge.tsx
"use client";

import { UserRound } from "lucide-react";

interface ProfileBadgeProps {
  name: string;
  role?: string;
  className?: string;
}

export const ProfileBadge = ({ name, role, className }: ProfileBadgeProps) => {
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div className="relative">
        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
          <UserRound className="w-5 h-5 text-indigo-600" />
        </div>
        <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></span>
      </div>
      <div>
        <p className="font-medium text-gray-800">{name}</p>
        {role && <p className="text-xs text-gray-500">{role}</p>}
      </div>
    </div>
  );
};