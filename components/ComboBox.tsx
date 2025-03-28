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
      <option value="allergies">Allergies</option>
      <option value="currentMedication">Current Medication</option>
      <option value="familyMedicalHistory">Family Medical History</option>
      <option value="pastMedicalHistory">Past Medical History</option>
      <option value="bloodType">Blood Type</option>
      <option value="religion">Religion</option>
      <option value="age">Age</option>
      <option value="bmiCategory">BMI Category</option> {/* New option for BMI */}
      <option value="civilStatus">Civil Status</option>
      <option value="personWithDisability">PWD</option>
      <option value="occupation">Occupation</option>
      <option value="disabilityType">PWD - Disability Type</option>
      <option value="disabilityDetails">PWD - Disability Details</option>
    </select>
  );
};

export default ComboBox;