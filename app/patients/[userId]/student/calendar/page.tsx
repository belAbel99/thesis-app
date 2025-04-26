"use client";

import { useEffect, useState } from "react";
import { Client, Databases, ID, Models, Query } from "appwrite";
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
import { getStudentGoals } from "@/lib/actions/progress.actions";
import { Checkbox } from "@/components/ui/checkbox";
import { generateQRCode } from "@/lib/actions/qr.actions";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";

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
  goals: string[];
  progressNotes: string;
  counselorId: string;
}

interface Student {
  $id: string;
  name: string;
  email: string;
  program: string;
}

interface TimeSlot {
  $id: string;
  date: string;
  time: string;
  maxCapacity: number;
  isAvailable: boolean;
  counselorId: string;
  program: string;
}

// Time slot configuration
const WORKING_HOURS = {
  start: 8,  // 8 AM
  end: 17,   // 5 PM
};

const SLOT_DURATION = 30; // minutes
const MAX_STUDENTS_PER_SLOT = 3;

const StudentCalendarPage = () => {
  const params = useParams();
  const userId = params.userId as string;
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [view, setView] = useState<'month' | 'day'>('month');
  const [student, setStudent] = useState<Student | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [schedulingDate, setSchedulingDate] = useState<Date | null>(null);
  const [newAppointment, setNewAppointment] = useState({
    patientName: "",
    time: "",
    reason: "",
    status: "Scheduled" as const,
    sessionNotes: "",
    concernType: "Academic" as const,
    followUpRequired: false,
    program: "",
    duration: SLOT_DURATION,
    progressNotes: "",
    goals: [] as string[],
    counselorId: "",
    date: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<{
    qrCodeUrl: string;
    appointmentId: string;
  } | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [availableSlotsLoading, setAvailableSlotsLoading] = useState(false);
  const [availableSlotsError, setAvailableSlotsError] = useState("");
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_PROJECT_ID!);
  
  const databases = new Databases(client);

  useEffect(() => {
    fetchStudentData();
    fetchAppointments();
    fetchTimeSlots();
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
          sessionNotes: doc.sessionNotes || doc.reason || '',
          concernType: doc.concernType || 'Academic',
          duration: doc.duration || SLOT_DURATION
        }));
      setAppointments(userAppointments as Appointment[]);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
  };

  const fetchTimeSlots = async () => {
    try {
      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_DATABASE_ID!,
        process.env.NEXT_PUBLIC_TIMESLOTS_COLLECTION_ID!,
        [Query.limit(100)]
      );
      setTimeSlots(response.documents as TimeSlot[]);
    } catch (error) {
      console.error("Error fetching time slots:", error);
    }
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = WORKING_HOURS.start; hour <= WORKING_HOURS.end; hour++) {
      for (let minute = 0; minute < 60; minute += SLOT_DURATION) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  };

  const getAvailableSlots = async (date: Date) => {
    if (!date) return [];
    
    setAvailableSlotsLoading(true);
    setAvailableSlotsError("");
    
    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      
      // Get all appointments for this date
      const appointmentsResponse = await databases.listDocuments(
        process.env.NEXT_PUBLIC_DATABASE_ID!,
        "6734ba2700064c66818e",
        [Query.equal("date", [formattedDate])]
      );
      
      // Get time slot configurations for this date
      const slotsResponse = await databases.listDocuments(
        process.env.NEXT_PUBLIC_DATABASE_ID!,
        process.env.NEXT_PUBLIC_TIMESLOTS_COLLECTION_ID!,
        [Query.equal("date", [formattedDate])]
      );
      
      const allSlots = generateTimeSlots();
      const slotCounts: Record<string, number> = {};
      const slotConfigs: Record<string, TimeSlot> = {};
      
      // Initialize all slots
      allSlots.forEach(slot => {
        slotCounts[slot] = 0;
      });
      
      // Count appointments for each slot
      appointmentsResponse.documents.forEach((appt: any) => {
        slotCounts[appt.time] = (slotCounts[appt.time] || 0) + 1;
      });
      
      // Store slot configurations
      slotsResponse.documents.forEach((slot: any) => {
        slotConfigs[slot.time] = slot;
      });
      
      // Filter available slots
      const available = allSlots.filter(slot => {
        const config = slotConfigs[slot];
        const count = slotCounts[slot] || 0;
        
        // If slot is explicitly blocked
        if (config && config.isAvailable === false) return false;
        
        // If slot has custom capacity
        if (config && config.maxCapacity) {
          return count < config.maxCapacity;
        }
        
        // Default case
        return count < MAX_STUDENTS_PER_SLOT;
      });
      
      setAvailableSlots(available);
      return available;
    } catch (error) {
      console.error("Error fetching available slots:", error);
      setAvailableSlotsError("Failed to load available time slots");
      return [];
    } finally {
      setAvailableSlotsLoading(false);
    }
  };

  const isSlotBlocked = (date: string, time: string) => {
    return timeSlots.some(
      slot => slot.date === date && 
             slot.time === time && 
             slot.isAvailable === false
    );
  };

  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
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

  const handleScheduleClick = async (date: Date) => {
    // Check if date is in the past
    if (isPastDate(date)) {
      setSubmitError("You can only schedule appointments for today or future dates");
      return;
    }

    setSchedulingDate(date);
    setShowScheduleModal(true);
    
    setNewAppointment({
      patientName: student?.name || "",
      time: "",
      reason: "",
      status: "Scheduled",
      program: student?.program || "",
      concernType: "Academic",
      followUpRequired: false,
      sessionNotes: "",
      duration: SLOT_DURATION,
      progressNotes: "",
      goals: [],
      counselorId: "",
      date: format(date, 'yyyy-MM-dd')
    });
    
    setSubmitSuccess(false);
    setSubmitError("");
    
    await getAvailableSlots(date);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewAppointment(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!schedulingDate) return;
    
    if (!newAppointment.time) {
      setSubmitError("Please select a time slot");
      return;
    }
    
    // Check if student already has an appointment at this time
    const existingAppointment = appointments.find(appt => 
      appt.date === format(schedulingDate, 'yyyy-MM-dd') && 
      appt.time === newAppointment.time
    );

    if (existingAppointment) {
      setSubmitError("You already have an appointment scheduled for this time slot");
      return;
    }

    // Double-check slot availability
    const slots = await getAvailableSlots(schedulingDate);
    if (!slots.includes(newAppointment.time)) {
      setSubmitError("This time slot is no longer available");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");
    
    try {
      const formattedDate = format(schedulingDate, 'yyyy-MM-dd');
      
      const counselors = await databases.listDocuments(
        process.env.NEXT_PUBLIC_DATABASE_ID!,
        process.env.NEXT_PUBLIC_COUNSELOR_COLLECTION_ID!,
        [
          Query.equal("program", [student?.program || ""]),
          Query.limit(1)
        ]
      );
  
      if (counselors.documents.length === 0) {
        throw new Error("No counselor assigned to this program");
      }
  
      const counselorId = counselors.documents[0].$id;
  
      const appointment = await databases.createDocument(
        process.env.NEXT_PUBLIC_DATABASE_ID!,
        "6734ba2700064c66818e",
        ID.unique(),
        {
          patientName: newAppointment.patientName,
          date: formattedDate,
          time: newAppointment.time,
          reason: newAppointment.sessionNotes,
          status: newAppointment.status,
          userid: userId,
          program: student?.program || "",
          concernType: newAppointment.concernType,
          followUpRequired: newAppointment.followUpRequired,
          sessionNotes: newAppointment.sessionNotes,
          duration: newAppointment.duration,
          goals: newAppointment.goals,
          progressNotes: newAppointment.progressNotes,
          counselorId
        }
      );
  
      const qrCodeUrl = await generateQRCode({
        appointmentId: appointment.$id,
        studentId: userId,
        date: formattedDate,
        time: newAppointment.time,
        program: student?.program || "",
        counselorId: counselorId
      });

      await databases.updateDocument(
        process.env.NEXT_PUBLIC_DATABASE_ID!,
        "6734ba2700064c66818e",
        appointment.$id,
        { qrCodeUrl }
      );

      await databases.createDocument(
        process.env.NEXT_PUBLIC_DATABASE_ID!,
        "67f2970e00143006a1fb",
        ID.unique(),
        {
          appointmentId: appointment.$id,
          studentId: userId,
          qrCodeData: JSON.stringify({
            appointmentId: appointment.$id,
            studentId: userId,
            date: formattedDate,
            time: newAppointment.time
          }),
          qrCodeImage: qrCodeUrl,
          status: "generated",
          qrCodeUrl
        }
      );

      setSubmitSuccess(true);
      setQrCodeData({
        qrCodeUrl,
        appointmentId: appointment.$id
      });
      setShowQRModal(true);
      fetchAppointments();
      
    } catch (error) {
      console.error("Error creating appointment:", error);
      setSubmitError(error instanceof Error ? error.message : "Failed to create appointment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const [availableGoals, setAvailableGoals] = useState<any[]>([]);

  useEffect(() => {
    const fetchGoals = async () => {
      if (student) {
        const goals = await getStudentGoals(student.$id);
        setAvailableGoals(goals);
      }
    };
    fetchGoals();
  }, [student]);

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
            {!isPastDate(selectedDate) && (
              <Button 
                onClick={() => handleScheduleClick(selectedDate)} 
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Schedule Appointment
              </Button>
            )}
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

  const renderScheduleModal = () => {
    if (!showScheduleModal || !schedulingDate) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-white rounded-xl shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
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
            <div className="space-y-2">
              <Label className="text-gray-800">Student Name</Label>
              <Input
                value={newAppointment.patientName}
                readOnly
                className="bg-gray-50 text-gray-800"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-800">Program</Label>
              <Input
                value={student?.program || ""}
                readOnly
                className="bg-gray-50 text-gray-800"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-800">Available Time Slots</Label>
              {availableSlotsLoading ? (
                <p className="text-sm text-gray-500">Loading available slots...</p>
              ) : availableSlotsError ? (
                <p className="text-sm text-red-500">{availableSlotsError}</p>
              ) : availableSlots.length === 0 ? (
                <p className="text-sm text-red-500">No available slots for this date</p>
              ) : (
                <div className="grid grid-cols-3 gap-2 text-black">
                  {availableSlots.map(slot => {
                    const isBlocked = isSlotBlocked(format(schedulingDate, 'yyyy-MM-dd'), slot);
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => !isBlocked && setNewAppointment(prev => ({
                          ...prev,
                          time: slot,
                          duration: SLOT_DURATION
                        }))}
                        className={`p-2 border rounded-md text-sm ${
                          newAppointment.time === slot 
                            ? 'bg-indigo-100 border-indigo-500 text-indigo-700' 
                            : isBlocked
                              ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                              : 'border-gray-300 hover:bg-gray-50'
                        }`}
                        disabled={isBlocked}
                      >
                        {slot}
                        {isBlocked && <span className="block text-xs">Unavailable</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-gray-800">Duration</Label>
              <Input
                value={`${SLOT_DURATION} minutes`}
                readOnly
                className="bg-gray-50 text-gray-800"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-800">Concern Type</Label>
              <Select
                value={newAppointment.concernType}
                onValueChange={(value) => setNewAppointment({
                  ...newAppointment,
                  concernType: value as any
                })}
              >
                <SelectTrigger className="text-gray-800">
                  <SelectValue placeholder="Select concern type" />
                </SelectTrigger>
                <SelectContent className="text-gray-800 bg-white">
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
                onCheckedChange={(checked) => setNewAppointment({
                  ...newAppointment,
                  followUpRequired: Boolean(checked)
                })}
              />
              <Label htmlFor="followUpRequired" className="text-black">
                Requires Follow-up
              </Label>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-800">Session Notes</Label>
              <Textarea
                value={newAppointment.sessionNotes}
                onChange={(e) => setNewAppointment({
                  ...newAppointment,
                  sessionNotes: e.target.value
                })}
                placeholder="Describe your concerns..."
                rows={4}
                className="text-white"
                required
              />
            </div>

            {availableGoals.length > 0 && (
              <div className="space-y-2">
                <Label className="text-gray-800">Related Goals (optional)</Label>
                <Select
                  onValueChange={(value) => {
                    if (!newAppointment.goals.includes(value)) {
                      setNewAppointment({
                        ...newAppointment,
                        goals: [...newAppointment.goals, value]
                      });
                    }
                  }}
                >
                  <SelectTrigger className="text-gray-800">
                    <SelectValue placeholder="Select goals to associate" />
                  </SelectTrigger>
                  <SelectContent className="text-gray-800 bg-white">
                    {availableGoals.map((goal) => (
                      <SelectItem key={goal.$id} value={goal.$id}>
                        {goal.title} ({goal.progress}%)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-2 mt-2">
                  {newAppointment.goals.map((goalId) => {
                    const goal = availableGoals.find(g => g.$id === goalId);
                    return goal ? (
                      <span 
                        key={goalId}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                      >
                        {goal.title}
                        <button
                          type="button"
                          onClick={() => setNewAppointment({
                            ...newAppointment,
                            goals: newAppointment.goals.filter(id => id !== goalId)
                          })}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-gray-800">Progress Notes (optional)</Label>
              <Textarea
                value={newAppointment.progressNotes}
                onChange={(e) => setNewAppointment({
                  ...newAppointment,
                  progressNotes: e.target.value
                })}
                placeholder="Any initial notes about your progress..."
                rows={3}
                className="text-white"
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

            <div className="flex justify-end pt-4 space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowScheduleModal(false)}
                className="border-gray-300 hover:bg-gray-50 text-gray-800"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={isSubmitting || availableSlots.length === 0}
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
        
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-blue-700">My Calendar</h1>
            <p className="text-gray-600 mt-2">View and schedule your appointments</p>
            {student && <p className="text-gray-600">Welcome, {student.name}</p>}
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
                    const formattedDate = format(date, 'yyyy-MM-dd');
                    const dayAppointments = appointments.filter(appointment => {
                      const appointmentDate = new Date(appointment.date);
                      return appointmentDate.toDateString() === date.toDateString();
                    });
                    const isToday = date.toDateString() === new Date().toDateString();
                    const hasBlockedSlots = timeSlots.some(
                      slot => slot.date === formattedDate && slot.isAvailable === false
                    );
                    const isPast = isPastDate(date);

                    return (
                      <div
                        key={i}
                        className={`bg-white p-3 h-32 ${isPast ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'} border-t ${
                          isToday ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div 
                          className={`font-medium ${
                            isToday ? 'text-blue-600' : isPast ? 'text-gray-400' : 'text-gray-700'
                          }`}
                          onClick={!isPast ? () => {
                            setSelectedDate(date);
                            setView('day');
                          } : undefined}
                        >
                          {i + 1}
                          {hasBlockedSlots && (
                            <span className="block h-1 w-1 bg-red-500 rounded-full mx-auto mt-1"></span>
                          )}
                        </div>
                        {!isPast && (
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
                        )}
                        {isPast && (
                          <div className="text-xs text-gray-400 mt-2">Not available</div>
                        )}
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
      
      {renderScheduleModal()}

      {showQRModal && qrCodeData && (
        <QRCodeDisplay
          qrCodeUrl={qrCodeData.qrCodeUrl}
          appointmentDetails={{
            date: newAppointment.date,
            time: newAppointment.time,
            reason: newAppointment.sessionNotes
          }}
          onClose={() => setShowQRModal(false)}
        />
      )}
    </div>
  );
};

export default StudentCalendarPage;