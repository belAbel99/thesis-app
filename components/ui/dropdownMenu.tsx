import React from "react";

interface DropdownMenuProps {
  children: React.ReactNode;
}

interface DropdownMenuTriggerProps {
  children: React.ReactNode;
  className?: string;
}

interface DropdownMenuContentProps {
  children: React.ReactNode;
  align?: "start" | "center" | "end";
  className?: string;
}

interface DropdownMenuItemProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export const DropdownMenu = ({ children }: DropdownMenuProps) => {
  return <div className="relative inline-block text-left">{children}</div>;
};

export const DropdownMenuTrigger = ({ children, className }: DropdownMenuTriggerProps) => {
  return (
    <button
      className={`inline-flex justify-center w-full rounded-md shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none ${className}`}
    >
      {children}
    </button>
  );
};

export const DropdownMenuContent = ({ children, align = "end", className }: DropdownMenuContentProps) => {
  const alignmentClasses = {
    start: "origin-top-left left-0",
    center: "origin-top",
    end: "origin-top-right right-0",
  };

  return (
    <div
      className={`absolute mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50 ${alignmentClasses[align]} ${className}`}
    >
      <div className="py-1">{children}</div>
    </div>
  );
};

export const DropdownMenuItem = ({ children, className, onClick, disabled }: DropdownMenuItemProps) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
    >
      {children}
    </button>
  );
};