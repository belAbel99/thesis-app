"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getStudentProgressSummary, getStudentGoals, recordProgressMetric } from "@/lib/actions/progress.actions";
import CounselorSideBar from "@/components/CounselorSideBar";
import { Goal, TrendingUp, Calendar, BookOpen, CheckCircle, Plus, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress"; // Update the path to the correct location
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface Goal {
  $id: string;
  title: string;
  description: string;
  progress: number;
  status: string;
  targetDate: string;
}

interface ProgressSummary {
  averageProgress: number;
  goalCount: number;
  completedGoals: number;
  recentMetrics: any[];
  recentSessions: any[];
  studentName: string; // Added property
}

const StudentProgressDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const studentId = params.studentId as string;
  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMetricDialogOpen, setIsMetricDialogOpen] = useState(false);
  const [newMetric, setNewMetric] = useState({
    metricType: "Academic",
    value: 50,
    notes: ""
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [progressData, goalsData] = await Promise.all([
          getStudentProgressSummary(studentId),
          getStudentGoals(studentId)
        ]);
        setProgress(progressData);
        setGoals(goalsData);
      } catch (error) {
        console.error("Error fetching progress data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [studentId]);

  const handleRecordMetric = async () => {
    try {
      await recordProgressMetric({
        studentId,
        metricType: newMetric.metricType,
        value: newMetric.value,
        notes: newMetric.notes
      });
      
      // Refresh data
      const progressData = await getStudentProgressSummary(studentId);
      setProgress(progressData);
      
      setIsMetricDialogOpen(false);
      setNewMetric({
        metricType: "Academic",
        value: 50,
        notes: ""
      });
    } catch (error) {
      console.error("Error recording metric:", error);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <CounselorSideBar />
      
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-blue-700">Student Progress</h1>
              <p className="text-gray-600 mt-2">Detailed tracking for {progress?.studentName || "student"}</p>
            </div>
            <Button 
              onClick={() => setIsMetricDialogOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" /> Record Progress Metric
            </Button>
          </div>

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
                  <p className="text-sm font-medium text-gray-500">Risk Status</p>
                  <p className="text-2xl font-bold mt-1 text-red-600">
                    {progress?.averageProgress < 30 ? "At Risk" : "On Track"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {progress?.averageProgress < 30 
                      ? "Needs additional support" 
                      : "Making good progress"}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-red-50">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Goals Section */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-800">Student Goals</h2>
              <Button variant="outline" className="text-indigo-600 border-indigo-300 hover:bg-indigo-50">
                <Plus className="w-4 h-4 mr-2" /> Add Goal
              </Button>
            </div>

            {goals.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p>No goals set yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {goals.map((goal) => (
                  <div key={goal.$id} className="border-b border-gray-100 last:border-0 py-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-800">{goal.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            goal.status === "Completed" ? "bg-green-100 text-green-800" :
                            goal.status === "In Progress" ? "bg-blue-100 text-blue-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {goal.status}
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
                          onClick={() => {/* Implement goal edit modal */}}
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                    <Progress value={goal.progress} className="mt-3 h-2" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Progress Metrics Section */}
<div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
  <h2 className="text-lg font-semibold text-gray-800 mb-6">Progress Metrics</h2>
  
  {progress?.recentMetrics?.length === 0 ? (
    <div className="text-center py-8 text-gray-400">
      <p>No progress metrics recorded yet</p>
    </div>
  ) : (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metric</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {progress?.recentMetrics?.map((metric) => (
            <tr key={metric.$id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(metric.dateRecorded).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {metric.metricType}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {metric.value}%
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {metric.notes}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {metric.sessionId ? "Session" : "Manual"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</div>
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
                          <h4 className="text-xs font-medium text-gray-500 mb-1">Session Notes:</h4>
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
      </div>

      {/* Record Metric Dialog */}
      <Dialog open={isMetricDialogOpen} onOpenChange={setIsMetricDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Record Progress Metric</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Metric Type</Label>
              <Select
                value={newMetric.metricType}
                onValueChange={(value) => setNewMetric({...newMetric, metricType: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select metric type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Academic">Academic</SelectItem>
                  <SelectItem value="Emotional">Emotional</SelectItem>
                  <SelectItem value="Social">Social</SelectItem>
                  <SelectItem value="Career">Career</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Value (0-100)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={newMetric.value}
                onChange={(e) => setNewMetric({...newMetric, value: parseInt(e.target.value)})}
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={newMetric.notes}
                onChange={(e) => setNewMetric({...newMetric, notes: e.target.value})}
                placeholder="Add notes about this progress metric..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMetricDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRecordMetric}>
              Record Metric
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentProgressDetailPage;