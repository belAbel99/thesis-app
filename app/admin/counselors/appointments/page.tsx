"use client";

import { useEffect, useState } from "react";
import { Client, Databases, Query } from "appwrite";
import SideBar from "@/components/CounselorSideBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, RefreshCw } from "lucide-react";
import { getCounselorSession } from "@/lib/actions/counselor.actions";
import Cookies from "js-cookie";
import { decodeJwt } from "jose";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Appointment {
  $id: string;
  patientName: string; // Keeping original field name
  date: string;
  time: string;
  reason: string; // Keeping original field name
  status: "Scheduled" | "Completed" | "Cancelled";
  userid: string;
  program: string; // Only using existing field
}

const CounselorAppointmentsPage = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<string | null>(null);
  const [messageType, setMessageType] = useState("");
  const [counselorProgram, setCounselorProgram] = useState("");

  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_PROJECT_ID!);

  const databases = new Databases(client);

  const fetchAppointments = async () => {
    const token = Cookies.get("counselorToken");

    if (!token) {
      console.error("No token found in cookies.");
      return;
    }

    try {
      const { sessionId } = decodeJwt(token) as { sessionId: string };
      const session = await getCounselorSession(sessionId);

      if (!session) {
        console.error("No session found.");
        return;
      }

      setCounselorProgram(session.program);

      // Fetch appointments for counselor's program ONLY
      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_DATABASE_ID!,
        "6734ba2700064c66818e", // Your appointment collection ID
        [Query.equal("program", [session.program])] // Only change made to original
      );

      setAppointments(response.documents as Appointment[]);
      setFilteredAppointments(response.documents as Appointment[]);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      setMessageType("error");
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    const filtered = appointments.filter(
      (appointment) =>
        appointment.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.reason.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredAppointments(filtered);
  }, [searchTerm, appointments]);

  // Rest of your original functions remain exactly the same
  const handleStatusChange = async (appointmentId: string, newStatus: string) => {
    try {
      await databases.updateDocument(
        process.env.NEXT_PUBLIC_DATABASE_ID!,
        "6734ba2700064c66818e",
        appointmentId,
        { status: newStatus }
      );
      await fetchAppointments();
      setMessage("Appointment status updated successfully!");
      setMessageType("success");
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error updating appointment status:", error);
      setMessageType("error");
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
      await fetchAppointments();
      setMessage("Appointment deleted successfully!");
      setMessageType("success");
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error deleting appointment:", error);
      setMessageType("error");
    } finally {
      setIsDeleteDialogOpen(false);
      setAppointmentToDelete(null);
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
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <SideBar />
      
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-blue-700">Appointments</h1>
              <p className="text-gray-600 mt-2">Viewing appointments for {counselorProgram}</p>
            </div>
            <Button
              onClick={fetchAppointments}
              variant="outline"
              className="flex items-center gap-2 text-black border-blue-700 hover:bg-blue-700 hover:text-white"
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </Button>
          </div>

          {message && (
            <div className={`p-3 mb-4 rounded-md ${
              messageType === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}>
              {message}
            </div>
          )}

          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-xl">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search appointments..."
                    className="pl-10 pr-4 py-2 w-full bg-white border-2 border-blue-700 text-black focus:outline-none focus:ring-0"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAppointments.map((appointment) => (
                      <tr key={appointment.$id}>
                        <td className="px-6 py-4 whitespace-nowrap text-black">{appointment.patientName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-black">{appointment.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-black">{appointment.time}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-black">{appointment.reason}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-black">
                          <select
                            value={appointment.status}
                            onChange={(e) => handleStatusChange(appointment.$id, e.target.value)}
                            className={`rounded-full px-3 py-1 text-sm ${getStatusColor(appointment.status)}`}
                          >
                            <option value="Scheduled">Scheduled</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-red-500 space-x-2 flex" style={{ minWidth: "100px" }}>
                          <Button
                            onClick={() => openDeleteDialog(appointment.$id)}
                            variant="destructive"
                            size="sm"
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-red-700">Delete Appointment</DialogTitle>
            <DialogDescription className="text-gray-500">
              Are you sure you want to delete this appointment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="border-blue-700 text-blue-700 hover:bg-blue-700 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="border border-red-700 text-red-700 hover:bg-red-700 hover:text-white"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CounselorAppointmentsPage;