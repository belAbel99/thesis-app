"use client";

import { useEffect, useState } from "react";
import { Client, Databases, ID } from "appwrite";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash, Edit, CheckCircle, Search, Plus, X, RefreshCw } from "lucide-react";
import SideBar from "@/components/SideBar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Medicine {
  $id: string;
  name: string;
  brand: string;
  category: string;
  stock: string;
  location: string;
  expiryDate: string;
}

const MEDICINES_COLLECTION_ID = "67b486f5000ff28439c6"; // Update this to match your medicines collection ID

const MedicinesPage = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [filteredMedicines, setFilteredMedicines] = useState<Medicine[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [newMedicine, setNewMedicine] = useState<Medicine>({
    $id: "",
    name: "",
    brand: "",
    category: "",
    stock: "",
    location: "",
    expiryDate: ""
  });
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [medicineToDelete, setMedicineToDelete] = useState<string | null>(null);
  const [messageType, setMessageType] = useState("");

  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_PROJECT_ID!);
  
  const databases = new Databases(client);

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_DATABASE_ID!,
        "67b486f5000ff28439c6"
      );
      setMedicines(response.documents);
      setFilteredMedicines(response.documents);
    } catch (error) {
      console.error("Error fetching medicines:", error);
    }
  };

  const addMedicine = async () => {
    // Validate all required fields
    if (!newMedicine.name || !newMedicine.brand || !newMedicine.category || 
        !newMedicine.stock || !newMedicine.location || !newMedicine.expiryDate) {
      setMessage("Please fill in all required fields");
      return;
    }

    try {
      const medicineData = {
        name: newMedicine.name,
        brand: newMedicine.brand,
        category: newMedicine.category,
        stock: newMedicine.stock,
        location: newMedicine.location,
        expiryDate: newMedicine.expiryDate
      };

      const response = await databases.createDocument(
        process.env.NEXT_PUBLIC_DATABASE_ID!,
        "67b486f5000ff28439c6",
        ID.unique(),
        medicineData
      );
      
      setMedicines([...medicines, response]);
      setFilteredMedicines([...medicines, response]);
      setNewMedicine({
        $id: "",
        name: "",
        brand: "",
        category: "",
        stock: "",
        location: "",
        expiryDate: ""
      });
      setMessage("✅ Medicine added successfully!");
      setMessageType("success");
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error adding medicine:", error);
      setMessage("❌ Error adding medicine. Please try again.");
      setMessageType("error");
    }
  };

  const updateMedicine = async (id: string, medicine: Medicine) => {
    try {
      await databases.updateDocument(
        process.env.NEXT_PUBLIC_DATABASE_ID!,
        "67b486f5000ff28439c6",
        id,
        {
          name: medicine.name,
          brand: medicine.brand,
          category: medicine.category,
          stock: medicine.stock,
          location: medicine.location,
          expiryDate: medicine.expiryDate
        }
      );
      setEditingId(null);
      setMessage("✅ Medicine updated successfully!");
      setMessageType("success");
      setTimeout(() => setMessage(null), 3000);
      fetchMedicines();
    } catch (error) {
      console.error("Error updating medicine:", error);
      setMessageType("error");
    }
  };

  const openDeleteDialog = (medicineId: string) => {
    setMedicineToDelete(medicineId);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    console.log("Attempting to delete medicine:", medicineToDelete);
    if (!medicineToDelete) return;
    
    try {
      console.log("Database ID:", process.env.NEXT_PUBLIC_DATABASE_ID);
      console.log("Collection ID:", MEDICINES_COLLECTION_ID);
      
      await databases.deleteDocument(
        process.env.NEXT_PUBLIC_DATABASE_ID!,
        MEDICINES_COLLECTION_ID,
        medicineToDelete
      );
      
      // Update local state to remove the deleted medicine
      setMedicines(medicines.filter(m => m.$id !== medicineToDelete));
      setFilteredMedicines(filteredMedicines.filter(m => m.$id !== medicineToDelete));
      
      console.log("Medicine deleted successfully");
      setMessage("✅ Medicine deleted successfully!");
      setMessageType("success");
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error deleting medicine:", error);
      setMessage("❌ Error deleting medicine. Please try again.");
      setMessageType("error");
    } finally {
      setIsDeleteDialogOpen(false);
      setMedicineToDelete(null);
    }
  };

  useEffect(() => {
    const filtered = medicines.filter(medicine => 
      medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      medicine.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      medicine.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredMedicines(filtered);
  }, [searchTerm, medicines]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "low":
        return "bg-red-100";
      case "medium":
        return "bg-yellow-100";
      case "high":
        return "bg-green-100";
      default:
        return "bg-gray-100";
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <SideBar />
      
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-blue-700">Medicines Inventory</h1>
              <p className="text-gray-600 mt-2">Manage medicine stock and inventory</p>
            </div>
            <Button 
              onClick={fetchMedicines}
              variant="outline"
              className="flex items-center gap-2 text-white bg-green-500"
            >
              <RefreshCw className="w-4 h-4 " /> Refresh
            </Button>
          </div>

          {/* Alert Message */}
          {message && (
            <div className="flex items-center justify-center">
              <div
                className={`flex px-4 py-3 rounded relative my-4 border items-center justify-center${
                  messageType === "success"
                    ? "bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-6"
                    : "bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6"
                }`}
              >
                {message}
              </div>
            </div>
              
          )}

          {/* Add Medicine Form */}
          <div className="bg-white p-8 rounded-xl shadow-md mb-8">
            <h2 className="text-xl font-semibold mb-6 text-blue-700">Add New Medicine</h2>
            <div className="grid grid-cols-3 gap-4 mb-6 text-black">
              <Input
                type="text"
                value={newMedicine.name}
                onChange={(e) => setNewMedicine({...newMedicine, name: e.target.value})}
                placeholder="Medicine Name"
                className="border-blue-700 bg-white focus:ring-0 focus:outline-none"
                required
              />
              <Input
                type="text"
                value={newMedicine.brand}
                onChange={(e) => setNewMedicine({...newMedicine, brand: e.target.value})}
                placeholder="Brand"
                className="border-blue-700 bg-white  focus:ring-0 focus:outline-none"
                required
              />
              <Input
                type="text"
                value={newMedicine.category}
                onChange={(e) => setNewMedicine({...newMedicine, category: e.target.value})}
                placeholder="Category"
                className="border-blue-700 bg-white  focus:ring-0 focus:outline-none"
                required
              />
              <Input
                type="text"
                value={newMedicine.stock}
                onChange={(e) => setNewMedicine({...newMedicine, stock: e.target.value})}
                placeholder="Stock Level (low/medium/high)"
                className="border-blue-700 bg-white  focus:ring-0 focus:outline-none"
                required
              />
              <Input
                type="text"
                value={newMedicine.location}
                onChange={(e) => setNewMedicine({...newMedicine, location: e.target.value})}
                placeholder="Location"
                className="border-blue-700 bg-white  focus:ring-0 focus:outline-none"
                required
              />
              <Input
                type="date"
                value={newMedicine.expiryDate}
                onChange={(e) => setNewMedicine({...newMedicine, expiryDate: e.target.value})}
                className="text-gray-400 border-blue-700 bg-white  focus:ring-0 focus:outline-none"
                required
              />
              <Button 
                onClick={addMedicine} 
                className="bg-blue-700 hover:bg-blue-800 col-span-3 text-white"
              >
                <Plus className="mr-2 h-5 w-5" /> Add Medicine
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex  gap-4 mb-8 z-0 items-center justify-center">
            <div className="relative w-1/2 flex items-center justify-center ">
            <Search size={20} className="text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search medicines..."
                className="pl-9 border-2 border-blue-700 focus:border-blue-500 rounded-lg bg-white focus:ring-0 focus:outline-none text-black"
              />
            </div>
          </div>

          {/* Medicines Table */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Medicine Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Brand</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Category</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Stock</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Location</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Expiry Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredMedicines.map((medicine) => (
                    <tr key={medicine.$id}>
                      <td className="px-6 py-4 text-black">
                        {editingId === medicine.$id ? (
                          <Input
                            value={medicine.name}
                            onChange={(e) => setMedicines(medicines.map(m => 
                              m.$id === medicine.$id ? {...m, name: e.target.value} : m
                            ))}
                          />
                        ) : (
                          medicine.name
                        )}
                      </td>
                      <td className="px-6 py-4 text-black">
                        {editingId === medicine.$id ? (
                          <Input
                            value={medicine.brand}
                            onChange={(e) => setMedicines(medicines.map(m => 
                              m.$id === medicine.$id ? {...m, brand: e.target.value} : m
                            ))}
                          />
                        ) : (
                          medicine.brand
                        )}
                      </td>
                      <td className="px-6 py-4 text-black">
                        {editingId === medicine.$id ? (
                          <Input
                            value={medicine.category}
                            onChange={(e) => setMedicines(medicines.map(m => 
                              m.$id === medicine.$id ? {...m, category: e.target.value} : m
                            ))}
                          />
                        ) : (
                          medicine.category
                        )}
                      </td>
                      <td className="px-6 py-4 text-black">
                        {editingId === medicine.$id ? (
                          <Input
                            type="number"
                            value={medicine.stock}
                            onChange={(e) => setMedicines(medicines.map(m => 
                              m.$id === medicine.$id ? {...m, stock: e.target.value} : m
                            ))}
                          />
                        ) : (
                          medicine.stock
                        )}
                      </td>
                      <td className="px-6 py-4 text-black">
                        {editingId === medicine.$id ? (
                          <Input
                            value={medicine.location}
                            onChange={(e) => setMedicines(medicines.map(m => 
                              m.$id === medicine.$id ? {...m, location: e.target.value} : m
                            ))}
                          />
                        ) : (
                          medicine.location
                        )}
                      </td>
                      <td className="px-6 py-4 text-black">
                        {editingId === medicine.$id ? (
                          <Input
                            type="date"
                            value={medicine.expiryDate}
                            onChange={(e) => setMedicines(medicines.map(m => 
                              m.$id === medicine.$id ? {...m, expiryDate: e.target.value} : m
                            ))}
                          />
                        ) : (
                          medicine.expiryDate
                        )}
                      </td>
                      <td className="px-6 py-4 text-black">
                        <div className="flex gap-2">
                          {editingId === medicine.$id ? (
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => updateMedicine(medicine.$id, medicine)}
                            >
                              <CheckCircle className="text-green-500" />
                            </Button>
                          ) : (
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => setEditingId(medicine.$id)}
                            >
                              <Edit className="text-blue-500" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => openDeleteDialog(medicine.$id)}
                          >
                            <Trash className="text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-red-700">Delete Medicine</DialogTitle>
            <DialogDescription className="text-gray-500">
              Are you sure you want to delete this medicine? This action cannot be undone.
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

export default MedicinesPage; 