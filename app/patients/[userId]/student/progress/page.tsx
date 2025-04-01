"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getStudentProgressSummary, getStudentGoals, createGoal } from "@/lib/actions/progress.actions";
import StudentSideBar from "@/components/StudentSideBar";
import { Goal, TrendingUp, Calendar, BookOpen, CheckCircle, Plus } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Goal {
  $id: string;
  title: string;
  description: string;
  progress: number;
  status: string;
  targetDate: string;
  metricType: string;
}

interface ProgressSummary {
  averageProgress: number;
  goalCount: number;
  completedGoals: number;
  recentMetrics: any[];
  recentSessions: any[];
  concernTrends: Record<string, number>;
}

const StudentProgressPage = () => {
  const params = useParams();
  const userId = params.userId as string;
  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: "",
    description: "",
    targetDate: "",
    metricType: "Academic"
  });

// Modify the useEffect to fetch goals with progress updates
useEffect(() => {
  const fetchData = async () => {
    try {
      const [progressData, goalsData] = await Promise.all([
        getStudentProgressSummary(userId),
        getStudentGoals(userId)
      ]);
      
      // Sort goals by progress (descending)
      const sortedGoals = [...goalsData].sort((a, b) => b.progress - a.progress);
      
      setProgress(progressData);
      setGoals(sortedGoals);
    } catch (error) {
      console.error("Error fetching progress data:", error);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [userId]);

  const handleCreateGoal = async () => {
    if (!newGoal.title || !newGoal.targetDate) return;

    try {
      await createGoal({
        studentId: userId,
        title: newGoal.title,
        description: newGoal.description,
        targetDate: newGoal.targetDate,
        metricType: newGoal.metricType,
        progress: 0,
        status: "Not Started"
      });

      // Refresh data
      const [progressData, goalsData] = await Promise.all([
        getStudentProgressSummary(userId),
        getStudentGoals(userId)
      ]);
      
      setProgress(progressData);
      setGoals(goalsData);
      setIsGoalModalOpen(false);
      setNewGoal({
        title: "",
        description: "",
        targetDate: "",
        metricType: "Academic"
      });
    } catch (error) {
      console.error("Error creating goal:", error);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <StudentSideBar userId={userId} />
      
      <div className="flex-1 p-6">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">My Progress</h1>
            <p className="text-gray-600">Track your counseling journey and goals</p>
          </div>
        </header>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Overall Progress</p>
                <p className="text-2xl font-bold mt-1 text-indigo-600">
                  {progress?.averageProgress || 0}%
                </p>
              </div>
              <div className="p-3 rounded-lg bg-indigo-50">
                <TrendingUp className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
            <Progress value={progress?.averageProgress || 0} className="mt-4 h-2" />
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Goals</p>
                <p className="text-2xl font-bold mt-1 text-green-600">
                  {progress?.completedGoals || 0}/{progress?.goalCount || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">Completed</p>
              </div>
              <div className="p-3 rounded-lg bg-green-50">
                <Goal className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Recent Sessions</p>
                <p className="text-2xl font-bold mt-1 text-blue-600">
                  {progress?.recentSessions?.length || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">Last 5 sessions</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Goals Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-800">My Goals</h2>
            <Button 
              onClick={() => setIsGoalModalOpen(true)}
              variant="outline" 
              className="text-indigo-600 border-indigo-300 hover:bg-indigo-50"
            >
              <Plus className="w-4 h-4 mr-2" /> Add New Goal
            </Button>
          </div>

          {goals.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>No goals set yet</p>
              <Button 
                onClick={() => setIsGoalModalOpen(true)}
                className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Create Your First Goal
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {goals.map((goal) => (
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
                    <span className="text-sm font-medium text-indigo-600">{goal.progress}%</span>
                  </div>
                  <Progress value={goal.progress} className="mt-3 h-2" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Concern Trends */}
        {progress?.concernTrends && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Your Focus Areas</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(progress.concernTrends).map(([concern, count]) => (
                <div key={concern} className="text-center p-3 rounded-lg bg-gray-50">
                  <p className="text-sm font-medium text-gray-500">{concern}</p>
                  <p className="text-xl font-bold text-indigo-600">{count}</p>
                  <p className="text-xs text-gray-500">sessions</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Sessions Timeline */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">Recent Counseling Sessions</h2>
          
          {progress?.recentSessions?.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>No recent sessions</p>
            </div>
          ) : (
            <div className="space-y-6">
              {progress?.recentSessions?.map((session) => (
                <div key={session.$id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-4 h-4 rounded-full bg-indigo-200 mt-1"></div>
                    <div className="w-px h-full bg-gray-200"></div>
                  </div>
                  <div className="pb-6 flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-800">
                          {new Date(session.date).toLocaleDateString()} at {session.time}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {session.concernType} - {session.duration} mins
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        session.status === "Completed" ? "bg-green-100 text-green-800" :
                        session.status === "Scheduled" ? "bg-blue-100 text-blue-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {session.status}
                      </span>
                    </div>
                    {session.counselorNotes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <h4 className="text-xs font-medium text-gray-500 mb-1">Counselor Notes:</h4>
                        <p className="text-sm text-gray-700">{session.counselorNotes}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Goal Creation Modal */}
      <Dialog open={isGoalModalOpen} onOpenChange={setIsGoalModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Goal</DialogTitle>
            <DialogDescription>
              Set a specific, measurable goal for your counseling journey
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Goal Title*</Label>
              <Input
                value={newGoal.title}
                onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                placeholder="e.g., Improve time management skills"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label>Focus Area*</Label>
              <Select
                value={newGoal.metricType}
                onValueChange={(value) => setNewGoal({...newGoal, metricType: value})}
              >
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
              <Label>Description</Label>
              <Textarea
                value={newGoal.description}
                onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
                placeholder="Describe what you want to achieve and why it's important..."
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Target Date*</Label>
              <Input
                type="date"
                value={newGoal.targetDate}
                onChange={(e) => setNewGoal({...newGoal, targetDate: e.target.value})}
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsGoalModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateGoal}
              disabled={!newGoal.title || !newGoal.targetDate}
            >
              Create Goal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentProgressPage;