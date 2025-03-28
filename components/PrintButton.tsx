"use client";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Printer, FileText } from "lucide-react";

const PrintButton = ({ student }: { student: any }) => {
  const generatePDF = (printMode = false) => {
    const doc = new jsPDF("p", "mm", "a4");

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(`${student.name}'s Student Details`, 105, 15, { align: "center" });

    let y = 25;

    // Personal Information Table
    autoTable(doc, {
      startY: y,
      head: [["Personal Information", "Details"]],
      body: [
        ["Email", student.email || "N/A"],
        ["Phone", student.phone || "N/A"],
        ["Gender", student.gender || "N/A"],
        ["Birth Date", student.birthDate || "N/A"],
        ["Age", student.age || "N/A"],
        ["Civil Status", student.civilStatus || "N/A"],
        ["Address", student.address || "N/A"],
        ["ID Number", student.idNumber || "N/A"],
        ["Scholarship", student.scholarship || "N/A"],
      ],
      theme: "grid",
      styles: { fontSize: 12 },
      headStyles: { fillColor: [200, 200, 200] },
    });
    // @ts-ignore
    y = doc.lastAutoTable.finalY + 10;

    // Emergency Contact Table
    autoTable(doc, {
      startY: y,
      head: [["Emergency Contact", "Details"]],
      body: [
        ["Emergency Contact Name", student.emergencyContactName || "N/A"],
        ["Emergency Contact Number", student.emergencyContactNumber || "N/A"],
      ],
      theme: "grid",
      styles: { fontSize: 12 },
      headStyles: { fillColor: [200, 200, 200] },
    });
    // @ts-ignore
    y = doc.lastAutoTable.finalY + 10;

    // Identification Table
    autoTable(doc, {
      startY: y,
      head: [["Identification", "Details"]],
      body: [
        ["Identification Type", student.identificationType || "N/A"],
        ["Identification Number", student.identificationNumber || "N/A"],
        ["Identification Document", student.identificationDocumentUrl ? "View Document" : "N/A"],
      ],
      theme: "grid",
      styles: { fontSize: 12 },
      headStyles: { fillColor: [200, 200, 200] },
    });
    // @ts-ignore
    y = doc.lastAutoTable.finalY + 10;

    // Academic Information Table
    autoTable(doc, {
      startY: y,
      head: [["Academic Information", "Details"]],
      body: [
        ["Program", student.program || "N/A"],
        ["Year Level", student.yearLevel || "N/A"],
        ["Academic Performance", student.academicPerformance || "N/A"],
        ["Scholarship", student.scholarship || "N/A"],
      ],
      theme: "grid",
      styles: { fontSize: 12 },
      headStyles: { fillColor: [200, 200, 200] },
    });
    // @ts-ignore
    y = doc.lastAutoTable.finalY + 10;

    // Consent and Privacy Table
    autoTable(doc, {
      startY: y,
      head: [["Medical Information", "Details"]],
      body: [
        ["Counseling Preference", student.counselingPreferences || "N/A"],
        ["Mental Health History", student.mentalHealthHistory || "N/A"],
        ["Consent to Treatment", student.treatmentConsent ? "Yes" : "No"],
      ],
      theme: "grid",
      styles: { fontSize: 12 },
      headStyles: { fillColor: [200, 200, 200] },
    });
    // @ts-ignore
    y = doc.lastAutoTable.finalY + 10;

    // Generated on Date
    doc.text("Generated on: " + new Date().toLocaleString(), 14, y);

    if (printMode) {
      doc.autoPrint();
      window.open(doc.output("bloburl"), "_blank");
    } else {
      doc.save(`${student.name}_Student_Details.pdf`);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => generatePDF(false)}
        className="flex items-center border-2 border-red-700 hover:bg-red-700 hover:text-white text-red-700 px-4 py-2 rounded-lg shadow-md font-bold"
      >
        <FileText className="mr-2" /> Download PDF
      </button>
      <button
        onClick={() => generatePDF(true)}
        className="flex items-center hover:bg-blue-700 text-blue-700 border-2 border-blue-700 hover:text-white px-4 py-2 rounded-lg shadow-md font-bold"
      >
        <Printer className="mr-2" /> Print
      </button>
    </div>
  );
};


export default PrintButton;