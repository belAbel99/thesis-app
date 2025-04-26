import { Databases, Query } from "appwrite";
import { Client } from "appwrite";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format, parseISO } from "date-fns";

interface AppointmentStats {
  total: number;
  completed: number;
  cancelled: number;
  scheduled: number;
  completionRate: number;
}

interface ReportData {
  totalAppointments: number;
  completed: number;
  cancelled: number;
  scheduled: number;
  completionRate: number;
  byProgram: Record<string, AppointmentStats>;
  byConcernType: Record<string, number>;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
}

interface DateRange {
  startDate: string;
  endDate: string;
}

interface ReportOptions {
  range?: 'week' | 'month' | 'year' | 'custom' | 'all';
  customRange?: {
    startDate: string;
    endDate: string;
  };
  program?: string;
}

export const generateAppointmentReport = async (
  options: ReportOptions = {}
): Promise<ReportData> => {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_PROJECT_ID!);
  
  const databases = new Databases(client);

  try {
    // Build date range queries
    const getDateRange = (): DateRange => {
      const now = new Date();
      const start = new Date();
      
      switch(options.range) {
        case 'week':
          start.setDate(now.getDate() - 7);
          break;
        case 'month':
          start.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          start.setFullYear(now.getFullYear() - 1);
          break;
        case 'custom':
          if (options.customRange) {
            return {
              startDate: options.customRange.startDate,
              endDate: options.customRange.endDate
            };
          }
          break;
        case 'all':
        default:
          return { startDate: '', endDate: '' };
      }
      
      return {
        startDate: format(start, 'yyyy-MM-dd'),
        endDate: format(now, 'yyyy-MM-dd')
      };
    };

    const { startDate, endDate } = getDateRange();
    
    // Build queries
    const queries = [];
    if (options.program) {
      queries.push(Query.equal("program", [options.program]));
    }
    
    // Add date range queries if specified
    if (startDate && endDate) {
      queries.push(Query.greaterThanEqual("date", startDate));
      queries.push(Query.lessThanEqual("date", endDate));
    }

    // Get all appointments
    const response = await databases.listDocuments(
      process.env.NEXT_PUBLIC_DATABASE_ID!,
      "6734ba2700064c66818e",
      queries
    );

    const appointments = response.documents;

    // Calculate overall stats
    const totalAppointments = appointments.length;
    const completed = appointments.filter(a => a.status === "Completed").length;
    const cancelled = appointments.filter(a => a.status === "Cancelled").length;
    const scheduled = appointments.filter(a => a.status === "Scheduled").length;
    const completionRate = completed + cancelled > 0 
      ? Math.round((completed / (completed + cancelled)) * 100) 
      : 0;

    // Calculate stats by program
    const byProgram: Record<string, AppointmentStats> = {};
    appointments.forEach(appointment => {
      const programName = appointment.program || "Unknown";
      if (!byProgram[programName]) {
        byProgram[programName] = {
          total: 0,
          completed: 0,
          cancelled: 0,
          scheduled: 0,
          completionRate: 0
        };
      }

      byProgram[programName].total++;
      if (appointment.status === "Completed") byProgram[programName].completed++;
      if (appointment.status === "Cancelled") byProgram[programName].cancelled++;
      if (appointment.status === "Scheduled") byProgram[programName].scheduled++;
      
      byProgram[programName].completionRate = 
        byProgram[programName].completed + byProgram[programName].cancelled > 0
          ? Math.round((byProgram[programName].completed / 
              (byProgram[programName].completed + byProgram[programName].cancelled)) * 100)
          : 0;
    });

    // Calculate distribution by concern type
    const byConcernType: Record<string, number> = {};
    appointments.forEach(appointment => {
      const concern = appointment.concernType || "Unknown";
      byConcernType[concern] = (byConcernType[concern] || 0) + 1;
    });

    return {
      totalAppointments,
      completed,
      cancelled,
      scheduled,
      completionRate,
      byProgram,
      byConcernType,
      dateRange: options.range && options.range !== 'all' ? { startDate, endDate } : undefined
    };
  } catch (error) {
    console.error("Error generating appointment report:", error);
    throw error;
  }
};

export const generatePDFReport = (reportData: ReportData, title: string) => {
  const doc = new jsPDF();
  
  // Title with date range if applicable
  let fullTitle = title;
  if (reportData.dateRange) {
    fullTitle += ` (${reportData.dateRange.startDate} to ${reportData.dateRange.endDate})`;
  }
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(fullTitle, 105, 15, { align: "center" });
  
  // Summary Section
  doc.setFontSize(14);
  doc.text("Summary Statistics", 14, 25);
  
  autoTable(doc, {
    startY: 30,
    head: [["Metric", "Count", "Percentage"]],
    body: [
      ["Total Appointments", reportData.totalAppointments.toString(), "100%"],
      ["Completed", reportData.completed.toString(), `${Math.round((reportData.completed / reportData.totalAppointments) * 100)}%`],
      ["Cancelled", reportData.cancelled.toString(), `${Math.round((reportData.cancelled / reportData.totalAppointments) * 100)}%`],
      ["Scheduled", reportData.scheduled.toString(), `${Math.round((reportData.scheduled / reportData.totalAppointments) * 100)}%`],
      ["Completion Rate", "", `${reportData.completionRate}%`],
    ],
    theme: "grid",
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    columnStyles: { 0: { fontStyle: "bold" } }
  });
  
  // By Program Section
  doc.setFontSize(14);
  // @ts-ignore
  doc.text("Appointments in the College", 14, doc.lastAutoTable.finalY + 15);
  
  const programData = Object.entries(reportData.byProgram).map(([program, stats]) => [
    program,
    stats.total.toString(),
    stats.completed.toString(),
    stats.cancelled.toString(),
    stats.scheduled.toString(),
    `${stats.completionRate}%`
  ]);
  
  autoTable(doc, {
    // @ts-ignore
    startY: doc.lastAutoTable.finalY + 20,
    head: [["College", "Total", "Completed", "Cancelled", "Scheduled", "Completion Rate"]],
    body: programData,
    theme: "grid",
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    columnStyles: { 0: { fontStyle: "bold" } }
  });
  
  // By Concern Type Section
  doc.setFontSize(14);
  // @ts-ignore
  doc.text("Appointments by Concern Type", 14, doc.lastAutoTable.finalY + 15);
  
  const concernData = Object.entries(reportData.byConcernType).map(([concern, count]) => [
    concern,
    count.toString(),
    `${Math.round((count / reportData.totalAppointments) * 100)}%`
  ]);
  
  autoTable(doc, {
    // @ts-ignore
    startY: doc.lastAutoTable.finalY + 20,
    head: [["Concern Type", "Count", "Percentage"]],
    body: concernData,
    theme: "grid",
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    columnStyles: { 0: { fontStyle: "bold" } }
  });
  
  // Footer
  doc.setFontSize(10);
  // @ts-ignore
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, doc.lastAutoTable.finalY + 10);
  
  return doc;
};