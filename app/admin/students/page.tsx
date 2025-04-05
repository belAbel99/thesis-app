"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import StudentList from "@/components/StudentList";
import CounselorList from "@/components/CounselorList";
import SideBar from "@/components/SideBar";

const StudentsPage = () => {
  const [activeTab, setActiveTab] = useState("students");

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Sidebar - Now properly included */}
      <SideBar />
      
      <div className="flex-1 p-8 overflow-y-auto ml-20 md:ml-64"> {/* Adjusted margin for sidebar */}
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-blue-700">Student & Counselor Management</h1>
            <p className="text-gray-600 mt-2">View and manage all students and counselors</p>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="students" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger 
                value="students" 
                className="data-[state=active]:bg-white data-[state=active]:text-blue-600"
                onClick={() => setActiveTab("students")}
              >
                Students
              </TabsTrigger>
              <TabsTrigger 
                value="counselors" 
                className="data-[state=active]:bg-white data-[state=active]:text-blue-600"
                onClick={() => setActiveTab("counselors")}
              >
                Counselors
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="students">
              {activeTab === "students" && <StudentList />}
            </TabsContent>
            
            <TabsContent value="counselors">
              {activeTab === "counselors" && <CounselorList />}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default StudentsPage;