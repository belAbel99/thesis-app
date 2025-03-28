"use client";

import { useState } from "react";

const StudentFilters = ({ onFilter }: { onFilter: (filters: any) => void }) => {
  const [filters, setFilters] = useState({
    program: "",
    yearLevel: "",
  });

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    onFilter(filters);
  };

  return (
    <div className="flex gap-4 mb-6">
      <select
        name="program"
        value={filters.program}
        onChange={handleFilterChange}
        className="p-2 border border-gray-300 rounded"
      >
        <option value="">All Programs</option>
        <option value="Program 1">Program 1</option>
        <option value="Program 2">Program 2</option>
      </select>
      <select
        name="yearLevel"
        value={filters.yearLevel}
        onChange={handleFilterChange}
        className="p-2 border border-gray-300 rounded"
      >
        <option value="">All Year Levels</option>
        <option value="1">Year 1</option>
        <option value="2">Year 2</option>
      </select>
      <button
        onClick={applyFilters}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Apply Filters
      </button>
    </div>
  );
};

export default StudentFilters;