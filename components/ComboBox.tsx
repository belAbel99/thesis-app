"use client";

interface ComboBoxProps {
  filterType: string;
  setFilterType: (value: string) => void;
}

const ComboBox = ({ filterType, setFilterType }: ComboBoxProps) => {
  return (
    <select
      className="w-full p-3 border border-gray-700 rounded-lg bg-blue-700 text-white shadow-sm focus:outline-none focus:none focus:ring-none mb-4"
      value={filterType}
      onChange={(e) => setFilterType(e.target.value)}
    >
      <option value="">All Students</option>
      <option value="civilStatus">Civil Status</option>
      <option value="occupation">Occupation</option>
    </select>
  );
};

export default ComboBox;