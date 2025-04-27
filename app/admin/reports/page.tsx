"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { generateAppointmentReport, generatePDFReport } from "@/utils/reportGenerator";
import { Download, BarChart2, PieChart as LucidePieChart, Calendar as CalendarIcon } from "lucide-react";
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
import { format } from "date-fns";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

type ReportRange = 'week' | 'month' | 'year' | 'custom' | 'all';

const AdminReportsPage = () => {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedRange, setSelectedRange] = useState<ReportRange>('all');
  const [customStartDate, setCustomStartDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [customEndDate, setCustomEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Redirect if not admin
    if (localStorage.getItem('admin') !== 'true') {
      router.push('/admin/verify');
    }
  }, [router]);
  
  const loadReport = async () => {
    setLoading(true);
    try {
      const options = {
        range: selectedRange,
        ...(selectedRange === 'custom' && {
          customRange: {
            startDate: customStartDate,
            endDate: customEndDate
          }
        })
      };
      const data = await generateAppointmentReport(options);
      setReportData(data);
    } catch (error) {
      console.error("Error generating report:", error);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    if (!reportData) return;
    const rangeTitle = selectedRange === 'all' 
      ? "All Appointments Report" 
      : selectedRange === 'custom'
        ? `Custom Report (${customStartDate} to ${customEndDate})`
        : `${selectedRange.charAt(0).toUpperCase() + selectedRange.slice(1)}ly Appointment Report`;
    const pdf = generatePDFReport(reportData, rangeTitle);
    pdf.save(`appointment_report_${selectedRange}.pdf`);
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
              <div className="flex items-center gap-2">
                <select
                  value={selectedRange}
                  onChange={(e) => {
                    const value = e.target.value as ReportRange;
                    setSelectedRange(value);
                    setShowCustomDatePicker(value === 'custom');
                  }}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="all">All Time</option>
                  <option value="week">Last Week</option>
                  <option value="month">Last Month</option>
                  <option value="year">Last Year</option>
                  <option value="custom">Custom Range</option>
                </select>
                {showCustomDatePicker && (
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                      />
                      <CalendarIcon className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                    </div>
                    <span>to</span>
                    <div className="relative">
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                      />
                      <CalendarIcon className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                )}
                <Button 
                  onClick={loadReport}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {loading ? "Loading..." : "Generate Report"}
                </Button>
              </div>
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

          {reportData?.dateRange && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg text-blue-800">
              Showing data from {reportData.dateRange.startDate} to {reportData.dateRange.endDate}
            </div>
          )}

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
                      <BarChart
                        data={programData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis 
                          type="category" 
                          dataKey="name" 
                          width={150}
                          tick={{ fontSize: 12 }}
                        />
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">Program</th>
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
                          <td className="px-6 py-4 text-gray-900">
                            <div className="max-w-[200px] truncate" title={program}>
                              {program}
                            </div>
                          </td>
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