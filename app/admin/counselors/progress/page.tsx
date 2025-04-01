"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStudentProgressSummary, getStudentGoals, recordProgressMetric, updateGoalProgress } from "@/lib/actions/progress.actions";
import { getStudentsByCounselorId } from "@/lib/actions/counselor.actions";
import { getCounselorSession } from "@/lib/actions/counselor.actions";
import CounselorSideBar from "@/components/CounselorSideBar";
import { User, TrendingUp, Goal, AlertTriangle, ChevronRight, Plus } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import Cookies from "js-cookie";
import { decodeJwt } from "jose";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StudentProgress {
  $id: string;
  name: string;
  program: string;
  yearLevel: string;
  progress: number;
  riskFlag?: boolean;
  lastSession?: string;
  goalCount?: number;
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

const CounselorProgressPage = () => {
  const router = useRouter();
  const [students, setStudents] = useState<StudentProgress[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [counselorId, setCounselorId] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [studentGoals, setStudentGoals] = useState<Goal[]>([]);
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [isProgressDialogOpen, setIsProgressDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [progressUpdate, setProgressUpdate] = useState({
    value: 0,
    notes: ""
  });

  useEffect(() => {
    const fetchData = async () => {
      const token = Cookies.get("counselorToken");
      if (!token) {
        router.push("/admin/counselors/login");
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

        setCounselorId(session.counselorId);

        // Get students with progress data
        const studentsData = await getStudentsByCounselorId(session.counselorId, session.program, 50, 0);
        
        // Enhance with progress data
        const studentsWithProgress = await Promise.all(
          studentsData.map(async (student: any) => {
            const progressData = await getStudentProgressSummary(student.$id);
            return {
              ...student,
              progress: progressData.averageProgress || 0,
              riskFlag: progressData.averageProgress < 30,
              lastSession: progressData.recentSessions[0]?.date,
              goalCount: progressData.goalCount || 0
            };
          })
        );

        setStudents(studentsWithProgress);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const fetchStudentGoals = async (studentId: string) => {
    try {
      const goals = await getStudentGoals(studentId);
      setStudentGoals(goals);
    } catch (error) {
      console.error("Error fetching student goals:", error);
    }
  };

  const handleUpdateGoalProgress = async () => {
    if (!selectedGoal || !selectedStudent) return;

    try {
      await updateGoalProgress(
        selectedGoal.$id,
        progressUpdate.value,
        progressUpdate.value >= 100 ? "Completed" : "In Progress"
      );

      // Record progress metric
      await recordProgressMetric({
        studentId: selectedStudent,
        metricType: selectedGoal.metricType,
        value: progressUpdate.value,
        notes: progressUpdate.notes
      });

      // Refresh data
      const updatedGoals = await getStudentGoals(selectedStudent);
      setStudentGoals(updatedGoals);

      // Update the student's overall progress in the list
      setStudents(prev => prev.map(student => {
        if (student.$id === selectedStudent) {
          const completedGoals = updatedGoals.filter(g => g.status === "Completed").length;
          const avgProgress = updatedGoals.reduce((sum, goal) => sum + goal.progress, 0) / updatedGoals.length;
          return {
            ...student,
            progress: Math.round(avgProgress),
            goalCount: updatedGoals.length
          };
        }
        return student;
      }));

      setIsProgressDialogOpen(false);
      setSelectedGoal(null);
      setProgressUpdate({ value: 0, notes: "" });
    } catch (error) {
      console.error("Error updating goal progress:", error);
    }
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.program.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <CounselorSideBar />
      
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-blue-700">Student Progress Dashboard</h1>
            <p className="text-gray-600 mt-2">Track and monitor your students counseling progress</p>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
            <div className="relative max-w-xl">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search students..."
                className="pl-10 pr-4 py-2 w-full"
              />
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Students</p>
                  <p className="text-2xl font-bold mt-1 text-indigo-600">{students.length}</p>
                </div>
                <div className="p-3 rounded-lg bg-indigo-50">
                  <User className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Average Progress</p>
                  <p className="text-2xl font-bold mt-1 text-green-600">
                    {students.length > 0 
                      ? Math.round(students.reduce((sum, s) => sum + s.progress, 0) / students.length)
                      : 0}%
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-green-50">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">At Risk</p>
                  <p className="text-2xl font-bold mt-1 text-red-600">
                    {students.filter(s => s.riskFlag).length}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-red-50">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Goals Set</p>
                  <p className="text-2xl font-bold mt-1 text-blue-600">
                    {students.reduce((sum, s) => sum + (s.goalCount || 0), 0)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-blue-50">
                  <Goal className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Students Progress Table */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Session</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        No students found
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => (
                      <tr key={student.$id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{student.name}</div>
                          <div className="text-sm text-gray-500">{student.yearLevel}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                          {student.program}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <Progress value={student.progress} className="h-2 w-32" />
                            <span className="text-sm font-medium">{student.progress}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.lastSession 
                            ? new Date(student.lastSession).toLocaleDateString() 
                            : "No sessions"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {student.riskFlag ? (
                            <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                              Needs Attention
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                              On Track
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-indigo-600 hover:bg-indigo-50"
                            onClick={() => {
                              setSelectedStudent(student.$id);
                              fetchStudentGoals(student.$id);
                            }}
                          >
                            View Goals <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Student Goals Section */}
          {selectedStudent && (
            <div className="mt-8 bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Goals for {students.find(s => s.$id === selectedStudent)?.name}
                  </h2>
                  <Button
                    variant="outline"
                    className="border-indigo-300 text-indigo-600 hover:bg-indigo-50"
                    onClick={() => setIsGoalDialogOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add Goal
                  </Button>
                </div>

                {studentGoals.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <p>No goals set yet for this student</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {studentGoals.map((goal) => (
                      <div key={goal.$id} className="border-b border-gray-100 last:border-0 py-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-gray-800">{goal.title}</h3>
                            <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                goal.status === "Completed" ? "bg-green-100 text-green-800" :
                                goal.status === "In Progress" ? "bg-blue-100 text-blue-800" :
                                "bg-gray-100 text-gray-800"
                              }`}>
                                {goal.status}
                              </span>
                              <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800">
                                {goal.metricType}
                              </span>
                              <span className="text-xs text-gray-500">
                                Target: {new Date(goal.targetDate).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-indigo-600">{goal.progress}%</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-indigo-600 hover:bg-indigo-50"
                              onClick={() => {
                                setSelectedGoal(goal);
                                setProgressUpdate({
                                  value: goal.progress,
                                  notes: ""
                                });
                                setIsProgressDialogOpen(true);
                              }}
                            >
                              Update
                            </Button>
                          </div>
                        </div>
                        <Progress value={goal.progress} className="mt-3 h-2" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Goal Dialog */}
      <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Goal</DialogTitle>
            <DialogDescription>
              Set a new goal for {students.find(s => s.$id === selectedStudent)?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Goal Title</Label>
              <Input placeholder="Enter goal title" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea placeholder="Enter goal description" rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Focus Area</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select focus area" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Academic">Academic</SelectItem>
                  <SelectItem value="Career">Career</SelectItem>
                  <SelectItem value="Personal">Personal</SelectItem>
                  <SelectItem value="Crisis">Crisis Management</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Target Date</Label>
              <Input type="date" min={new Date().toISOString().split('T')[0]} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGoalDialogOpen(false)}>
              Cancel
            </Button>
            <Button>Save Goal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Progress Dialog */}
      <Dialog open={isProgressDialogOpen} onOpenChange={setIsProgressDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Update Goal Progress</DialogTitle>
            <DialogDescription>
              Update progress for: {selectedGoal?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Progress Value (0-100)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={progressUpdate.value}
                onChange={(e) => setProgressUpdate({
                  ...progressUpdate,
                  value: parseInt(e.target.value)
                })}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={progressUpdate.notes}
                onChange={(e) => setProgressUpdate({
                  ...progressUpdate,
                  notes: e.target.value
                })}
                placeholder="Add notes about this progress update..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProgressDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateGoalProgress}>
              Update Progress
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CounselorProgressPage;