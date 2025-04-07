"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { generateAppointmentReport, generatePDFReport } from "@/utils/reportGenerator";
import { Download, BarChart2, PieChart as LucidePieChart } from "lucide-react";
import SideBar from "@/components/SideBar";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const AdminReportsPage = () => {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await generateAppointmentReport();
      setReportData(data);
    } catch (error) {
      console.error("Error generating report:", error);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    if (!reportData) return;
    const pdf = generatePDFReport(reportData, "Appointment Analytics Report");
    pdf.save("appointment_report.pdf");
  };

  // Prepare data for charts
  const programData = reportData ? Object.entries(reportData.byProgram).map(([name, data]: [string, any]) => ({
    name,
    ...data
  })) : [];

  const concernData = reportData ? Object.entries(reportData.byConcernType).map(([name, value]) => ({
    name,
    value
  })) : [];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <SideBar />
      
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-blue-700">Reports</h1>
              <p className="text-gray-600 mt-2">Generate and analyze appointment data</p>
            </div>
            <div className="flex gap-4">
              <Button 
                onClick={loadReport}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? "Loading..." : "Generate Report"}
              </Button>
              <Button 
                onClick={downloadPDF}
                disabled={!reportData}
                variant="outline"
                className="flex items-center gap-2 border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                <Download className="w-4 h-4" /> Download PDF
              </Button>
            </div>
          </div>

          {reportData && (
            <div className="space-y-8">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <p className="text-sm font-medium text-gray-500">Total Appointments</p>
                  <p className="text-2xl font-bold mt-1 text-indigo-600">{reportData.totalAppointments}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <p className="text-sm font-medium text-gray-500">Completed</p>
                  <p className="text-2xl font-bold mt-1 text-green-600">{reportData.completed}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <p className="text-sm font-medium text-gray-500">Cancelled</p>
                  <p className="text-2xl font-bold mt-1 text-red-600">{reportData.cancelled}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <p className="text-sm font-medium text-gray-500">Completion Rate</p>
                  <p className="text-2xl font-bold mt-1 text-blue-600">{reportData.completionRate}%</p>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Appointments by Program */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <BarChart2 className="w-5 h-5 mr-2 text-blue-600" />
                    Appointments by Program
                  </h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={programData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="total" name="Total" fill="#8884d8" />
                        <Bar dataKey="completed" name="Completed" fill="#82ca9d" />
                        <Bar dataKey="cancelled" name="Cancelled" fill="#ff8042" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Appointments by Concern Type */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <LucidePieChart className="w-5 h-5 mr-2 text-blue-600" />
                    Appointments by Concern Type
                  </h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={concernData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {concernData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Data Tables */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-semibold mb-4">Detailed Statistics by Program</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cancelled</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scheduled</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion Rate</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Object.entries(reportData.byProgram).map(([program, data]: [string, any]) => (
                        <tr key={program}>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-900">{program}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-900">{data.total}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-900">{data.completed}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-900">{data.cancelled}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-900">{data.scheduled}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                            {data.cancelled > 0 
                              ? `${Math.round((data.completed / (data.completed + data.cancelled)) * 100)}%`
                              : data.completed > 0 ? "100%" : "0%"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminReportsPage;