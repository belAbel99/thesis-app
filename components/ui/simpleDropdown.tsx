"use client";

import { useState, useRef, useEffect } from "react";

interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
}

export function SimpleDropdown({
  trigger,
  children,
  align = "left",
  className = "",
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const alignmentClasses = {
    left: "left-0",
    right: "right-0",
    center: "left-1/2 transform -translate-x-1/2"
  };

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      {/* Change the outer button to a div with click handler */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex justify-center w-full rounded-md focus:outline-none"
        aria-expanded={isOpen}
        aria-haspopup="true"
        role="button"
        tabIndex={0}
      >
        {trigger}
      </div>

      {isOpen && (
        <div
          className={`origin-top-right absolute z-50 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none ${alignmentClasses[align]}`}
          role="menu"
        >
          <div className="py-1" role="none">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

interface DropdownItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export function DropdownItem({
  children,
  onClick,
  className = "",
  disabled = false,
  icon,
}: DropdownItemProps) {
  return (
    <button
      onClick={() => {
        if (onClick && !disabled) onClick();
      }}
      disabled={disabled}
      className={`group flex items-center w-full px-4 py-2 text-sm ${
        disabled 
          ? "text-gray-400 cursor-not-allowed" 
          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
      } ${className}`}
      role="menuitem"
    >
      {icon && <span className="mr-3">{icon}</span>}
      {children}
    </button>
  );
}

export function DropdownSeparator() {
  return <div className="border-t border-gray-200 my-1" />;
}