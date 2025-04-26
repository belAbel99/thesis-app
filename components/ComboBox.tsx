"use client";

interface ComboBoxProps {
  filterType: string;
  setFilterType: (value: string) => void;
  view?: "students" | "counselors";
}

const ComboBox = ({ filterType, setFilterType, view = "students" }: ComboBoxProps) => {
  const studentOptions = [
    { value: "", label: "All Students" },
    { value: "civilStatus", label: "Civil Status" },
    { value: "occupation", label: "Occupation" },
    { value: "address", label: "Address" },
    { value: "program", label: "Colleges" }
  ];

  const counselorOptions = [
    { value: "", label: "All Counselors" },
    { value: "program", label: "C0lleges" },
    { value: "areaOfExpertise", label: "Area of Expertise" },
    { value: "isActive", label: "Active Status" },
    { value: "contactNumber", label: "Contact Number" }
  ];

  const options = view === "students" ? studentOptions : counselorOptions;

  return (
    <select
      className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
      value={filterType}
      onChange={(e) => setFilterType(e.target.value)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

export default ComboBox;