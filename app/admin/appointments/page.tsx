"use client";

import { useEffect, useState } from "react";
import { Client, Databases, Query } from "appwrite";
import SideBar from "@/components/SideBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, RefreshCw, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

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
}

const AdminAppointmentsPage = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [expandedAppointment, setExpandedAppointment] = useState<string | null>(null);
  const [counselorNotes, setCounselorNotes] = useState("");
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [concernFilter, setConcernFilter] = useState<string>("all");
  const [followUpFilter, setFollowUpFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<string>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<"Cancelled" | "Completed" | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [followUpRequired, setFollowUpRequired] = useState(false);
  
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
      const normalizedAppointments = response.documents.map((doc: any) => ({
        ...doc,
        sessionNotes: doc.sessionNotes || doc.reason || '',
        concernType: doc.concernType || 'Academic',
        duration: doc.duration || 30,
        followUpRequired: doc.followUpRequired || false
      }));
      setAppointments(normalizedAppointments as Appointment[]);
      applyFiltersAndSort(normalizedAppointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      setMessage("Failed to fetch appointments");
      setMessageType("error");
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const applyFiltersAndSort = (appointmentsToFilter: Appointment[]) => {
    let filtered = [...appointmentsToFilter];

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(appointment => appointment.status === statusFilter);
    }

    // Apply concern filter
    if (concernFilter !== "all") {
      filtered = filtered.filter(appointment => appointment.concernType === concernFilter);
    }

    // Apply follow-up filter
    if (followUpFilter !== "all") {
      filtered = filtered.filter(appointment => 
        followUpFilter === "yes" ? appointment.followUpRequired : !appointment.followUpRequired
      );
    }

    // Apply search term
    if (searchTerm) {
      filtered = filtered.filter(appointment =>
        appointment.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.sessionNotes.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.concernType.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "patientName":
          comparison = a.patientName.localeCompare(b.patientName);
          break;
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
  }, [searchTerm, statusFilter, concernFilter, followUpFilter, sortField, sortDirection, appointments]);

  const handleStatusChange = async (appointmentId: string, status: "Cancelled" | "Completed") => {
    setSelectedAppointmentId(appointmentId);
    setNewStatus(status);
    setIsStatusDialogOpen(true);
    
    const appointment = appointments.find(a => a.$id === appointmentId);
    if (appointment) {
      if (status === "Completed") {
        setCounselorNotes(appointment.counselorNotes || "");
      } else {
        setCancellationReason(appointment.cancellationReason || "");
      }
      setFollowUpRequired(appointment.followUpRequired);
    }
  };

  const confirmStatusChange = async () => {
    if (!selectedAppointmentId || !newStatus) return;
    
    try {
      const updateData: any = { 
        status: newStatus,
        followUpRequired
      };
      
      if (newStatus === "Cancelled") {
        updateData.cancellationReason = cancellationReason;
      } else if (newStatus === "Completed") {
        updateData.counselorNotes = counselorNotes;
      }

      await databases.updateDocument(
        process.env.NEXT_PUBLIC_DATABASE_ID!,
        "6734ba2700064c66818e",
        selectedAppointmentId,
        updateData
      );

      fetchAppointments();
      setMessage(`Appointment marked as ${newStatus} successfully!`);
      setMessageType("success");
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error updating appointment status:", error);
      setMessage("Failed to update appointment status");
      setMessageType("error");
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setIsStatusDialogOpen(false);
      setSelectedAppointmentId(null);
      setNewStatus(null);
      setCounselorNotes("");
      setCancellationReason("");
      setFollowUpRequired(false);
    }
  };

  const openDeleteDialog = (appointmentId: string) => {
    setAppointmentToDelete(appointmentId);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!appointmentToDelete) return;
    
    try {
      await databases.deleteDocument(
        process.env.NEXT_PUBLIC_DATABASE_ID!,
        "6734ba2700064c66818e",
        appointmentToDelete
      );
      fetchAppointments();
      setMessage("Appointment deleted successfully!");
      setMessageType("success");
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error deleting appointment:", error);
      setMessage("Failed to delete appointment");
      setMessageType("error");
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setIsDeleteDialogOpen(false);
      setAppointmentToDelete(null);
    }
  };

  const toggleExpandAppointment = (appointmentId: string) => {
    setExpandedAppointment(expandedAppointment === appointmentId ? null : appointmentId);
  };

  const openNotesDialog = (appointmentId: string, existingNotes?: string) => {
    setSelectedAppointmentId(appointmentId);
    setCounselorNotes(existingNotes || "");
    setIsNotesDialogOpen(true);
  };

  const handleSaveNotes = async () => {
    if (!selectedAppointmentId) return;
    
    try {
      await databases.updateDocument(
        process.env.NEXT_PUBLIC_DATABASE_ID!,
        "6734ba2700064c66818e",
        selectedAppointmentId,
        { counselorNotes }
      );
      fetchAppointments();
      setMessage("Counselor notes updated successfully!");
      setMessageType("success");
      setTimeout(() => setMessage(null), 3000);
      setIsNotesDialogOpen(false);
    } catch (error) {
      console.error("Error updating counselor notes:", error);
      setMessage("Failed to update counselor notes");
      setMessageType("error");
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Scheduled": return "bg-blue-100 text-blue-700";
      case "Completed": return "bg-green-100 text-green-700";
      case "Cancelled": return "bg-red-100 text-red-700";
      case "Pending": return "bg-yellow-100 text-yellow-700";
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

  const resetFilters = () => {
    setStatusFilter("all");
    setConcernFilter("all");
    setFollowUpFilter("all");
    setSearchTerm("");
    setSortField("date");
    setSortDirection("asc");
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <SideBar />
      
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-blue-700">Manage Appointments</h1>
              <p className="text-gray-600 mt-2">View and manage all counseling appointments</p>
            </div>
            <Button 
              onClick={fetchAppointments}
              variant="outline"
              className="flex items-center gap-2 border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </Button>
          </div>

          {/* Message Alert */}
          {message && (
            <div className={`mb-6 p-4 rounded-md ${
              messageType === "success" 
                ? "bg-green-100 text-green-700 border border-green-200" 
                : "bg-red-100 text-red-700 border border-red-200"
            }`}>
              {message}
            </div>
          )}

          {/* Search and Filters */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100 text-black">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, notes, or concern type..."
                  className="pl-10 pr-4 py-2 w-full"
                />
              </div>
              
              <div className="flex flex-wrap items-center gap-4">
                <div className="w-full md:w-auto">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent className="w-[180px] text-black">
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="Scheduled">Scheduled</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="w-full md:w-auto">
                  <Select value={concernFilter} onValueChange={setConcernFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by concern" />
                    </SelectTrigger>
                    <SelectContent className="w-[180px] text-black">
                      <SelectItem value="all">All Concerns</SelectItem>
                      <SelectItem value="Academic">Academic</SelectItem>
                      <SelectItem value="Career">Career</SelectItem>
                      <SelectItem value="Personal">Personal</SelectItem>
                      <SelectItem value="Crisis">Crisis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="w-full md:w-auto">
                  <Select value={followUpFilter} onValueChange={setFollowUpFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Follow-up" />
                    </SelectTrigger>
                    <SelectContent className="w-[180px] text-black">
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="yes">Follow-up required</SelectItem>
                      <SelectItem value="no">No follow-up</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button
                  variant="outline"
                  onClick={resetFilters}
                  className="ml-auto"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>

          {/* Appointments Table */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button 
                        className="flex items-center gap-1"
                        onClick={() => {
                          setSortField("patientName");
                          setSortDirection(sortField === "patientName" ? (sortDirection === "asc" ? "desc" : "asc") : "asc");
                        }}
                      >
                        Patient
                        {sortField === "patientName" && (
                          sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button 
                        className="flex items-center gap-1"
                        onClick={() => {
                          setSortField("date");
                          setSortDirection(sortField === "date" ? (sortDirection === "asc" ? "desc" : "asc") : "asc");
                        }}
                      >
                        Date & Time
                        {sortField === "date" && (
                          sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button 
                        className="flex items-center gap-1"
                        onClick={() => {
                          setSortField("duration");
                          setSortDirection(sortField === "duration" ? (sortDirection === "asc" ? "desc" : "asc") : "asc");
                        }}
                      >
                        Duration
                        {sortField === "duration" && (
                          sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button 
                        className="flex items-center gap-1"
                        onClick={() => {
                          setSortField("concernType");
                          setSortDirection(sortField === "concernType" ? (sortDirection === "asc" ? "desc" : "asc") : "asc");
                        }}
                      >
                        Concern
                        {sortField === "concernType" && (
                          sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button 
                        className="flex items-center gap-1"
                        onClick={() => {
                          setSortField("status");
                          setSortDirection(sortField === "status" ? (sortDirection === "asc" ? "desc" : "asc") : "asc");
                        }}
                      >
                        Status
                        {sortField === "status" && (
                          sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAppointments.map((appointment) => (
                    <>
                      <tr 
                        key={appointment.$id} 
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => toggleExpandAppointment(appointment.$id)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{appointment.patientName}</div>
                          <div className="text-sm text-gray-500">{appointment.program}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-gray-900">
                            {new Date(appointment.date).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-500">{appointment.time}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                          {appointment.duration} mins
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${getConcernColor(appointment.concernType)}`}>
                            {appointment.concernType}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(appointment.status)}`}>
                            {appointment.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-blue-600 hover:bg-blue-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                openNotesDialog(appointment.$id, appointment.counselorNotes);
                              }}
                            >
                              Notes
                            </Button>
                            {appointment.status === "Scheduled" || appointment.status === "Pending" ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-green-600 hover:bg-green-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusChange(appointment.$id, "Completed");
                                  }}
                                >
                                  Complete
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:bg-red-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusChange(appointment.$id, "Cancelled");
                                  }}
                                >
                                  Cancel
                                </Button>
                              </>
                            ) : null}
                            <Button
                              variant="destructive"
                              size="sm"
                              className="text-red-600 hover:bg-red-50 text-red-500"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDeleteDialog(appointment.$id);
                              }}
                            >
                              Delete
                            </Button>
                            <button 
                              className="text-gray-500 hover:text-gray-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpandAppointment(appointment.$id);
                              }}
                            >
                              {expandedAppointment === appointment.$id ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedAppointment === appointment.$id && (
                        <tr className="bg-gray-50">
                          <td colSpan={6} className="px-6 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <h4 className="text-sm font-medium text-gray-500 mb-2">Session Details</h4>
                                <div className="space-y-2 text-black">
                                  <p className="text-sm">
                                    <span className="font-medium">Student Notes:</span> {appointment.sessionNotes}
                                  </p>
                                  {appointment.followUpRequired && (
                                    <span className="inline-block px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                                      Follow-up required
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-gray-500 mb-2">Counselor Information</h4>
                                {appointment.counselorNotes ? (
                                  <p className="text-sm text-black">{appointment.counselorNotes}</p>
                                ) : (
                                  <p className="text-sm text-gray-400">No counselor notes yet</p>
                                )}
                                {appointment.status === "Cancelled" && appointment.cancellationReason && (
                                  <div className="mt-2">
                                    <p className="text-sm font-medium text-gray-500">Cancellation Reason:</p>
                                    <p className="text-sm text-gray-700">{appointment.cancellationReason}</p>
                                  </div>
                                )}
                              </div>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Appointment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this appointment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              className="border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-red-50"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Counselor Notes Dialog */}
      <Dialog open={isNotesDialogOpen} onOpenChange={setIsNotesDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Counselor Notes</DialogTitle>
            <DialogDescription>
              Add or edit notes for this counseling session
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={counselorNotes}
            onChange={(e) => setCounselorNotes(e.target.value)}
            placeholder="Enter your notes here..."
            className="min-h-[200px]"
          />
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsNotesDialogOpen(false)}
              className="border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveNotes}
            >
              Save Notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {newStatus === "Cancelled" ? "Cancel Appointment" : "Complete Session"}
            </DialogTitle>
            <DialogDescription>
              {newStatus === "Cancelled" 
                ? "Please provide a reason for cancellation" 
                : "Please add notes about this session"}
            </DialogDescription>
          </DialogHeader>
          {newStatus === "Cancelled" ? (
            <div className="space-y-4">
              <Textarea
                placeholder="Enter cancellation reason..."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                required
              />
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
              <Textarea
                placeholder="Enter session notes..."
                value={counselorNotes}
                onChange={(e) => setCounselorNotes(e.target.value)}
                required
              />
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
            <Button 
              variant="outline" 
              onClick={() => setIsStatusDialogOpen(false)}
              className="border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmStatusChange}
            >
              {newStatus === "Cancelled" ? "Confirm Cancellation" : "Complete Session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAppointmentsPage;