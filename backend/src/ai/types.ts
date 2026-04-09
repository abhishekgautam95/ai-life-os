import {
  GoalPriority,
  IntentType,
  MemoryCategory,
  ReminderRecurrence,
  ReviewStatus,
  TaskStatus,
} from "@prisma/client";

type GoalCandidate = {
  title: string;
  description?: string;
  priority?: GoalPriority;
};

type TaskCandidate = {
  title: string;
  description?: string;
  dueAt?: string;
  goalTitle?: string;
  status?: TaskStatus;
};

type MemoryCandidate = {
  category: MemoryCategory;
  content: string;
  importance: number;
};

type ReviewCandidate = {
  status: ReviewStatus;
  completed: string[];
  partial: string[];
  skipped: string[];
  summary: string;
};

type ReminderCandidate = {
  recurrence: ReminderRecurrence;
  sendAt?: string;
  localTime?: string;
  weekday?: number;
  message?: string;
};

type IntentAnalysis = {
  intent: IntentType;
  confidence: number;
  goal?: GoalCandidate;
  task?: TaskCandidate;
  memoryHints?: MemoryCandidate[];
  review?: ReviewCandidate;
  reminder?: ReminderCandidate;
  availableTime?: string;
  adviceTopic?: string;
};

type PlanResult = {
  planText: string;
  focus: string[];
};

type AdviceResult = {
  reply: string;
};

type ReviewSummaryResult = {
  summary: string;
  wins: string[];
  blockers: string[];
  nextStep: string;
};

type WeeklySummaryResult = {
  wins: string[];
  missedWork: string[];
  patterns: string[];
  nextWeekFocus: string[];
  summaryText: string;
};

export type {
  AdviceResult,
  GoalCandidate,
  IntentAnalysis,
  MemoryCandidate,
  PlanResult,
  ReminderCandidate,
  ReviewCandidate,
  ReviewSummaryResult,
  TaskCandidate,
  WeeklySummaryResult,
};
