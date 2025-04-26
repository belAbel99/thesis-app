"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { generateAppointmentReport, generatePDFReport } from "@/utils/reportGenerator";
import { Download, BarChart2, PieChart as LucidePieChart, Calendar as CalendarIcon } from "lucide-react";
import CounselorSideBar from "@/components/CounselorSideBar";
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
import { getCounselorSession } from "@/lib/actions/counselor.actions";
import Cookies from "js-cookie";
import { decodeJwt } from "jose";
import { format } from "date-fns";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

type ReportRange = 'week' | 'month' | 'year' | 'custom' | 'all';

const CounselorReportsPage = () => {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [counselorProgram, setCounselorProgram] = useState("");
  const [selectedRange, setSelectedRange] = useState<ReportRange>('all');
  const [customStartDate, setCustomStartDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [customEndDate, setCustomEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

  useEffect(() => {
    const fetchCounselorData = async () => {
      const token = Cookies.get("counselorToken");
      if (!token) return;

      try {
        const { sessionId } = decodeJwt(token) as { sessionId: string };
        const session = await getCounselorSession(sessionId);
        if (session) {
          setCounselorProgram(session.program);
        }
      } catch (error) {
        console.error("Error fetching counselor data:", error);
      }
    };

    fetchCounselorData();
  }, []);

  const loadReport = async () => {
    if (!counselorProgram) return;
    
    setLoading(true);
    try {
      const options = {
        range: selectedRange,
        program: counselorProgram,
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
      ? `Appointment Report for ${counselorProgram}` 
      : selectedRange === 'custom'
        ? `Custom Report for ${counselorProgram} (${customStartDate} to ${customEndDate})`
        : `${selectedRange.charAt(0).toUpperCase() + selectedRange.slice(1)}ly Report for ${counselorProgram}`;
    const pdf = generatePDFReport(reportData, rangeTitle);
    pdf.save(`${counselorProgram}_appointment_report_${selectedRange}.pdf`);
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
      <CounselorSideBar />
      
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-blue-700">Appointment Reports</h1>
              <p className="text-gray-600 mt-2">
                {counselorProgram ? `Viewing data for ${counselorProgram} program` : "Loading program data..."}
              </p>
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
                  disabled={!counselorProgram}
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
                  disabled={loading || !counselorProgram}
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
                {/* Appointments by Status */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold mb-4 flex items-center text-black">
                    <BarChart2 className="w-5 h-5 mr-2 text-blue-600" />
                    Appointments by Status
                  </h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { name: "Completed", value: reportData.completed },
                        { name: "Cancelled", value: reportData.cancelled },
                        { name: "Scheduled", value: reportData.scheduled }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Appointments by Concern Type */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold mb-4 flex items-center text-black">
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

              {/* Detailed Table */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-semibold mb-4 text-black">Detailed Statistics</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metric</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">Total Appointments</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">{reportData.totalAppointments}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">100%</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">Completed</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">{reportData.completed}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                          {Math.round((reportData.completed / reportData.totalAppointments) * 100)}%
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">Cancelled</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">{reportData.cancelled}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                          {Math.round((reportData.cancelled / reportData.totalAppointments) * 100)}%
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">Scheduled</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">{reportData.scheduled}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                          {Math.round((reportData.scheduled / reportData.totalAppointments) * 100)}%
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">Completion Rate</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900"></td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                          {reportData.completionRate}%
                        </td>
                      </tr>
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

export default CounselorReportsPage;