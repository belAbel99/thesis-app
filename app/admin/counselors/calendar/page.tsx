"use client";

import { useEffect, useState } from "react";
import { Client, Databases, Query, ID } from "appwrite";
import CounselorSideBar from "@/components/CounselorSideBar";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Filter, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getCounselorSession } from "@/lib/actions/counselor.actions";
import Cookies from "js-cookie";
import { decodeJwt } from "jose";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Time slot configuration
const WORKING_HOURS = {
  start: 8,  // 8 AM
  end: 17,   // 5 PM
};

const SLOT_DURATION = 60; // minutes - CHANGED FROM 30 TO 60
const DEFAULT_MAX_CAPACITY = 2; // CHANGED FROM 3 TO 2

interface Appointment {
  $id: string;
  patientName: string;
  date: string;
  time: string;
  status: "Scheduled" | "Completed" | "Cancelled" | "Pending";
  userid: string;
  program: string;
  concernType: "Academic" | "Career" | "Personal" | "Crisis";
  followUpRequired: boolean;
  sessionNotes: string;
  counselorNotes?: string;
  duration: number;
  cancellationReason?: string;
  goals?: string[];
  progressNotes?: string;
  counselorId: string;
}

interface Goal {
  $id: string;
  title: string;
  description: string;
  progress: number;
  status: string;
  targetDate: string;
  metricType: string;
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

const CounselorCalendarPage = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [counselorProgram, setCounselorProgram] = useState<string>("");
  const [currentCounselorId, setCurrentCounselorId] = useState<string>("");
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
  const [progressNotes, setProgressNotes] = useState("");
  const [studentGoals, setStudentGoals] = useState<Goal[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [goalProgressUpdates, setGoalProgressUpdates] = useState<Record<string, number>>({});
  const [students, setStudents] = useState<Record<string, Student>>({});
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [showSlotManagement, setShowSlotManagement] = useState(false);
  const [newSlot, setNewSlot] = useState({
    date: "",
    time: "",
    maxCapacity: DEFAULT_MAX_CAPACITY,
    isAvailable: true
  });
  const [isLoading, setIsLoading] = useState(false);

  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_PROJECT_ID!);

  const databases = new Databases(client);

  useEffect(() => {
    const fetchSessionAndData = async () => {
      const token = Cookies.get("counselorToken");

      if (!token) {
        console.error("No token found in cookies.");
        toast.error("Authentication required");
        return;
      }

      try {
        setIsLoading(true);
        // Get counselor session
        const { sessionId } = decodeJwt(token) as { sessionId: string };
        const session = await getCounselorSession(sessionId);

        if (!session) {
          console.error("No session found.");
          toast.error("Counselor session not found");
          return;
        }

        setCounselorProgram(session.program);
        setCurrentCounselorId(session.counselorId);

        // Fetch appointments
        const appointmentsResponse = await databases.listDocuments(
          process.env.NEXT_PUBLIC_DATABASE_ID!,
          "6734ba2700064c66818e",
          [
            Query.equal("program", [session.program]),
            Query.orderAsc("date"),
            Query.orderAsc("time")
          ]
        );

        const appointmentsData = appointmentsResponse.documents as Appointment[];
        setAppointments(appointmentsData);

        // Fetch students
        const studentIds = Array.from(new Set(appointmentsData.map(appt => appt.userid)));
        const studentsData: Record<string, Student> = {};
        
        for (const studentId of studentIds) {
          try {
            const student = await databases.getDocument(
              process.env.NEXT_PUBLIC_DATABASE_ID!,
              process.env.NEXT_PUBLIC_PATIENT_COLLECTION_ID!,
              studentId
            );
            studentsData[studentId] = student as unknown as Student;
          } catch (error) {
            console.error(`Error fetching student ${studentId}:`, error);
          }
        }
        
        setStudents(studentsData);

        // Fetch time slots
        const slotsResponse = await databases.listDocuments(
          process.env.NEXT_PUBLIC_DATABASE_ID!,
          process.env.NEXT_PUBLIC_TIMESLOTS_COLLECTION_ID!,
          [
            Query.equal("program", [session.program]),
            Query.equal("counselorId", [session.counselorId]),
            Query.limit(100)
          ]
        );
        setTimeSlots(slotsResponse.documents as TimeSlot[]);

      } catch (error) {
        console.error("Error initializing data:", error);
        toast.error("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessionAndData();
  }, []);

  // Generate time slots for a day
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = WORKING_HOURS.start; hour <= WORKING_HOURS.end; hour++) {
    // Only create slots on the hour (no minute intervals)
    const time = `${hour.toString().padStart(2, '0')}:00`;
    slots.push(time);
  }
  return slots;
};

  // Get slot configuration for a specific time
  const getSlotConfig = (time: string) => {
    if (!selectedDate) return null;
    const formattedDate = format(selectedDate, 'yyyy-MM-dd');
    return timeSlots.find(slot => 
      slot.date === formattedDate && slot.time === time
    );
  };

  // Get available slots for a specific date
  const getAvailableSlots = async (date: Date) => {
    if (!date) return [];
    
    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      
      // Get all appointments for this date
      const appointmentsResponse = await databases.listDocuments(
        process.env.NEXT_PUBLIC_DATABASE_ID!,
        "6734ba2700064c66818e",
        [
          Query.equal("date", [formattedDate]),
          Query.equal("program", [counselorProgram])
        ]
      );
      
      // Get time slots configuration for this date
      const slotsForDate = timeSlots.filter(slot => slot.date === formattedDate);
      
      const allPossibleSlots = generateTimeSlots();
      const slotCounts: Record<string, number> = {};
      
      // Initialize all slots
      allPossibleSlots.forEach(slot => {
        slotCounts[slot] = 0;
      });
      
      // Count appointments for each slot
      appointmentsResponse.documents.forEach((appt: any) => {
        slotCounts[appt.time] = (slotCounts[appt.time] || 0) + 1;
      });
      
      // Filter available slots
      const available = allPossibleSlots.filter(slot => {
        const slotConfig = slotsForDate.find(s => s.time === slot);
        const currentCount = slotCounts[slot] || 0;
        
        // If no specific config, use default (available, max DEFAULT_MAX_CAPACITY)
        if (!slotConfig) {
          return currentCount < DEFAULT_MAX_CAPACITY;
        }
        
        // If slot is marked unavailable
        if (!slotConfig.isAvailable) return false;
        
        // Check against configured capacity
        return currentCount < (slotConfig.maxCapacity || DEFAULT_MAX_CAPACITY);
      });
      
      return available;
    } catch (error) {
      console.error("Error fetching available slots:", error);
      toast.error("Failed to load available time slots");
      return [];
    }
  };

  const fetchAppointments = async () => {
    try {
      setIsLoading(true);
      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_DATABASE_ID!,
        "6734ba2700064c66818e",
        [
          Query.equal("program", [counselorProgram]),
          Query.orderAsc("date"),
          Query.orderAsc("time")
        ]
      );
      setAppointments(response.documents as Appointment[]);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast.error("Failed to load appointments");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTimeSlots = async (date?: Date) => {
    if (!currentCounselorId) {
      console.error("Counselor ID not available");
      return;
    }
  
    try {
      const query = [
        Query.equal("program", [counselorProgram]),
        Query.equal("counselorId", [currentCounselorId]) // Use the state value
      ];
      
      if (date) {
        query.push(Query.equal("date", [format(date, 'yyyy-MM-dd')]));
      }
  
      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_DATABASE_ID!,
        process.env.NEXT_PUBLIC_TIMESLOTS_COLLECTION_ID!,
        query
      );
      
      setTimeSlots(response.documents as TimeSlot[]);
    } catch (error) {
      console.error("Error fetching time slots:", error);
      toast.error("Failed to load time slots");
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
      if (!appointment) return;
      
      setSelectedAppointmentId(appointmentId);
      setSelectedStatus(newStatus as "Cancelled" | "Completed");
      setFollowUpRequired(appointment.followUpRequired || false);
      setCounselorNotes(appointment.counselorNotes || "");
      setProgressNotes(appointment.progressNotes || "");
      setCancellationReason(appointment.cancellationReason || "");

      // Fetch student goals if completing an appointment
      if (newStatus === "Completed") {
        try {
          const goalsResponse = await databases.listDocuments(
            process.env.NEXT_PUBLIC_DATABASE_ID!,
            process.env.NEXT_PUBLIC_GOALS_COLLECTION_ID!,
            [Query.equal("studentId", [appointment.userid])]
          );
          setStudentGoals(goalsResponse.documents as Goal[]);
          setSelectedGoals(appointment.goals || []);
          
          // Initialize progress updates with current progress
          const initialProgress: Record<string, number> = {};
          goalsResponse.documents.forEach((goal: any) => {
            initialProgress[goal.$id] = goal.progress;
          });
          setGoalProgressUpdates(initialProgress);
        } catch (error) {
          console.error("Error fetching student goals:", error);
          toast.error("Failed to load student goals");
        }
      }
      
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
        toast.success("Appointment status updated");
      } catch (error) {
        console.error("Error updating appointment status:", error);
        toast.error("Failed to update appointment status");
      }
    }
  };

  const handleModalSubmit = async () => {
    if (!selectedAppointmentId || !selectedStatus) return;
    
    try {
      const appointment = appointments.find(a => a.$id === selectedAppointmentId);
      if (!appointment) return;

      const updateData: any = { 
        status: selectedStatus,
        followUpRequired,
        counselorNotes
      };
      
      if (selectedStatus === "Cancelled") {
        updateData.cancellationReason = cancellationReason;
      } else if (selectedStatus === "Completed") {
        updateData.progressNotes = progressNotes;
        
        // Update goals if any were selected
        if (selectedGoals.length > 0) {
          updateData.goals = selectedGoals;
        }

        // Update goal progress for selected goals
        for (const goalId of selectedGoals) {
          const progressUpdate = goalProgressUpdates[goalId];
          if (progressUpdate !== undefined) {
            await databases.updateDocument(
              process.env.NEXT_PUBLIC_DATABASE_ID!,
              process.env.NEXT_PUBLIC_GOALS_COLLECTION_ID!,
              goalId,
              {
                progress: progressUpdate,
                status: progressUpdate >= 100 ? "Completed" : "In Progress"
              }
            );
          }
        }
      }

      await databases.updateDocument(
        process.env.NEXT_PUBLIC_DATABASE_ID!,
        "6734ba2700064c66818e",
        selectedAppointmentId,
        updateData
      );
      
      fetchAppointments();
      toast.success(`Appointment marked as ${selectedStatus}`);
    } catch (error) {
      console.error("Error updating appointment:", error);
      toast.error("Failed to update appointment");
    } finally {
      setIsModalOpen(false);
      setSelectedAppointmentId(null);
      setSelectedStatus(null);
      setCounselorNotes("");
      setCancellationReason("");
      setProgressNotes("");
      setFollowUpRequired(false);
      setSelectedGoals([]);
      setGoalProgressUpdates({});
    }
  };

  const handleGoalProgressChange = (goalId: string, value: number) => {
    setGoalProgressUpdates(prev => ({
      ...prev,
      [goalId]: value
    }));
  };

  const toggleGoalSelection = (goalId: string) => {
    setSelectedGoals(prev => 
      prev.includes(goalId)
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    );
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
        toast.success("Appointment deleted");
      } catch (error) {
        console.error("Error deleting appointment:", error);
        toast.error("Failed to delete appointment");
      }
    }
  };

  const handleSaveSlot = async () => {
    if (!newSlot.date || !newSlot.time) {
      toast.error("Please select date and time");
      return;
    }

    try {
      // Check if slot already exists
      const existingSlot = timeSlots.find(slot => 
        slot.date === newSlot.date && slot.time === newSlot.time
      );

      if (existingSlot) {
        // Update existing slot
        await databases.updateDocument(
          process.env.NEXT_PUBLIC_DATABASE_ID!,
          process.env.NEXT_PUBLIC_TIMESLOTS_COLLECTION_ID!,
          existingSlot.$id,
          {
            maxCapacity: newSlot.maxCapacity,
            isAvailable: newSlot.isAvailable
          }
        );
      } else {
        // Create new slot
        await databases.createDocument(
          process.env.NEXT_PUBLIC_DATABASE_ID!,
          process.env.NEXT_PUBLIC_TIMESLOTS_COLLECTION_ID!,
          ID.unique(),
          {
            date: newSlot.date,
            time: newSlot.time,
            maxCapacity: newSlot.maxCapacity,
            isAvailable: newSlot.isAvailable,
            counselorId: currentCounselorId,
            program: counselorProgram
          }
        );
      }
      
      toast.success("Time slot configuration saved");
      setShowSlotManagement(false);
      fetchTimeSlots(selectedDate);
    } catch (error) {
      console.error("Error saving time slot:", error);
      toast.error("Failed to save time slot configuration");
    }
  };

  const toggleSlotAvailability = async (time: string) => {
    if (!selectedDate || !currentCounselorId) {
      toast.error("Counselor information not available");
      return;
    }
    
    try {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const existingSlot = timeSlots.find(slot => 
        slot.date === formattedDate && slot.time === time
      );
  
      if (existingSlot) {
        await databases.updateDocument(
          process.env.NEXT_PUBLIC_DATABASE_ID!,
          process.env.NEXT_PUBLIC_TIMESLOTS_COLLECTION_ID!,
          existingSlot.$id,
          {
            isAvailable: !existingSlot.isAvailable,
            counselorId: currentCounselorId // Ensure counselorId is included
          }
        );
        toast.success(`Time slot ${!existingSlot.isAvailable ? "blocked" : "unblocked"}`);
      } else {
        await databases.createDocument(
          process.env.NEXT_PUBLIC_DATABASE_ID!,
          process.env.NEXT_PUBLIC_TIMESLOTS_COLLECTION_ID!,
          ID.unique(),
          {
            date: formattedDate,
            time,
            maxCapacity: 0,
            isAvailable: false,
            counselorId: currentCounselorId, // Use the state value
            program: counselorProgram
          }
        );
        toast.success("Time slot blocked");
      }
  
      fetchTimeSlots(selectedDate);
    } catch (error) {
      console.error("Error toggling slot availability:", error);
      toast.error("Failed to update time slot");
    }
  };

  const renderSlotManagement = () => (
    <Dialog open={showSlotManagement} onOpenChange={setShowSlotManagement}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Manage Time Slots</DialogTitle>
          <DialogDescription>
            Configure availability for {selectedDate && format(selectedDate, 'MMMM d, yyyy')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Time Slot</Label>
              <Select
                value={newSlot.time}
                onValueChange={(value) => setNewSlot({...newSlot, time: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {generateTimeSlots().map(time => (
                    <SelectItem key={time} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Max Appointments</Label>
              <Input
                type="number"
                min="0"
                max="10"
                value={newSlot.maxCapacity}
                onChange={(e) => setNewSlot({...newSlot, maxCapacity: Number(e.target.value)})}
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isAvailable"
              checked={newSlot.isAvailable}
              onCheckedChange={(checked) => setNewSlot({...newSlot, isAvailable: Boolean(checked)})}
            />
            <Label htmlFor="isAvailable">Available for booking</Label>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowSlotManagement(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveSlot}>Save Configuration</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderDayView = () => {
    if (!selectedDate) return null;

    const formattedDate = format(selectedDate, 'yyyy-MM-dd');
    const dayAppointments = appointments.filter(appointment => 
      appointment.date === formattedDate
    );

    // Get appointments count per slot
    const appointmentsBySlot: Record<string, number> = {};
    dayAppointments.forEach(appt => {
      appointmentsBySlot[appt.time] = (appointmentsBySlot[appt.time] || 0) + 1;
    });

    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            {format(selectedDate, 'MMMM d, yyyy')}
          </h2>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => setView('month')}
              className="border-gray-300 hover:bg-gray-50 text-black"
            >
              Back to Month
            </Button>
            <Button 
              onClick={() => {
                setNewSlot({
                  date: formattedDate,
                  time: "",
                  maxCapacity: DEFAULT_MAX_CAPACITY,
                  isAvailable: true
                });
                setShowSlotManagement(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Manage Time Slots
            </Button>
          </div>
        </div>

        {/* Time Slot Availability Grid */}
        <div className="mb-6">
          <h3 className="font-medium text-gray-800 mb-3">Time Slot Availability</h3>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
            {generateTimeSlots().map(slot => {
              const slotConfig = getSlotConfig(slot);
              const appointmentCount = appointmentsBySlot[slot] || 0;
              const isAvailable = slotConfig ? slotConfig.isAvailable : true;
              const maxCapacity = slotConfig?.maxCapacity ?? DEFAULT_MAX_CAPACITY;
              const isFull = appointmentCount >= maxCapacity;
              
              return (
                <div 
                  key={slot}
                  className={`p-2 rounded-md border ${
                    !isAvailable ? 'bg-red-50 border-red-200 text-red-800' :
                    isFull ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
                    'bg-green-50 border-green-200 text-green-800'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{slot}</span>
                    <span className="text-xs">
                      {appointmentCount}/{maxCapacity}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <button
                      onClick={() => toggleSlotAvailability(slot)}
                      className="text-xs flex items-center gap-1"
                    >
                      {isAvailable ? (
                        <>
                          <Lock className="w-3 h-3" />
                          <span>Block</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3 h-3" />
                          <span>Unblock</span>
                        </>
                      )}
                    </button>
                    {isAvailable && !isFull && (
                      <span className="text-xs">Available</span>
                    )}
                    {isFull && (
                      <span className="text-xs">Full</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Appointments List */}
        <h3 className="font-medium text-gray-800 mb-3">Scheduled Appointments</h3>
        {dayAppointments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No appointments scheduled for this day
          </div>
        ) : (
          <div className="space-y-3">
            {dayAppointments.map(appointment => {
              const student = students[appointment.userid];
              return (
                <div
                  key={appointment.$id}
                  className={`p-4 rounded-lg border ${
                    appointment.status === 'Scheduled' ? 'border-blue-200 bg-blue-50' :
                    appointment.status === 'Pending' ? 'border-gray-200 bg-gray-50' :
                    appointment.status === 'Completed' ? 'border-green-200 bg-green-50' :
                    'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-black">
                        {appointment.patientName}
                        {student && (
                          <span className="text-sm text-gray-600 ml-2">({student.email})</span>
                        )}
                      </h3>
                      <div className="flex gap-2 items-center mt-1">
                        <span className="text-sm text-gray-600">
                          {appointment.time} ({appointment.duration} mins)
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${getConcernColor(appointment.concernType)}`}>
                          {appointment.concernType}
                        </span>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(appointment.status)}`}>
                      {appointment.status}
                    </span>
                  </div>
                  
                  <div className="mt-2">
                    <p className="text-sm text-black">
                      <span className="font-medium">Student Notes:</span> {appointment.sessionNotes}
                    </p>
                  </div>
                  
                  <div className="mt-3 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-black">
                      <select
                        className="border rounded p-1 text-sm bg-white"
                        value={appointment.status}
                        onChange={(e) => handleStatusChange(appointment.$id, e.target.value)}
                      >
                        <option value="Scheduled">Scheduled</option>
                        <option value="Pending">Pending</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                      {appointment.followUpRequired && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                          Follow-up
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {appointment.status === "Completed" && appointment.counselorNotes && (
                    <div className="mt-3 p-3 bg-white rounded border border-gray-200">
                      <h4 className="text-sm font-medium text-gray-700">Your Notes:</h4>
                      <p className="text-sm text-black mt-1">{appointment.counselorNotes}</p>
                    </div>
                  )}
                  
                  {appointment.status === "Cancelled" && appointment.cancellationReason && (
                    <div className="mt-3 p-3 bg-white rounded border border-gray-200">
                      <h4 className="text-sm font-medium text-gray-700">Cancellation Reason:</h4>
                      <p className="text-sm text-gray-600 mt-1">{appointment.cancellationReason}</p>
                    </div>
                  )}
                </div>
              );
            })}
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
            <h1 className="text-3xl font-bold text-blue-700">Counselor Calendar</h1>
            <div className="flex items-center gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] text-black bg-white border border-gray-300">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="text-black bg-white">
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Scheduled">Scheduled</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
            {isLoading ? (
              <div className="p-6 text-center text-gray-500">Loading appointments...</div>
            ) : view === 'month' ? (
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
                      onClick={() => {
                        setCurrentDate(new Date());
                        setSelectedDate(new Date());
                        setView('day');
                      }} 
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

      {/* Appointment Status Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {selectedStatus === "Cancelled" ? "Cancel Appointment" : "Complete Session"}
            </DialogTitle>
            <DialogDescription>
              {selectedStatus === "Completed" ? "Update progress on student goals and add session notes" : "Provide a reason for cancellation"}
            </DialogDescription>
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
                  className="text-black"
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
                  rows={4}
                  className="text-white"
                />
              </div>

              <div className="space-y-2">
                <Label>Progress Notes</Label>
                <Textarea
                  placeholder="Enter notes about student progress..."
                  value={progressNotes}
                  onChange={(e) => setProgressNotes(e.target.value)}
                  rows={3}
                  className="text-white"
                />
              </div>

              {studentGoals.length > 0 && (
                <div className="space-y-4">
                  <Label>Associated Goals</Label>
                  <div className="space-y-3">
                    {studentGoals.map(goal => (
                      <div key={goal.$id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Checkbox
                              id={`goal-${goal.$id}`}
                              checked={selectedGoals.includes(goal.$id)}
                              onCheckedChange={() => toggleGoalSelection(goal.$id)}
                            />
                            <Label htmlFor={`goal-${goal.$id}`} className="font-medium">
                              {goal.title}
                            </Label>
                          </div>
                          <Badge variant="outline">{goal.metricType}</Badge>
                        </div>
                        
                        {selectedGoals.includes(goal.$id) && (
                          <div className="mt-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <Label>Progress Update</Label>
                              <span className="text-sm text-gray-600">
                                {goalProgressUpdates[goal.$id] || goal.progress}%
                              </span>
                            </div>
                            <Input
                              type="range"
                              min="0"
                              max="100"
                              value={goalProgressUpdates[goal.$id] || goal.progress}
                              onChange={(e) => handleGoalProgressChange(goal.$id, parseInt(e.target.value))}
                              className="w-full"
                            />
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>0%</span>
                              <span>100%</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

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

      {/* Time Slot Management Modal */}
      {renderSlotManagement()}
    </div>
  );
};

export default CounselorCalendarPage;