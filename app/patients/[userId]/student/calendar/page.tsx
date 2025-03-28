"use client";

import { useEffect, useState } from "react";
import { Client, Databases, ID, Models } from "appwrite";
import { useParams } from "next/navigation";
import StudentSideBar from "@/components/StudentSideBar";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProfileBadge } from "@/components/ProfileBadge";
import { Checkbox } from "@/components/ui/checkbox"; // Add this line

interface Appointment {
  $id: string;
  reason: string;
  patientName: string;
  date: string;
  time: string;
  status: string;
  userid: string;
  program: string;
  concernType: "Academic" | "Career" | "Personal" | "Crisis";
  followUpRequired: boolean;
  sessionNotes: string;
  counselorNotes?: string;
  duration: number;
}

interface Student {
  $id: string;
  name: string;
  email: string;
  program: string; // Ensure program is included

  // Add other student fields as needed
}

const StudentCalendarPage = () => {
  const params = useParams();
  const userId = params.userId as string;
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [view, setView] = useState<'month' | 'day'>('month');
  const [student, setStudent] = useState<Student | null>(null);
  
  // State for appointment scheduling
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [schedulingDate, setSchedulingDate] = useState<Date | null>(null);
  const [newAppointment, setNewAppointment] = useState({
    patientName: "",
    time: "",
    reason: "",
    status: "Scheduled" as const,
    sessionNotes: "", // Added sessionNotes property
    concernType: "Academic" as const, // Added concernType property with default value
    followUpRequired: false, // Added followUpRequired property with default value
    program: "", // Added program property
    duration: 30 // Added duration property
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_PROJECT_ID!);
  
  const databases = new Databases(client);

  useEffect(() => {
    fetchStudentData();
    fetchAppointments();
  }, [currentDate]);

  const fetchStudentData = async () => {
    try {
      const response = await databases.getDocument(
        process.env.NEXT_PUBLIC_DATABASE_ID!,
        process.env.NEXT_PUBLIC_PATIENT_COLLECTION_ID!,
        userId
      );
      setStudent(response as unknown as Student);
    } catch (error) {
      console.error("Error fetching student data:", error);
    }
  };

  const fetchAppointments = async () => {
    try {
      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_DATABASE_ID!,
        "6734ba2700064c66818e"
      );
      const userAppointments = response.documents
        .filter((doc: any) => doc.userid === userId)
        .map((doc: any) => ({
          ...doc,
          // Map old 'reason' to 'sessionNotes' if empty
          sessionNotes: doc.sessionNotes || doc.reason || '',
          // Default concernType if not set
          concernType: doc.concernType || 'Academic',
          // Default duration if not set
          duration: doc.duration || 30
        }));
      setAppointments(userAppointments as Appointment[]);
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

  // Function to handle opening the schedule modal
  const handleScheduleClick = (date: Date) => {
    setSchedulingDate(date);
    setShowScheduleModal(true);
    // Reset form state with student name pre-filled
    setNewAppointment({
      patientName: student?.name || "",
      time: "",
      reason: "",
      status: "Scheduled",
      program: student?.program || "",
      concernType: "Academic",
      followUpRequired: false,
      sessionNotes: "",
      duration: 30
    });
    setSubmitSuccess(false);
    setSubmitError("");
  };

  // Function to handle appointment form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewAppointment(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Function to handle appointment submission
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
        "6734ba2700064c66818e", // Using the hardcoded appointment collection ID
        ID.unique(),
        {
          patientName: newAppointment.patientName,
          date: formattedDate,
          time: newAppointment.time,
          reason: newAppointment.sessionNotes, // Using sessionNotes as reason for backward compatibility
          status: newAppointment.status,
          userid: userId,
          program: student?.program || "",
          concernType: newAppointment.concernType,
          followUpRequired: newAppointment.followUpRequired,
          sessionNotes: newAppointment.sessionNotes,
          duration: newAppointment.duration
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
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            {format(selectedDate, 'MMMM d, yyyy')}
          </h2>
          <div className="flex gap-3">
            <Button 
              onClick={() => handleScheduleClick(selectedDate)} 
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Schedule Appointment
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setView('month')}
              className="border-gray-300 hover:bg-gray-50 text-black"
            >
              Back to Month
            </Button>
          </div>
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
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${getConcernColor(appointment.concernType)}`}>
                    {appointment.concernType}
                  </span>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-black">{appointment.sessionNotes}</p>
                </div>
                <div className="mt-3 flex justify-between items-center">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(appointment.status)}`}>
                    {appointment.status}
                  </span>
                  {appointment.followUpRequired && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                      Follow-up needed
                    </span>
                  )}
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
        <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-800">
              Schedule Appointment for {format(schedulingDate, 'MMMM d, yyyy')}
            </h2>
            <button 
              onClick={() => setShowScheduleModal(false)}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmitAppointment} className="p-6 space-y-4">
            <div className="space-y-2 text-sm font-medium text-black">
              <Label htmlFor="patientName">Student Name</Label>
              <Input
                id="patientName"
                name="patientName"
                value={newAppointment.patientName}
                readOnly
                className="bg-gray-50 text-black"
              />
            </div>

            <div className="space-y-2 text-sm font-medium text-black">
              <Label htmlFor="program">Program</Label>
              <Input
                id="program"
                name="program"
                value={student?.program || ""}
                readOnly
                className="bg-gray-50 text-black w-full " 
              />
            </div>

            <div className="grid grid-cols-2 gap-4 text-black">
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input
                  className="text-white"
                  id="time"
                  name="time"
                  type="time"
                  value={newAppointment.time}
                  onChange={(e) => setNewAppointment({...newAppointment, time: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2 text-gray-800">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  className="text-white"
                  id="duration"
                  name="duration"
                  type="number"
                  min="15"
                  max="120"
                  step="15"
                  value={newAppointment.duration}
                  onChange={(e) => setNewAppointment({...newAppointment, duration: Number(e.target.value)})}
                  required
                />
              </div>
            </div>

            <div className="space-y-2 text-black">
              <Label htmlFor="concernType">Concern Type</Label>
              <Select
                value={newAppointment.concernType}
                onValueChange={(value) => setNewAppointment({...newAppointment, concernType: value as any})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select concern type" />
                </SelectTrigger>
                <SelectContent className="text-black bg-white">
                  <SelectItem value="Academic">Academic</SelectItem>
                  <SelectItem value="Career">Career</SelectItem>
                  <SelectItem value="Personal">Personal</SelectItem>
                  <SelectItem value="Crisis">Crisis (Urgent)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 text-black">
              <Checkbox 
                id="followUpRequired"
                checked={newAppointment.followUpRequired}
                onCheckedChange={(checked) => setNewAppointment({...newAppointment, followUpRequired: Boolean(checked)})}
              />
              <Label htmlFor="followUpRequired">Requires Follow-up</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sessionNotes">Session Notes</Label>
              <Textarea
                id="sessionNotes"
                name="sessionNotes"
                value={newAppointment.sessionNotes}
                onChange={(e) => setNewAppointment({...newAppointment, sessionNotes: e.target.value})}
                placeholder="Describe your concerns..."
                rows={4}
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

            <div className="flex justify-end pt-4 space-x-3 text-black">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowScheduleModal(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
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
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <StudentSideBar userId={userId} />
        
        {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          
          {/* Header Section */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-blue-700">My Calendar</h1>
            <p className="text-gray-600 mt-2">View and schedule your appointments</p>
            {student && <p className="text-gray-600">Welcome, {student.name}</p>}
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

export default StudentCalendarPage; 