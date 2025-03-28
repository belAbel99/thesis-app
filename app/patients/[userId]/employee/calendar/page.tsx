"use client";

import { useEffect, useState } from "react";
import { Client, Databases, ID, Models } from "appwrite";
import { useParams } from "next/navigation";
import EmployeeSideBar from "@/components/EmployeeSideBar";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";

interface Appointment {
  $id: string;
  patientName: string;
  date: string;
  time: string;
  reason: string;
  status: "Scheduled" | "Completed" | "Cancelled";
  userid: string;
}

interface Employee {
  $id: string;
  name: string;
  email: string;
  // Add other employee fields as needed
}

const EmployeeCalendarPage = () => {
  const params = useParams();
  const userId = params.userId as string;
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [view, setView] = useState<'month' | 'day'>('month');
  const [employee, setEmployee] = useState<Employee | null>(null);
  
  // New state for appointment scheduling
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [schedulingDate, setSchedulingDate] = useState<Date | null>(null);
  const [newAppointment, setNewAppointment] = useState({
    patientName: "",
    time: "",
    reason: "",
    status: "Scheduled" as const
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_PROJECT_ID!);
  
  const databases = new Databases(client);

  useEffect(() => {
    fetchEmployeeData();
    fetchAppointments();
  }, [currentDate]);

  const fetchEmployeeData = async () => {
    try {
      const response = await databases.getDocument(
        process.env.NEXT_PUBLIC_DATABASE_ID!,
        process.env.NEXT_PUBLIC_PATIENT_COLLECTION_ID!,
        userId
      );
      setEmployee(response as unknown as Employee);
    } catch (error) {
      console.error("Error fetching employee data:", error);
    }
  };

  const fetchAppointments = async () => {
    try {
      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_DATABASE_ID!,
        "67b96b0800349392bb1c" // Using the hardcoded appointment collection ID
      );
      // Filter appointments for the current user
      const userAppointments = response.documents.filter(
        (doc: any) => doc.userid === userId
      ) as unknown as Appointment[];
      setAppointments(userAppointments);
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

  // New function to handle opening the schedule modal
  const handleScheduleClick = (date: Date) => {
    setSchedulingDate(date);
    setShowScheduleModal(true);
    // Reset form state with employee name pre-filled
    setNewAppointment({
      patientName: employee?.name || "",
      time: "",
      reason: "",
      status: "Scheduled"
    });
    setSubmitSuccess(false);
    setSubmitError("");
  };

  // New function to handle appointment form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewAppointment(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // New function to handle appointment submission
  const handleSubmitAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!schedulingDate) return;
    
    setIsSubmitting(true);
    setSubmitError("");
    
    try {
      // Format the date as YYYY-MM-DD
      const formattedDate = format(schedulingDate, 'yyyy-MM-dd');
      
      // Create the appointment in the database
      await databases.createDocument(
        process.env.NEXT_PUBLIC_DATABASE_ID!,
        "67b96b0800349392bb1c",
        ID.unique(),
        {
          patientName: newAppointment.patientName,
          date: formattedDate,
          time: newAppointment.time,
          reason: newAppointment.reason,
          status: newAppointment.status,
          userid: userId
        }
      );
      
      // Show success message
      setSubmitSuccess(true);
      
      // Refresh appointments
      fetchAppointments();
      
      // Close modal after a delay
      setTimeout(() => {
        setShowScheduleModal(false);
      }, 2000);
      
    } catch (error) {
      console.error("Error creating appointment:", error);
      setSubmitError("Failed to create appointment. Please try again.");
    } finally {
      setIsSubmitting(false);
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
          <div className="flex gap-3">
            <Button 
              onClick={() => handleScheduleClick(selectedDate)} 
              className="bg-blue-700 hover:bg-blue-600 text-white"
            >
              Schedule Appointment
            </Button>
            <Button variant="outline" onClick={() => setView('month')} className="text-black bg-white">
              Back to Month View
            </Button>
          </div>
        </div>

        {dayAppointments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No appointments scheduled for this day
          </div>
        ) : (
          <div className="space-y-4">
            {dayAppointments.map(appointment => (
              <div
                key={appointment.$id}
                className={`p-4 rounded-lg ${getStatusColor(appointment.status)}`}
              >
                <div>
                  <h3 className="font-semibold">{appointment.patientName}</h3>
                  <p className="text-sm">Time: {appointment.time}</p>
                  <p className="text-sm mt-1">Reason: {appointment.reason}</p>
                  <p className="text-sm">Status: {appointment.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Schedule appointment modal
  const renderScheduleModal = () => {
    if (!showScheduleModal || !schedulingDate) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-800">
              Schedule Appointment for {format(schedulingDate, 'MMMM d, yyyy')}
            </h2>
            <button 
              onClick={() => setShowScheduleModal(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmitAppointment} className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="patientName">Patient Name</Label>
              <Input
                id="patientName"
                name="patientName"
                value={newAppointment.patientName}
                onChange={handleInputChange}
                placeholder="Enter patient name"
                required
                readOnly
                className="bg-gray-100"
              />
              <p className="text-xs text-gray-500">Name is automatically filled based on your account</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                name="time"
                type="time"
                value={newAppointment.time}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Appointment</Label>
              <Textarea
                id="reason"
                name="reason"
                value={newAppointment.reason}
                onChange={handleInputChange}
                placeholder="Describe the reason for this appointment"
                required
                rows={3}
              />
            </div>
            
            {submitError && (
              <div className="p-3 bg-red-100 text-red-700 rounded-md">
                {submitError}
              </div>
            )}
            
            {submitSuccess && (
              <div className="p-3 bg-green-100 text-green-700 rounded-md">
                Appointment scheduled successfully!
              </div>
            )}
            
            <div className="flex justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowScheduleModal(false)}
                className="mr-2"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="bg-blue-700 hover:bg-blue-600 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Scheduling..." : "Schedule Appointment"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <EmployeeSideBar userId={userId} />
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-blue-700">My Calendar</h1>
            <p className="text-gray-600 mt-2">View and schedule your appointments</p>
            {employee && <p className="text-gray-600">Welcome, {employee.name}</p>}
          </div>

          {/* Calendar Container */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {view === 'month' ? (
              <div className="p-6">
                {/* Month Navigation */}
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

                {/* Calendar Grid */}
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
                    const dayAppointments = appointments.filter(appointment => {
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
                      >
                        <div 
                          className={`font-medium ${
                            isToday ? 'text-blue-600' : 'text-gray-700'
                          }`}
                          onClick={() => {
                            setSelectedDate(date);
                            setView('day');
                          }}
                        >
                          {i + 1}
                        </div>
                        <div className="mt-2 space-y-1">
                          {dayAppointments.slice(0, 2).map(appointment => (
                            <div
                              key={appointment.$id}
                              className={`text-xs p-1.5 rounded-md ${getStatusColor(appointment.status)}`}
                              onClick={() => {
                                setSelectedDate(date);
                                setView('day');
                              }}
                            >
                              {appointment.time} - {appointment.patientName}
                            </div>
                          ))}
                          {dayAppointments.length > 2 && (
                            <div 
                              className="text-xs font-medium text-gray-500 pl-1"
                              onClick={() => {
                                setSelectedDate(date);
                                setView('day');
                              }}
                            >
                              +{dayAppointments.length - 2} more
                            </div>
                          )}
                          <div 
                            className="mt-1 text-xs text-blue-600 hover:underline cursor-pointer"
                            onClick={() => handleScheduleClick(date)}
                          >
                            + Add appointment
                          </div>
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
      
      {/* Render the schedule modal */}
      {renderScheduleModal()}
    </div>
  );
};

export default EmployeeCalendarPage; 