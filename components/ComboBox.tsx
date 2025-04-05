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
    { value: "program", label: "Program" }
  ];

  const counselorOptions = [
    { value: "", label: "All Counselors" },
    { value: "program", label: "Program" },
    { value: "areaOfExpertise", label: "Area of Expertise" },
    { value: "isActive", label: "Active Status" },
    { value: "contactNumber", label: "Contact Number" }
  ];

  const options = view === "students" ? studentOptions : counselorOptions;

  return (
    <select
      className="w-full p-3 border border-gray-700 rounded-lg bg-blue-700 text-white shadow-sm focus:outline-none focus:none focus:ring-none mb-4"
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