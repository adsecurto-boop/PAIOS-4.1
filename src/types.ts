export type PriorityLevel = "LOW" | "NORMAL" | "HIGH" | "CRITICAL";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type Category = "Work" | "Study" | "Coding" | "Testing" | "Personal" | "Exercise" | "Break" | "Other";
export type TimelineType = "ACTIVITY" | "TASK" | "CAPTURE" | "CHECKIN" | "JOURNAL";

export interface Task {
  id: number;
  title: string;
  description: string;
  priority: PriorityLevel;
  status: TaskStatus;
  isPriorityPin: boolean;
  category: Category | string;
  dueDateMillis?: number | null;
  estimatedDurationMinutes?: number | null;
  createdAtMillis: number;
  completedAtMillis?: number | null;
}

export interface ActivityLog {
  id: number;
  activityName: string;
  category: Category | string;
  startTimeMillis: number;
  endTimeMillis?: number | null;
  durationSeconds: number;
  isRunning: boolean;
  isPaused: boolean;
  pauseStartTimeMillis?: number | null;
  accumulatedPausedDurationSeconds: number;
  note?: string | null;
}

export interface TimelineEntry {
  id: number;
  title: string;
  category: Category | string;
  timestampMillis: number;
  durationMinutes?: number | null;
  note?: string | null;
  type: TimelineType;
}

export interface QuickCapture {
  id: number;
  text: string;
  category: Category | string;
  tags: string;
  createdAtMillis: number;
}

export interface MorningCheckIn {
  dateString: string; // YYYY-MM-DD
  sleepHours: number;
  sleepQuality: number; // 1-10
  energy: number; // 1-10
  mood: number; // 1-10
  mainGoal: string;
  priority1: string;
  priority2: string;
  priority3: string;
  createdAtMillis: number;
}

export interface EveningReview {
  dateString: string; // YYYY-MM-DD
  activeTimeFormatted: string;
  workTimeFormatted: string;
  studyTimeFormatted: string;
  tasksCompletedText: string;
  wentWell: string;
  didntGoWell: string;
  learnedText: string;
  doDifferently: string;
  rating: number; // 1-10
  createdAtMillis: number;
}

export interface JournalEntry {
  id: number;
  title: string;
  content: string;
  tags: string;
  createdAtMillis: number;
  updatedAtMillis: number;
}

export interface StudyCard {
  id: number;
  topic: string;
  question: string;
  answer: string;
  confidence: number; // 1 to 10
  lastReviewedMillis?: number | null;
  reviewCount: number;
  easeFactor: number;
}

export interface AIMessage {
  id: number;
  sender: "USER" | "AI";
  text: string;
  actionType?: "ADD_TASK" | "START_ACTIVITY" | "SAVE_NOTE" | null;
  actionPayloadJson?: string | null;
  isActionConfirmed?: boolean | null;
  timestampMillis: number;
}

export interface UserSettings {
  id: number;
  userName: string;
  aiProvider: string;
  aiModel: string;
  customApiKey: string;
  themeMode: "SYSTEM" | "DARK" | "LIGHT";
  morningNotificationEnabled: boolean;
  eveningNotificationEnabled: boolean;
}

export interface SearchResults {
  tasks: Task[];
  timeline: TimelineEntry[];
  captures: QuickCapture[];
  journal: JournalEntry[];
  studyCards: StudyCard[];
}

export type NavTab = "TODAY" | "TIMELINE" | "TASKS" | "LEARN" | "INSIGHTS";
