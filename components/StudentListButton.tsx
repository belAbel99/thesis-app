"use client";

import { useRef } from "react";
import { Printer, FileText } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; // ✅ Import autoTable

type StudentListPrintButtonProps = {
  filteredStudents: any[];
  filterType: string;
  view: string; // Add 'view' prop to distinguish between student and employee view
};

const StudentListPrintButton = ({ filteredStudents, filterType, view }: StudentListPrintButtonProps) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (printRef.current) {
      const printContent = printRef.current.innerHTML;
      const newWindow = window.open("", "_blank");
  
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>Print List</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { border: 1px solid black; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
              </style>
            </head>
            <body>
              ${printContent}
              <script>
                window.onload = function() {
                  window.print();
                };
                window.onafterprint = function() {
                  window.close();
                };
              </script>
            </body>
          </html>
        `);
        newWindow.document.close();
      }
    }
  };
  

  const handleDownloadPDF = () => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(16);
    doc.text(view === "employee" ? "Employee List" : "Student List", 105, 15, { align: "center" });


    if (filterType) {
      doc.setFontSize(12);
      doc.text(`Filter: ${filterType.replace(/([A-Z])/g, " $1")}`, 105, 25, { align: "center" });
    }

    // Table Data
    const tableColumn = ["Name", "ID Number"];
    if (view === "student") {
      tableColumn.push("Program", "Year Level"); // Add Program and Year Level for student view
    } else if (view === "employee") {
      tableColumn.push("Office"); // Add Office for employee view
    }
    if (filterType) {
      tableColumn.push(filterType.replace(/([A-Z])/g, " $1"));
    }

    const tableRows = filteredStudents.map((student) => {
      const row = [student.name, student.idNumber];
      if (view === "student") {
        row.push(student.program, student.yearLevel);
      } else if (view === "employee") {
        row.push(student.office); // For employee view
      }
      if (filterType) {
        row.push(student[filterType] || "N/A");
      }
      return row;
    });

    // ✅ Use autoTable correctly
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      theme: "grid",
      styles: { fontSize: 10 },
      headStyles: { fillColor: [200, 200, 200] },
    });

    // Save PDF
    const fileName = `Student_List${filterType ? `_${filterType}` : ""}.pdf`;
    doc.save(fileName);
  };

  return (
    <>
      <div className="flex gap-2">
        {/* Print Button */}
        <button
          onClick={handlePrint}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Printer size={20} className="mr-2" /> Print List
        </button>

        {/* PDF Download Button */}
        <button
          onClick={handleDownloadPDF}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          <FileText size={20} className="mr-2" /> Download PDF
        </button>
      </div>

      {/* Hidden print section */}
      <div ref={printRef} className="hidden print:block">
        <h2 className="text-center text-xl font-semibold mb-4">{view === "employee" ? "Employee List" : "Student List"}</h2>

        {/* Display selected filter type */}
        {filterType && (
          <p className="text-center font-semibold mb-2">
            Filter: {filterType.replace(/([A-Z])/g, " $1")}
          </p>
        )}

        <table className="w-full border border-gray-500">
          <thead>
            <tr className="bg-gray-300">
              <th className="py-2 px-4 border">Name</th>
              <th className="py-2 px-4 border">ID Number</th>
              {view === "student" ? (
                <>
                  <th className="py-2 px-4 border">Program</th>
                  <th className="py-2 px-4 border">Year Level</th>
                </>
              ) : (
                <>
                  <th className="py-2 px-4 border">Office</th>
                </>
              )}
              {filterType && <th className="py-2 px-4 border">{filterType.replace(/([A-Z])/g, " $1")}</th>}
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student) => (
              <tr key={student.$id}>
                <td className="py-2 px-4 border">{student.name}</td>
                <td className="py-2 px-4 border">{student.idNumber}</td>
                {view === "student" ? (
                  <>
                    <td className="py-2 px-4 border">{student.program}</td>
                    <td className="py-2 px-4 border">{student.yearLevel}</td>
                  </>
                ) : (
                  <>
                    <td className="py-2 px-4 border">{student.office}</td>
                  </>
                )}
                {filterType && <td className="py-2 px-4 border">{student[filterType] || "N/A"}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default StudentListPrintButton;
