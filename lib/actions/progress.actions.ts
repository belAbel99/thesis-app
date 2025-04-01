"use server";

import { ID, Query } from "node-appwrite";
import { databases } from "../appwrite.config";
import { parseStringify } from "../utils";

// Goal actions
export const createGoal = async (goal: {
  studentId: string;
  title: string;
  description: string;
  targetDate: string;
  counselorId: string;
}) => {
  try {
    const newGoal = await databases.createDocument(
      process.env.NEXT_PUBLIC_DATABASE_ID!,
      process.env.NEXT_PUBLIC_GOALS_COLLECTION_ID!,
      ID.unique(),
      {
        ...goal,
        status: "Not Started",
        progress: 0,
        createdAt: new Date().toISOString()
      }
    );
    return parseStringify(newGoal);
  } catch (error) {
    console.error("Error creating goal:", error);
    throw error;
  }
};

export const updateGoalProgress = async (goalId: string, progress: number, status?: string) => {
  try {
    const updateData: any = { progress };
    if (status) updateData.status = status;
    
    const updatedGoal = await databases.updateDocument(
      process.env.NEXT_PUBLIC_DATABASE_ID!,
      process.env.NEXT_PUBLIC_GOALS_COLLECTION_ID!,
      goalId,
      updateData
    );
    return parseStringify(updatedGoal);
  } catch (error) {
    console.error("Error updating goal:", error);
    throw error;
  }
};

export const getStudentGoals = async (studentId: string) => {
  try {
    const goals = await databases.listDocuments(
      process.env.NEXT_PUBLIC_DATABASE_ID!,
      process.env.NEXT_PUBLIC_GOALS_COLLECTION_ID!,
      [Query.equal("studentId", [studentId])]
    );
    return parseStringify(goals.documents);
  } catch (error) {
    console.error("Error fetching goals:", error);
    throw error;
  }
};

// Progress metrics actions
export const recordProgressMetric = async (metric: {
  studentId: string;
  sessionId?: string;
  metricType: string;
  value: number;
  notes: string;
}) => {
  try {
    const newMetric = await databases.createDocument(
      process.env.NEXT_PUBLIC_DATABASE_ID!,
      process.env.NEXT_PUBLIC_PROGRESSMETRICS_COLLECTION_ID!, // Replace with your metrics collection ID
      ID.unique(),
      {
        ...metric,
        dateRecorded: new Date().toISOString()
      }
    );
    return parseStringify(newMetric);
  } catch (error) {
    console.error("Error recording progress metric:", error);
    throw error;
  }
};

export const getStudentProgressMetrics = async (studentId: string) => {
  try {
    const metrics = await databases.listDocuments(
      process.env.NEXT_PUBLIC_DATABASE_ID!,
      process.env.NEXT_PUBLIC_PROGRESSMETRICS_COLLECTION_ID!, // Replace with your metrics collection ID
      [Query.equal("studentId", [studentId]), Query.orderDesc("dateRecorded")]
    );
    return parseStringify(metrics.documents);
  } catch (error) {
    console.error("Error fetching progress metrics:", error);
    throw error;
  }
};

// Student progress summary
// Update getStudentProgressSummary function
export const getStudentProgressSummary = async (studentId: string) => {
  try {
    // Get all goals
    const goals = await databases.listDocuments(
      process.env.NEXT_PUBLIC_DATABASE_ID!,
      process.env.NEXT_PUBLIC_GOALS_COLLECTION_ID!,
      [Query.equal("studentId", [studentId])]
    );

    // Calculate average progress
    const totalProgress = goals.documents.reduce((sum, goal) => sum + (goal.progress || 0), 0);
    const averageProgress = goals.documents.length > 0 
      ? Math.round(totalProgress / goals.documents.length)
      : 0;

    // Get latest metrics
    const metrics = await databases.listDocuments(
      process.env.NEXT_PUBLIC_DATABASE_ID!,
      process.env.NEXT_PUBLIC_PROGRESSMETRICS_COLLECTION_ID!,
      [Query.equal("studentId", [studentId]), Query.orderDesc("dateRecorded"), Query.limit(5)]
    );

    // Get latest sessions
    const sessions = await databases.listDocuments(
      process.env.NEXT_PUBLIC_DATABASE_ID!,
      "6734ba2700064c66818e",
      [Query.equal("userid", [studentId]), Query.orderDesc("date"), Query.limit(5)]
    );

    // Calculate concern trends
    const concernTrends = sessions.documents.reduce((acc, session) => {
      const concern = session.concernType || "Other";
      acc[concern] = (acc[concern] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return parseStringify({
      studentId,
      studentName: goals.documents[0]?.studentName || "",
      averageProgress,
      goalCount: goals.total,
      completedGoals: goals.documents.filter(g => g.status === "Completed").length,
      recentMetrics: metrics.documents,
      recentSessions: sessions.documents,
      concernTrends
    });
  } catch (error) {
    console.error("Error fetching progress summary:", error);
    throw error;
  }
};
export const getGoalsByAppointmentId = async (appointmentId: string) => {
  try {
    const appointment = await databases.getDocument(
      process.env.NEXT_PUBLIC_DATABASE_ID!,
      "6734ba2700064c66818e",
      appointmentId
    );
    
    if (!appointment?.goals || appointment.goals.length === 0) {
      return [];
    }
    
    const goals = await databases.listDocuments(
      process.env.NEXT_PUBLIC_DATABASE_ID!,
      process.env.NEXT_PUBLIC_GOALS_COLLECTION_ID!,
      [Query.equal("$id", appointment.goals)]
    );
    
    return parseStringify(goals.documents);
  } catch (error) {
    console.error("Error fetching goals by appointment ID:", error);
    throw error;
  }
};

export const getMetricsByGoalId = async (goalId: string) => {
  try {
    const metrics = await databases.listDocuments(
      process.env.NEXT_PUBLIC_DATABASE_ID!,
      process.env.NEXT_PUBLIC_PROGRESSMETRICS_COLLECTION_ID!,
      [Query.equal("goalId", [goalId]), Query.orderDesc("dateRecorded")]
    );
    
    return parseStringify(metrics.documents);
  } catch (error) {
    console.error("Error fetching metrics by goal ID:", error);
    throw error;
  }
};