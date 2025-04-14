"use client";

import { useEffect, useState } from "react";
import { Client, Databases } from "appwrite";
import { useParams } from "next/navigation";
import StudentSideBar from "@/components/StudentSideBar";
import { Search, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ProfileBadge } from "@/components/ProfileBadge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Appointment {
  $id: string;
  patientName: string;
  date: string;
  time: string;
  reason: string;
  status: "Scheduled" | "Completed" | "Cancelled" | "Pending";
  userid: string;
  program: string;
  concernType: "Academic" | "Career" | "Personal" | "Crisis";
  followUpRequired: boolean;
  sessionNotes: string;
  counselorNotes?: string;
  duration: number;
  cancellationReason?: string;
  diagnosis?: string;
}

const StudentAppointmentsPage = () => {
  const params = useParams();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedAppointments, setExpandedAppointments] = useState<Set<string>>(new Set());
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<string | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<string>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_PROJECT_ID!);
  
  const databases = new Databases(client);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_DATABASE_ID!,
        "6734ba2700064c66818e"
      );
      const userAppointments = response.documents
        .filter((doc: any) => doc.userid === params.userId)
        .map((doc: any) => ({
          ...doc,
          sessionNotes: doc.sessionNotes || doc.reason || '',
          concernType: doc.concernType || 'Academic',
          duration: doc.duration || 30,
          followUpRequired: doc.followUpRequired || false
        }));
      setAppointments(userAppointments as Appointment[]);
      applyFiltersAndSort(userAppointments as Appointment[]);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
  };

  const applyFiltersAndSort = (appointmentsToFilter: Appointment[]) => {
    let filtered = [...appointmentsToFilter];

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(appointment => appointment.status === statusFilter);
    }

    // Apply search term
    if (searchTerm) {
      filtered = filtered.filter(appointment =>
        appointment.sessionNotes.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.date.includes(searchTerm) ||
        appointment.concernType.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "date":
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
        case "concernType":
          comparison = a.concernType.localeCompare(b.concernType);
          break;
        case "duration":
          comparison = a.duration - b.duration;
          break;
        default:
          comparison = 0;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    setFilteredAppointments(filtered);
  };

  useEffect(() => {
    applyFiltersAndSort(appointments);
  }, [searchTerm, statusFilter, sortField, sortDirection, appointments]);

  const handleCancelAppointment = async () => {
    if (!appointmentToCancel) return;
    
    try {
      await databases.updateDocument(
        process.env.NEXT_PUBLIC_DATABASE_ID!,
        "6734ba2700064c66818e",
        appointmentToCancel,
        { 
          status: "Cancelled",
          cancellationReason 
        }
      );
      fetchAppointments();
      setIsCancelDialogOpen(false);
      setAppointmentToCancel(null);
      setCancellationReason("");
    } catch (error) {
      console.error("Error cancelling appointment:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Scheduled":
        return "bg-blue-100 text-blue-700";
      case "Completed":
        return "bg-green-100 text-green-700";
      case "Cancelled":
        return "bg-red-100 text-red-700";
      case "Pending":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
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

  const toggleAppointmentExpansion = (id: string) => {
    const newSet = new Set(expandedAppointments);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedAppointments(newSet);
  };

  const resetFilters = () => {
    setStatusFilter("all");
    setSearchTerm("");
    setSortField("date");
    setSortDirection("desc");
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <StudentSideBar userId={params.userId as string} />
      
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-blue-700">My Appointments</h1>
            <p className="text-gray-600 mt-2">View and manage all your counseling appointments</p>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by notes, date, or concern type..."
                  className="pl-10 pr-4 py-2 w-full"
                />
              </div>
              
              <div className="flex flex-wrap items-center gap-4">
                <div className="w-full md:w-auto">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px] text-black">
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
                
                <div className="w-full md:w-auto">
                  <Select 
                    value={`${sortField}-${sortDirection}`}
                    onValueChange={(value) => {
                      const [field, direction] = value.split('-');
                      setSortField(field);
                      setSortDirection(direction as "asc" | "desc");
                    }}
                  >
                    <SelectTrigger className="w-[180px] text-black">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent className="text-black">
                      <SelectItem value="date-desc">Date (Newest first)</SelectItem>
                      <SelectItem value="date-asc">Date (Oldest first)</SelectItem>
                      <SelectItem value="status-asc">Status (A-Z)</SelectItem>
                      <SelectItem value="status-desc">Status (Z-A)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button
                  variant="outline"
                  onClick={resetFilters}
                  className="ml-auto text-black"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>

          {/* Appointments Table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 text-black">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Concern</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAppointments.map((appointment) => (
                    <>
                      <tr 
                        key={appointment.$id} 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => toggleAppointmentExpansion(appointment.$id)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-dark">
                          {new Date(appointment.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-dark">{appointment.time}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{appointment.duration} mins</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs ${getConcernColor(appointment.concernType)}`}>
                            {appointment.concernType}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(appointment.status)}`}>
                            {appointment.status}
                          </span>
                          {appointment.followUpRequired && (
                            <span className="ml-2 px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700">
                              Follow-up
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex gap-2 justify-end">
                            {appointment.status === "Scheduled" || appointment.status === "Pending" ? (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAppointmentToCancel(appointment.$id);
                                  setIsCancelDialogOpen(true);
                                }}
                              >
                                Cancel
                              </Button>
                            ) : null}
                            <button 
                              className="text-indigo-600 hover:text-indigo-900"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleAppointmentExpansion(appointment.$id);
                              }}
                            >
                              {expandedAppointments.has(appointment.$id) ? 'Hide' : 'View'} details
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedAppointments.has(appointment.$id) && (
                        <tr className="bg-gray-50">
                          <td colSpan={6} className="px-6 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h4 className="text-sm font-medium text-gray-500">Session Notes</h4>
                                <p className="mt-1 text-sm text-gray-800">{appointment.sessionNotes}</p>
                              </div>
                              {appointment.status === "Completed" && appointment.counselorNotes && (
                                <div>
                                  <h4 className="text-sm font-medium text-gray-500">Counselor Notes</h4>
                                  <p className="mt-1 text-sm text-gray-800">{appointment.counselorNotes}</p>
                                </div>
                              )}
                              {appointment.status === "Cancelled" && appointment.cancellationReason && (
                                <div>
                                  <h4 className="text-sm font-medium text-gray-500">Cancellation Reason</h4>
                                  <p className="mt-1 text-sm text-gray-800">{appointment.cancellationReason}</p>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
              {filteredAppointments.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <p>No appointments found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Appointment Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
            <DialogDescription>
              Please provide a reason for cancelling this appointment.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Enter your reason for cancellation..."
            value={cancellationReason}
            onChange={(e) => setCancellationReason(e.target.value)}
            required
          />
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsCancelDialogOpen(false)}
              className="border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleCancelAppointment}
              disabled={!cancellationReason}
            >
              Confirm Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentAppointmentsPage;