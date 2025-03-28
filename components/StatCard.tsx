import clsx from "clsx";
import React from "react";

interface StatCardProps {
  type: "patients" | "students" | "employees";
  count: number;
  label: string;
  icon: string;
}

const StatCard = ({ count = 0, label, icon }: StatCardProps) => {
  return (
    <div className="flex justify-center items-center w-full">
      <div
        className={clsx(
          "p-6 rounded-xl shadow-lg flex flex-col justify-between items-center bg-gradient-to-r from-blue-200 to-blue-700 text-white w-96 h-32"
        )}
      >
        <div className="flex items-center gap-4">
          <img src={icon} alt={label} className="w-12 h-12" />
          <p className="text-4xl font-bold">{count}</p>
        </div>
        <h2 className="text-xl font-semibold text-center w-full">{label}</h2>
      </div>
    </div>
  );
};

export default StatCard;
