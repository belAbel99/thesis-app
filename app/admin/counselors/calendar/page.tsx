"use client";

import { useEffect, useState } from "react";
import { Client, Databases, Query } from "appwrite";
import CounselorSideBar from "@/components/CounselorSideBar";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getCounselorSession } from "@/lib/actions/counselor.actions";
import Cookies from "js-cookie";
import { decodeJwt } from "jose";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface Appointment {
  $id: string;
  patientName: string;
  date: string;
  time: string;
  status: "Scheduled" | "Completed" | "Cancelled";
  userid: string;
  program: string;
  concernType: "Academic" | "Career" | "Personal" | "Crisis";
  followUpRequired: boolean;
  sessionNotes: string;
  counselorNotes?: string;
  duration: number;
  cancellationReason?: string;
}

const CounselorCalendarPage = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [counselorProgram, setCounselorProgram] = useState<string>("");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [view, setView] = useState<'month' | 'day'>('month');
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<"Cancelled" | "Completed" | null>(null);
  const [counselorNotes, setCounselorNotes] = useState("");
  const [cancellationReason, setCancellationReason] = useState("");
  const [followUpRequired, setFollowUpRequired] = useState(false);

  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_PROJECT_ID!);

  const databases = new Databases(client);

  useEffect(() => {
    const fetchSessionAndAppointments = async () => {
      const token = Cookies.get("counselorToken");

      if (!token) {
        console.error("No token found in cookies.");
        return;
      }

      try {
        // Get counselor session and program
        const { sessionId } = decodeJwt(token) as { sessionId: string };
        const session = await getCounselorSession(sessionId);

        if (!session) {
          console.error("No session found.");
          return;
        }

        setCounselorProgram(session.program);

        // Fetch appointments ONLY for the counselor's program
        const response = await databases.listDocuments(
          process.env.NEXT_PUBLIC_DATABASE_ID!,
          "6734ba2700064c66818e",
          [
            Query.equal("program", [session.program]), // Filter by program
            Query.orderAsc("date") // Optional: Sort by date
          ]
        );

        setAppointments(response.documents as Appointment[]);
      } catch (error) {
        console.error("Error fetching appointments:", error);
      }
    };

    fetchSessionAndAppointments();
  }, [currentDate]);

  const fetchAppointments = async () => {
    try {
      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_DATABASE_ID!,
        "6734ba2700064c66818e",
        [Query.equal("program", [counselorProgram])]
      );
      setAppointments(response.documents as Appointment[]);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Scheduled": return "bg-blue-100 text-blue-700";
      case "Completed": return "bg-green-100 text-green-700";
      case "Cancelled": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getConcernColor = (concernType: string) => {
    switch (concernType) {
      case "Academic": return "bg-blue-100 text-blue-700";
      case "Career": return "bg-purple-100 text-purple-700";
      case "Personal": return "bg-green-100 text-green-700";
      case "Crisis": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const handleStatusChange = async (appointmentId: string, newStatus: string) => {
    if (newStatus === "Cancelled" || newStatus === "Completed") {
      const appointment = appointments.find(a => a.$id === appointmentId);
      setSelectedAppointmentId(appointmentId);
      setSelectedStatus(newStatus);
      setFollowUpRequired(appointment?.followUpRequired || false);
      setIsModalOpen(true);
    } else {
      try {
        await databases.updateDocument(
          process.env.NEXT_PUBLIC_DATABASE_ID!,
          "6734ba2700064c66818e",
          appointmentId,
          { status: newStatus }
        );
        fetchAppointments();
      } catch (error) {
        console.error("Error updating appointment status:", error);
      }
    }
  };

// Add new state for progress metrics
const [progressMetrics, setProgressMetrics] = useState<{
  goalId: string;
  value: number;
  notes: string;
}[]>([]);

  const handleModalSubmit = async () => {
    if (!selectedAppointmentId || !selectedStatus) return;
    
    try {
      const updateData: any = { 
        status: selectedStatus,
        followUpRequired,
        counselorNotes

      };
      
      if (selectedStatus === "Cancelled") {
        updateData.cancellationReason = cancellationReason;
      } else if (selectedStatus === "Completed") {
        updateData.counselorNotes = counselorNotes;
      }

      await databases.updateDocument(
        process.env.NEXT_PUBLIC_DATABASE_ID!,
        "6734ba2700064c66818e",
        selectedAppointmentId,
        updateData
      );
      fetchAppointments();
    } catch (error) {
      console.error("Error updating appointment:", error);
    } finally {
      setIsModalOpen(false);
      setSelectedAppointmentId(null);
      setSelectedStatus(null);
      setCounselorNotes("");
      setCancellationReason("");
      setFollowUpRequired(false);
    }
  };

  const handleDelete = async (appointmentId: string) => {
    if (confirm("Are you sure you want to delete this appointment?")) {
      try {
        await databases.deleteDocument(
          process.env.NEXT_PUBLIC_DATABASE_ID!,
          "6734ba2700064c66818e",
          appointmentId
        );
        fetchAppointments();
      } catch (error) {
        console.error("Error deleting appointment:", error);
        alert("Failed to delete appointment");
      }
    }
  };

  const renderDayView = () => {
    if (!selectedDate) return null;

    const dayAppointments = appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      return appointmentDate.toDateString() === selectedDate.toDateString();
    });

    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            {format(selectedDate, 'MMMM d, yyyy')}
          </h2>
          <Button 
            variant="outline" 
            onClick={() => setView('month')}
            className="border-gray-300 hover:bg-gray-50 text-black"
          >
            Back to Month View
          </Button>
        </div>

        {dayAppointments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No appointments scheduled for this day
          </div>
        ) : (
          <div className="space-y-3">
            {dayAppointments.map(appointment => (
              <div
                key={appointment.$id}
                className={`p-4 rounded-lg border ${
                  appointment.status === 'Scheduled' ? 'border-blue-200 bg-blue-50' :
                  appointment.status === 'Completed' ? 'border-green-200 bg-green-50' :
                  'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-black">{appointment.patientName}</h3>
                    <p className="text-sm text-gray-600">{appointment.time} ({appointment.duration} mins)</p>
                    <p className="text-sm text-gray-600">{appointment.program}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${getConcernColor(appointment.concernType)}`}>
                    {appointment.concernType}
                  </span>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-black">Notes: {appointment.sessionNotes}</p>
                </div>
                <div className="mt-3 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <select
                      className="border rounded p-1 text-sm"
                      value={appointment.status}
                      onChange={(e) => handleStatusChange(appointment.$id, e.target.value)}
                    >
                      <option value="Scheduled">Scheduled</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                    {appointment.followUpRequired && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                        Follow-up needed
                      </span>
                    )}
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(appointment.status)}`}>
                    {appointment.status}
                  </span>
                </div>
                {appointment.status === "Completed" && appointment.counselorNotes && (
                  <div className="mt-3 p-3 bg-white rounded border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700">Your Notes:</h4>
                    <p className="text-sm text-gray-600 mt-1">{appointment.counselorNotes}</p>
                  </div>
                )}
                {appointment.status === "Cancelled" && appointment.cancellationReason && (
                  <div className="mt-3 p-3 bg-white rounded border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700">Cancellation Reason:</h4>
                    <p className="text-sm text-gray-600 mt-1">{appointment.cancellationReason}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const filteredAppointments = appointments.filter(appointment => 
    statusFilter === "all" ? true : appointment.status === statusFilter
  );

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <CounselorSideBar />
      
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-blue-700">Appointment Calendar</h1>
            <div className="flex items-center gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Scheduled">Scheduled</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                className="flex items-center gap-2 border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                <Filter className="w-4 h-4" />
                Filter
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
            {view === 'month' ? (
              <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-semibold text-gray-800">
                    {format(currentDate, 'MMMM yyyy')}
                  </h2>
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={previousMonth} 
                      className="text-black bg-white"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setCurrentDate(new Date())} 
                      className="text-black bg-white"
                    >
                      Today
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={nextMonth} 
                      className="text-black bg-white"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="bg-gray-50 p-3 text-center text-sm font-semibold text-gray-600">
                      {day}
                    </div>
                  ))}
                  
                  {Array.from({ length: getFirstDayOfMonth(currentDate) }).map((_, i) => (
                    <div key={`empty-${i}`} className="bg-white p-3 h-32" />
                  ))}
                  
                  {Array.from({ length: getDaysInMonth(currentDate) }).map((_, i) => {
                    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i + 1);
                    const dayAppointments = filteredAppointments.filter(appointment => {
                      const appointmentDate = new Date(appointment.date);
                      return appointmentDate.toDateString() === date.toDateString();
                    });
                    const isToday = date.toDateString() === new Date().toDateString();

                    return (
                      <div
                        key={i}
                        className={`bg-white p-3 h-32 hover:bg-gray-50 cursor-pointer border-t ${
                          isToday ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => {
                          setSelectedDate(date);
                          setView('day');
                        }}
                      >
                        <div className={`font-medium ${
                          isToday ? 'text-blue-600' : 'text-gray-700'
                        }`}>
                          {i + 1}
                        </div>
                        <div className="mt-2 space-y-1">
                          {dayAppointments.slice(0, 2).map(appointment => (
                            <div
                              key={appointment.$id}
                              className={`text-xs p-1.5 rounded-md ${getStatusColor(appointment.status)}`}
                            >
                              {appointment.time} - {appointment.patientName}
                            </div>
                          ))}
                          {dayAppointments.length > 2 && (
                            <div className="text-xs font-medium text-gray-500 pl-1">
                              +{dayAppointments.length - 2} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              renderDayView()
            )}
          </div>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {selectedStatus === "Cancelled" ? "Cancel Appointment" : "Complete Session"}
            </DialogTitle>
          </DialogHeader>
          {selectedStatus === "Cancelled" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Reason for Cancellation</Label>
                <Textarea
                  placeholder="Please explain why this appointment is being cancelled..."
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  required
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="followUpRequired"
                  checked={followUpRequired}
                  onCheckedChange={(checked) => setFollowUpRequired(Boolean(checked))}
                />
                <Label htmlFor="followUpRequired">Requires Follow-up</Label>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Session Notes</Label>
                <Textarea
                  placeholder="Enter your notes about this session..."
                  value={counselorNotes}
                  onChange={(e) => setCounselorNotes(e.target.value)}
                  required
                  rows={6}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="followUpRequired"
                  checked={followUpRequired}
                  onCheckedChange={(checked) => setFollowUpRequired(Boolean(checked))}
                />
                <Label htmlFor="followUpRequired">Requires Follow-up</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleModalSubmit}>
              {selectedStatus === "Cancelled" ? "Confirm Cancellation" : "Complete Session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CounselorCalendarPage;