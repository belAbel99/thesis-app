"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { Client, Databases, Query } from "appwrite";
import SideBar from "@/components/CounselorSideBar";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getCounselorSession } from "@/lib/actions/counselor.actions"; // Ensure this import is correct and the function exists in the specified path
import { decodeJwt } from "jose";

interface Appointment {
  $id: string;
  patientName: string;
  date: string;
  time: string;
  reason: string;
  status: "Scheduled" | "Completed" | "Cancelled";
  userid: string;
  cancellationReason?: string;
  diagnosis?: {
    bloodPressure: string;
    chiefComplaint: string;
    notes: string;
  };
}

const CounselorCalendarPage = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [counselorProgram, setCounselorProgram] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [view, setView] = useState<'month' | 'day'>('month');
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<"Cancelled" | "Completed" | null>(null);
  const [bloodPressure, setBloodPressure] = useState("");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [notes, setNotes] = useState("");
  const [cancellationReason, setCancellationReason] = useState("");

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
        "6734ba2700064c66818e"
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
      case "Scheduled":
        return "bg-blue-100 text-blue-700";
      case "Completed":
        return "bg-green-100 text-green-700";
      case "Cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const handleStatusChange = async (appointmentId: string, newStatus: string) => {
    if (newStatus === "Cancelled" || newStatus === "Completed") {
      setSelectedAppointmentId(appointmentId);
      setSelectedStatus(newStatus);
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
        alert("Failed to update appointment status");
      }
    }
  };

  const handleModalSubmit = async () => {
    if (!selectedAppointmentId || !selectedStatus) return;

    try {
      const updateData: any = { status: selectedStatus };
      if (selectedStatus === "Cancelled") {
        updateData.cancellationReason = cancellationReason;
      } else if (selectedStatus === "Completed") {
        const truncatedNotes = notes.length > 500 ? notes.substring(0, 500) + "..." : notes;
        const diagnosisData = JSON.stringify({
          bloodPressure,
          chiefComplaint,
          notes: truncatedNotes,
        });

        if (diagnosisData.length > 1000) {
          throw new Error("Diagnosis data exceeds the maximum length of 255 characters.");
        }

        updateData.diagnosis = diagnosisData;
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
      alert("Failed to update appointment. Diagnosis data may be too long.");
    } finally {
      setIsModalOpen(false);
      setSelectedAppointmentId(null);
      setSelectedStatus(null);
      setBloodPressure("");
      setChiefComplaint("");
      setNotes("");
      setCancellationReason("");
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
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-700">
            {format(selectedDate, 'MMMM d, yyyy')}
          </h2>
          <Button variant="outline" onClick={() => setView('month')}>
            Back to Month View
          </Button>
        </div>

        <div className="space-y-4">
          {dayAppointments.map(appointment => (
            <div
              key={appointment.$id}
              className={`p-4 rounded-lg ${getStatusColor(appointment.status)} flex justify-between items-center`}
            >
              <div>
                <h3 className="font-semibold">{appointment.patientName}</h3>
                <p className="text-sm">Time: {appointment.time}</p>
                <p className="text-sm">Program: {appointment.program}</p>
                <p className="text-sm mt-1">Reason: {appointment.reason}</p>
                <p className="text-sm">Status: {appointment.status}</p>
                {appointment.status === "Cancelled" && appointment.cancellationReason && (
                  <p className="text-sm text-gray-500 mt-1">Reason: {appointment.cancellationReason}</p>
                )}
                {appointment.status === "Completed" && appointment.diagnosis && (
                  <div className="mt-2">
                    <p className="text-sm"><strong>Blood Pressure:</strong> {JSON.parse(appointment.diagnosis).bloodPressure}</p>
                    <p className="text-sm"><strong>Chief Complaint:</strong> {JSON.parse(appointment.diagnosis).chiefComplaint}</p>
                    <p className="text-sm"><strong>Notes:</strong> {JSON.parse(appointment.diagnosis).notes}</p>
                    {JSON.parse(appointment.diagnosis).notes.endsWith("...") && (
                      <p className="text-xs text-gray-500">(Notes truncated due to length restrictions)</p>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <select
                  className="border rounded p-1 mr-2"
                  value={appointment.status}
                  onChange={(e) => handleStatusChange(appointment.$id, e.target.value)}
                >
                  <option value="Scheduled">Scheduled</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="text-red-500"
                  onClick={() => handleDelete(appointment.$id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const filteredAppointments = appointments.filter(appointment => 
    statusFilter === "all" ? true : appointment.status === statusFilter
  );

  return (
    <div className="flex h-screen bg-gray-100">
      <SideBar />
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-blue-700">Appointment Calendar</h1>
            <div className="flex items-center gap-4">
              <select
                className="border rounded-lg px-3 py-2 bg-white text-black"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              <Button variant="outline" className="flex items-center gap-2 text-black bg-white">
                <Filter className="w-4 h-4" />
                Filter
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
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

                <div className="grid grid-cols-7 gap-px bg-gray-200">
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
                        onClick={() => {
                          setSelectedDate(date);
                          setView('day');
                        }}
                        className={`bg-white p-3 h-32 hover:bg-gray-50 cursor-pointer border-t ${
                          isToday ? 'bg-blue-50' : ''
                        }`}
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

      <Dialog open={isModalOpen} onOpenChange={(isOpen) => {
          if (!isOpen) {
            setIsModalOpen(false);
            setBloodPressure("");
            setChiefComplaint("");
            setNotes("");
            setCancellationReason("");
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedStatus === "Cancelled" ? "Cancellation Reason" : "Diagnosis Details"}
              </DialogTitle>
            </DialogHeader>
            {selectedStatus === "Cancelled" ? (
              <div className="space-y-4">
                <Textarea
                  placeholder="Enter cancellation reason..."
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <Input
                  placeholder="Blood Pressure"
                  value={bloodPressure}
                  onChange={(e) => setBloodPressure(e.target.value)}
                />
                <Select value={chiefComplaint} onValueChange={(value) => setChiefComplaint(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Chief Complaint" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fever">Fever</SelectItem>
                    <SelectItem value="Cough">Cough</SelectItem>
                    <SelectItem value="Headache">Headache</SelectItem>
                    <SelectItem value="Stomachache">Stomachache</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Textarea
                  placeholder="Notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                {notes.length > 100 && (
                  <p className="text-xs text-red-500">
                    Notes will be truncated to 100 characters to fit within the 255-character limit.
                  </p>
                )}
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button onClick={handleModalSubmit}>Submit</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  );
};

export default CounselorCalendarPage;