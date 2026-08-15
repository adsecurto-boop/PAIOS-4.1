import {
  Task,
  ActivityLog,
  TimelineEntry,
  QuickCapture,
  MorningCheckIn,
  EveningReview,
  JournalEntry,
  StudyCard,
  AIMessage,
  UserSettings,
  SearchResults,
} from './types';

const STORAGE_KEYS = {
  TASKS: 'paios_tasks_v1',
  ACTIVITIES: 'paios_activities_v1',
  ACTIVE_ACTIVITY: 'paios_active_activity_v1',
  TIMELINE: 'paios_timeline_v1',
  CAPTURES: 'paios_captures_v1',
  CHECKIN: 'paios_checkin_v1',
  REVIEW: 'paios_review_v1',
  JOURNAL: 'paios_journal_v1',
  STUDY_CARDS: 'paios_study_cards_v1',
  AI_MESSAGES: 'paios_ai_messages_v1',
  SETTINGS: 'paios_settings_v1',
};

export function getTodayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getStartOfDayMillis(): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.getTime();
}

// Initial Seeds
const initialSettings: UserSettings = {
  id: 1,
  userName: 'Alex',
  aiProvider: 'GEMINI',
  aiModel: 'gemini-3.6-flash',
  customApiKey: '',
  themeMode: 'DARK',
  morningNotificationEnabled: true,
  eveningNotificationEnabled: true,
};

const initialTasks: Task[] = [
  {
    id: 101,
    title: 'Complete PAIOS system testing & validation',
    description: 'Verify all modules including timers, timeline, study cards, and AI actions.',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    isPriorityPin: true,
    category: 'Testing',
    createdAtMillis: Date.now() - 3600000 * 5,
  },
  {
    id: 102,
    title: 'Review ISTQB certification flashcards',
    description: 'Focus on boundary value analysis and equivalence partitioning.',
    priority: 'NORMAL',
    status: 'TODO',
    isPriorityPin: true,
    category: 'Study',
    createdAtMillis: Date.now() - 3600000 * 4,
  },
  {
    id: 103,
    title: 'Prepare weekly status update for team',
    description: 'Highlight key milestones achieved in current sprint.',
    priority: 'NORMAL',
    status: 'TODO',
    isPriorityPin: true,
    category: 'Work',
    createdAtMillis: Date.now() - 3600000 * 3,
  },
  {
    id: 104,
    title: 'Morning 30-minute cardio session',
    description: 'Light jog and stretching.',
    priority: 'LOW',
    status: 'COMPLETED',
    isPriorityPin: false,
    category: 'Exercise',
    createdAtMillis: Date.now() - 3600000 * 8,
    completedAtMillis: Date.now() - 3600000 * 7,
  },
];

const initialTimeline: TimelineEntry[] = [
  {
    id: 201,
    title: 'Morning Check-In Completed',
    category: 'Personal',
    timestampMillis: getStartOfDayMillis() + 3600000 * 7,
    note: 'Goal: Master automated test patterns and deep focus',
    type: 'CHECKIN',
  },
  {
    id: 202,
    title: 'Deep Focus Coding Session',
    category: 'Coding',
    timestampMillis: getStartOfDayMillis() + 3600000 * 9,
    durationMinutes: 45,
    note: 'Implemented core state management and UI components',
    type: 'ACTIVITY',
  },
  {
    id: 203,
    title: 'Task Created: Review ISTQB certification flashcards',
    category: 'Study',
    timestampMillis: getStartOfDayMillis() + 3600000 * 10,
    type: 'TASK',
  },
  {
    id: 204,
    title: 'Note: Remember to test API timeout fallback handling',
    category: 'Testing',
    timestampMillis: getStartOfDayMillis() + 3600000 * 11,
    type: 'CAPTURE',
  },
];

const initialMorningCheckIn: MorningCheckIn = {
  dateString: getTodayDateString(),
  sleepHours: 7.5,
  sleepQuality: 8,
  energy: 8,
  mood: 8,
  mainGoal: 'Master automated test patterns and maintain deep focus throughout the day.',
  priority1: 'Complete PAIOS testing',
  priority2: 'Review ISTQB study cards',
  priority3: 'Prepare team update',
  createdAtMillis: getStartOfDayMillis() + 3600000 * 7,
};

const initialJournal: JournalEntry[] = [
  {
    id: 301,
    title: 'Building the Personal AI Operating System',
    content:
      'Today I brought PAIOS to life with automated time tracking, timeline logging, flashcard study drills, and intelligent AI prompt action execution. The key to high performance is lowering friction between thought and action.',
    tags: 'Productivity, AI, Systems',
    createdAtMillis: Date.now() - 86400000,
    updatedAtMillis: Date.now() - 86400000,
  },
];

const initialStudyCards: StudyCard[] = [
  {
    id: 401,
    topic: 'Software Testing',
    question: 'What is the key difference between Verification and Validation?',
    answer:
      "Verification checks if the product is built according to technical specifications ('Are we building the product right?'). Validation checks if the product meets customer needs and requirements ('Are we building the right product?').",
    confidence: 8,
    reviewCount: 4,
    easeFactor: 2.5,
    lastReviewedMillis: Date.now() - 3600000 * 12,
  },
  {
    id: 402,
    topic: 'Software Testing',
    question: 'What are the 7 Principles of Software Testing?',
    answer:
      '1. Testing shows presence of defects, not absence.\n2. Exhaustive testing is impossible.\n3. Early testing saves time and money.\n4. Defect clustering (80/20 rule).\n5. Pesticide paradox (tests must be regularly updated).\n6. Testing is context dependent.\n7. Absence-of-errors fallacy.',
    confidence: 7,
    reviewCount: 3,
    easeFactor: 2.4,
    lastReviewedMillis: Date.now() - 3600000 * 24,
  },
  {
    id: 403,
    topic: 'System Design',
    question: 'What is Idempotency in REST API Design?',
    answer:
      'An API operation is idempotent if executing it multiple times produces the exact same side-effects as executing it a single time (e.g., GET, PUT, DELETE operations).',
    confidence: 9,
    reviewCount: 6,
    easeFactor: 2.6,
    lastReviewedMillis: Date.now() - 3600000 * 6,
  },
];

const initialAiMessages: AIMessage[] = [
  {
    id: 501,
    sender: 'AI',
    text: "Hello Alex! I am PAIOS, your Personal AI Operating System. I have live access to your active timer, today's goals, timeline, and task board. Ask me anything or tell me to log an activity, save a note, or add a task!",
    timestampMillis: Date.now() - 3600000,
  },
];

// LocalStorage helpers
function load<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch (e) {
    console.error(`Error loading key ${key}:`, e);
    return fallback;
  }
}

function save<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event('paios_storage_change'));
  } catch (e) {
    console.error(`Error saving key ${key}:`, e);
  }
}

// Storage Manager Instance
export const storage = {
  // --- SETTINGS ---
  getSettings(): UserSettings {
    return load(STORAGE_KEYS.SETTINGS, initialSettings);
  },
  saveSettings(settings: UserSettings): void {
    save(STORAGE_KEYS.SETTINGS, settings);
  },

  // --- TASKS ---
  getTasks(): Task[] {
    return load(STORAGE_KEYS.TASKS, initialTasks);
  },
  getTodayPriorities(): Task[] {
    return this.getTasks().filter((t) => t.isPriorityPin && t.status !== 'COMPLETED').slice(0, 3);
  },
  addTask(title: string, category: string = 'Work', isPriority: boolean = false, description: string = ''): Task {
    const tasks = this.getTasks();
    const newTask: Task = {
      id: Date.now(),
      title,
      description,
      priority: isPriority ? 'HIGH' : 'NORMAL',
      status: 'TODO',
      isPriorityPin: isPriority,
      category,
      createdAtMillis: Date.now(),
    };
    tasks.unshift(newTask);
    save(STORAGE_KEYS.TASKS, tasks);

    this.addTimelineEntry({
      title: `Task Created: ${title}`,
      category,
      timestampMillis: Date.now(),
      type: 'TASK',
    });

    return newTask;
  },
  updateTask(updated: Task): void {
    const tasks = this.getTasks().map((t) => (t.id === updated.id ? updated : t));
    save(STORAGE_KEYS.TASKS, tasks);
  },
  toggleTaskStatus(taskId: number): void {
    const tasks = this.getTasks().map((t) => {
      if (t.id === taskId) {
        const nextStatus = t.status === 'COMPLETED' ? ('TODO' as const) : ('COMPLETED' as const);
        return {
          ...t,
          status: nextStatus,
          completedAtMillis: nextStatus === 'COMPLETED' ? Date.now() : null,
        };
      }
      return t;
    });
    save(STORAGE_KEYS.TASKS, tasks);
  },
  toggleTaskPriorityPin(taskId: number): void {
    const tasks = this.getTasks().map((t) => (t.id === taskId ? { ...t, isPriorityPin: !t.isPriorityPin } : t));
    save(STORAGE_KEYS.TASKS, tasks);
  },
  deleteTask(taskId: number): void {
    const tasks = this.getTasks().filter((t) => t.id !== taskId);
    save(STORAGE_KEYS.TASKS, tasks);
  },

  // --- ACTIVITY TIMER ---
  getActiveActivity(): ActivityLog | null {
    return load<ActivityLog | null>(STORAGE_KEYS.ACTIVE_ACTIVITY, null);
  },
  startActivity(name: string, category: string = 'Work', note?: string | null): ActivityLog {
    const current = this.getActiveActivity();
    if (current) {
      this.finishActivity(current.id);
    }

    const newActivity: ActivityLog = {
      id: Date.now(),
      activityName: name,
      category,
      startTimeMillis: Date.now(),
      durationSeconds: 0,
      isRunning: true,
      isPaused: false,
      accumulatedPausedDurationSeconds: 0,
      note: note || null,
    };

    save(STORAGE_KEYS.ACTIVE_ACTIVITY, newActivity);
    return newActivity;
  },
  pauseActivity(activityId?: number): void {
    const active = this.getActiveActivity();
    if (active && (!activityId || String(active.id) === String(activityId)) && active.isRunning && !active.isPaused) {
      const updated: ActivityLog = {
        ...active,
        isPaused: true,
        pauseStartTimeMillis: Date.now(),
      };
      save(STORAGE_KEYS.ACTIVE_ACTIVITY, updated);
    }
  },
  resumeActivity(activityId?: number): void {
    const active = this.getActiveActivity();
    if (active && (!activityId || String(active.id) === String(activityId)) && active.isPaused) {
      const now = Date.now();
      const pauseStart = active.pauseStartTimeMillis || now;
      const extraPausedSecs = Math.max(0, Math.floor((now - pauseStart) / 1000));
      const updated: ActivityLog = {
        ...active,
        isPaused: false,
        pauseStartTimeMillis: null,
        accumulatedPausedDurationSeconds: (active.accumulatedPausedDurationSeconds || 0) + extraPausedSecs,
      };
      save(STORAGE_KEYS.ACTIVE_ACTIVITY, updated);
    }
  },
  discardActivity(activityId?: number): void {
    const active = this.getActiveActivity();
    if (active && (!activityId || String(active.id) === String(activityId))) {
      save(STORAGE_KEYS.ACTIVE_ACTIVITY, null);
    }
  },
  finishActivity(activityId?: number, finalNote?: string | null, completedTaskId?: number | null): void {
    const active = this.getActiveActivity();
    if (active && (!activityId || String(active.id) === String(activityId))) {
      const now = Date.now();
      let extraPausedSecs = 0;
      if (active.isPaused && active.pauseStartTimeMillis) {
        extraPausedSecs = Math.max(0, Math.floor((now - active.pauseStartTimeMillis) / 1000));
      }
      const totalPausedSecs = (active.accumulatedPausedDurationSeconds || 0) + extraPausedSecs;
      const grossDurationSecs = Math.max(0, Math.floor((now - active.startTimeMillis) / 1000));
      const netDurationSecs = Math.max(0, grossDurationSecs - totalPausedSecs);
      const durationMins = netDurationSecs >= 60 ? Math.round(netDurationSecs / 60) : (netDurationSecs >= 10 ? 1 : 0);

      const noteToSave = finalNote !== undefined ? finalNote : (active.note || null);

      const finishedActivity: ActivityLog = {
        ...active,
        endTimeMillis: now,
        durationSeconds: netDurationSecs,
        isRunning: false,
        isPaused: false,
        accumulatedPausedDurationSeconds: totalPausedSecs,
        note: noteToSave,
      };

      // 1. Save to history list
      const activities = load<ActivityLog[]>(STORAGE_KEYS.ACTIVITIES, []);
      activities.unshift(finishedActivity);
      save(STORAGE_KEYS.ACTIVITIES, activities);

      // 2. Mark linked task as completed if requested
      if (completedTaskId) {
        this.toggleTaskStatus(completedTaskId);
      }

      // 3. Clear active timer
      save(STORAGE_KEYS.ACTIVE_ACTIVITY, null);

      // 4. Add to Timeline
      this.addTimelineEntry({
        title: finishedActivity.activityName,
        category: finishedActivity.category,
        timestampMillis: finishedActivity.startTimeMillis,
        durationMinutes: durationMins,
        note: finishedActivity.note || undefined,
        type: 'ACTIVITY',
      });
    }
  },
  getAllActivities(): ActivityLog[] {
    return load(STORAGE_KEYS.ACTIVITIES, []);
  },

  // --- TIMELINE ---
  getAllTimeline(): TimelineEntry[] {
    return load(STORAGE_KEYS.TIMELINE, initialTimeline);
  },
  getTodayTimeline(): TimelineEntry[] {
    const startOfDay = getStartOfDayMillis();
    return this.getAllTimeline().filter((e) => e.timestampMillis >= startOfDay);
  },
  addTimelineEntry(entry: Omit<TimelineEntry, 'id'>): TimelineEntry {
    const timeline = this.getAllTimeline();
    const newEntry: TimelineEntry = {
      ...entry,
      id: Date.now() + Math.floor(Math.random() * 1000),
    };
    timeline.unshift(newEntry);
    save(STORAGE_KEYS.TIMELINE, timeline);
    return newEntry;
  },
  deleteTimelineEntry(id: number): void {
    const timeline = this.getAllTimeline().filter((e) => e.id !== id);
    save(STORAGE_KEYS.TIMELINE, timeline);
  },

  // --- QUICK CAPTURE ---
  getAllCaptures(): QuickCapture[] {
    return load(STORAGE_KEYS.CAPTURES, []);
  },
  getTodayCaptures(): QuickCapture[] {
    const startOfDay = getStartOfDayMillis();
    return this.getAllCaptures().filter((c) => c.createdAtMillis >= startOfDay);
  },
  addQuickCapture(text: string, category: string = 'Personal'): QuickCapture {
    const captures = this.getAllCaptures();
    const newCapture: QuickCapture = {
      id: Date.now(),
      text,
      category,
      tags: '',
      createdAtMillis: Date.now(),
    };
    captures.unshift(newCapture);
    save(STORAGE_KEYS.CAPTURES, captures);

    this.addTimelineEntry({
      title: `Note: ${text}`,
      category,
      timestampMillis: Date.now(),
      type: 'CAPTURE',
    });

    return newCapture;
  },
  addQuickCaptureNote(text: string, category: string = 'Personal'): QuickCapture {
    return this.addQuickCapture(text, category);
  },
  deleteQuickCapture(id: number): void {
    const captures = this.getAllCaptures().filter((c) => c.id !== id);
    save(STORAGE_KEYS.CAPTURES, captures);
  },

  // --- CHECK-IN & REVIEW ---
  getMorningCheckIn(): MorningCheckIn | null {
    const checkIns = load<Record<string, MorningCheckIn>>(STORAGE_KEYS.CHECKIN, {
      [getTodayDateString()]: initialMorningCheckIn,
    });
    return checkIns[getTodayDateString()] || null;
  },
  getCheckIns(): MorningCheckIn[] {
    const map = load<Record<string, MorningCheckIn>>(STORAGE_KEYS.CHECKIN, {
      [getTodayDateString()]: initialMorningCheckIn,
    });
    return Object.values(map);
  },
  saveMorningCheckIn(checkIn: MorningCheckIn): void {
    const checkIns = load<Record<string, MorningCheckIn>>(STORAGE_KEYS.CHECKIN, {});
    checkIns[checkIn.dateString] = checkIn;
    save(STORAGE_KEYS.CHECKIN, checkIns);

    this.addTimelineEntry({
      title: 'Morning Check-In Completed',
      category: 'Personal',
      timestampMillis: Date.now(),
      note: `Goal: ${checkIn.mainGoal}`,
      type: 'CHECKIN',
    });
  },
  saveCheckIn(checkIn: MorningCheckIn): void {
    this.saveMorningCheckIn(checkIn);
  },
  getEveningReview(): EveningReview | null {
    const reviews = load<Record<string, EveningReview>>(STORAGE_KEYS.REVIEW, {});
    return reviews[getTodayDateString()] || null;
  },
  getReviews(): EveningReview[] {
    const map = load<Record<string, EveningReview>>(STORAGE_KEYS.REVIEW, {});
    return Object.values(map);
  },
  saveEveningReview(review: EveningReview): void {
    const reviews = load<Record<string, EveningReview>>(STORAGE_KEYS.REVIEW, {});
    reviews[review.dateString] = review;
    save(STORAGE_KEYS.REVIEW, reviews);

    this.addTimelineEntry({
      title: `Evening Review Completed (Rating: ${review.rating}/10)`,
      category: 'Personal',
      timestampMillis: Date.now(),
      note: review.wentWell,
      type: 'CHECKIN',
    });
  },
  saveReview(review: EveningReview): void {
    this.saveEveningReview(review);
  },

  // --- JOURNAL ---
  getJournalEntries(): JournalEntry[] {
    return load(STORAGE_KEYS.JOURNAL, initialJournal);
  },
  addJournalEntry(title: string, content: string, moodScore: number = 5, category: string = 'Personal', tags: string = ''): JournalEntry {
    const journal = this.getJournalEntries();
    const newEntry: JournalEntry = {
      id: Date.now(),
      title,
      content,
      tags,
      category,
      moodScore,
      createdAtMillis: Date.now(),
      updatedAtMillis: Date.now(),
    };
    journal.unshift(newEntry);
    save(STORAGE_KEYS.JOURNAL, journal);

    this.addTimelineEntry({
      title: `Journal: ${title}`,
      category,
      timestampMillis: Date.now(),
      type: 'JOURNAL',
    });

    return newEntry;
  },
  deleteJournalEntry(id: number): void {
    const journal = this.getJournalEntries().filter((j) => j.id !== id);
    save(STORAGE_KEYS.JOURNAL, journal);
  },

  // --- STUDY ---
  getStudyCards(): StudyCard[] {
    return load(STORAGE_KEYS.STUDY_CARDS, initialStudyCards);
  },
  addStudyCard(topic: string, question: string, answer: string): StudyCard {
    const cards = this.getStudyCards();
    const newCard: StudyCard = {
      id: Date.now(),
      topic,
      question,
      answer,
      confidence: 5,
      reviewCount: 0,
      easeFactor: 2.5,
    };
    cards.unshift(newCard);
    save(STORAGE_KEYS.STUDY_CARDS, cards);
    return newCard;
  },
  reviewStudyCard(cardId: number, rating: 'AGAIN' | 'HARD' | 'GOOD' | 'EASY'): void {
    const cards = this.getStudyCards().map((card) => {
      if (card.id === cardId) {
        let confidence = 5;
        if (rating === 'AGAIN') confidence = 2;
        if (rating === 'HARD') confidence = 5;
        if (rating === 'GOOD') confidence = 8;
        if (rating === 'EASY') confidence = 10;
        return {
          ...card,
          confidence,
          reviewCount: card.reviewCount + 1,
          lastReviewedMillis: Date.now(),
        };
      }
      return card;
    });
    save(STORAGE_KEYS.STUDY_CARDS, cards);
  },
  deleteStudyCard(id: number): void {
    const cards = this.getStudyCards().filter((c) => c.id !== id);
    save(STORAGE_KEYS.STUDY_CARDS, cards);
  },

  // --- AI CHAT ---
  getAiMessages(): AIMessage[] {
    return load(STORAGE_KEYS.AI_MESSAGES, initialAiMessages);
  },
  addAiMessage(senderOrMsg: 'USER' | 'AI' | AIMessage, text?: string, actionType?: any, actionPayloadJson?: any): AIMessage {
    const messages = this.getAiMessages();
    let newMsg: AIMessage;

    if (typeof senderOrMsg === 'object') {
      newMsg = {
        ...senderOrMsg,
        id: senderOrMsg.id || Date.now(),
        sender: senderOrMsg.sender || (senderOrMsg.isUser ? 'USER' : 'AI'),
        isUser: senderOrMsg.isUser ?? senderOrMsg.sender === 'USER',
        timestampMillis: senderOrMsg.timestampMillis || Date.now(),
      };
    } else {
      newMsg = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        sender: senderOrMsg,
        isUser: senderOrMsg === 'USER',
        text: text || '',
        actionType,
        actionPayloadJson,
        isActionConfirmed: null,
        timestampMillis: Date.now(),
      };
    }

    messages.push(newMsg);
    save(STORAGE_KEYS.AI_MESSAGES, messages);
    return newMsg;
  },
  confirmAiAction(messageId: number, actionType: string, payloadJson: string): void {
    // Execute action
    try {
      const payload = JSON.parse(payloadJson);
      if (actionType === 'ADD_TASK' || payload.type === 'ADD_TASK') {
        this.addTask(payload.title || 'New AI Task', payload.category || 'Work', true);
      } else if (actionType === 'START_ACTIVITY' || payload.type === 'START_ACTIVITY') {
        this.startActivity(payload.name || 'AI Activity', payload.category || 'Work');
      } else if (actionType === 'SAVE_NOTE' || payload.type === 'SAVE_NOTE') {
        this.addQuickCapture(payload.text || 'AI Note');
      }
    } catch (e) {
      console.error('Failed to parse payloadJson:', e);
    }

    // Mark message action as confirmed
    const messages = this.getAiMessages().map((m) => (m.id === messageId ? { ...m, isActionConfirmed: true } : m));
    save(STORAGE_KEYS.AI_MESSAGES, messages);
  },
  clearAiChat(): void {
    save(STORAGE_KEYS.AI_MESSAGES, []);
  },

  // --- GLOBAL SEARCH & EXTRA STORAGE HELPERS ---
  getTimelineEntries(): TimelineEntry[] {
    return this.getAllTimeline();
  },
  searchAll(query: string): SearchResults {
    return this.globalSearch(query);
  },
  globalSearch(query: string): SearchResults {
    if (!query.trim()) {
      return { tasks: [], timeline: [], captures: [], journal: [], studyCards: [] };
    }
    const q = query.toLowerCase();
    return {
      tasks: this.getTasks().filter((t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)),
      timeline: this.getAllTimeline().filter((tl) => tl.title.toLowerCase().includes(q) || (tl.note && tl.note.toLowerCase().includes(q))),
      captures: this.getAllCaptures().filter((c) => c.text.toLowerCase().includes(q)),
      journal: this.getJournalEntries().filter((j) => j.title.toLowerCase().includes(q) || j.content.toLowerCase().includes(q)),
      studyCards: this.getStudyCards().filter(
        (s) => s.topic.toLowerCase().includes(q) || s.question.toLowerCase().includes(q) || s.answer.toLowerCase().includes(q)
      ),
    };
  },
  updateSettings(updated: Partial<UserSettings>): UserSettings {
    const current = this.getSettings();
    const merged = { ...current, ...updated };
    this.saveSettings(merged);
    return merged;
  },
  seedSampleData(): void {
    save(STORAGE_KEYS.TASKS, initialTasks);
    save(STORAGE_KEYS.TIMELINE, initialTimeline);
    save(STORAGE_KEYS.CAPTURES, []);
    save(STORAGE_KEYS.CHECKIN, { [initialMorningCheckIn.dateString]: initialMorningCheckIn });
    save(STORAGE_KEYS.JOURNAL, initialJournal);
    save(STORAGE_KEYS.STUDY_CARDS, initialStudyCards);
    save(STORAGE_KEYS.AI_MESSAGES, initialAiMessages);
    save(STORAGE_KEYS.SETTINGS, initialSettings);
  },
  clearAllData(): void {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  },
  exportBackupJson(): string {
    const backup: Record<string, any> = {};
    Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => {
      backup[key] = load(storageKey, null);
    });
    return JSON.stringify(backup, null, 2);
  },
  getUserContextString(): string {
    const now = new Date();
    const active = this.getActiveActivity();
    const tasks = this.getTasks();
    const timeline = this.getAllTimeline().slice(0, 10);
    const todayDateStr = getTodayDateString();
    const todayCheckIn = this.getMorningCheckIn();
    const todayReview = this.getEveningReview();
    const captures = this.getAllCaptures().slice(0, 5);
    const journal = this.getJournalEntries().slice(0, 3);

    const formatTime = (ms?: number | null) => {
      if (!ms) return 'N/A';
      const d = new Date(ms);
      return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    };

    return `
CURRENT LOCAL TIME & DATE METADATA:
- Current Date: ${now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} (${todayDateStr})
- Current Local Time: ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
- Unix Timestamp: ${now.getTime()}

ACTIVE SESSION / ACTIVITY:
${active ? `- Currently Active: "${active.activityName}" [Category: ${active.category}] | Started At: ${formatTime(active.startTimeMillis)} | Running Duration: ${Math.floor((now.getTime() - active.startTimeMillis) / 60000)} minutes` : '- No active session currently running.'}

TODAY'S MORNING CHECK-IN (${todayDateStr}):
${todayCheckIn ? `- Goal: "${todayCheckIn.mainGoal}" | Top Priority: "${todayCheckIn.priority1}" | Energy Level: ${todayCheckIn.energy}/10 | Mood: ${todayCheckIn.mood}/10 | Logged At: ${formatTime(todayCheckIn.createdAtMillis)}` : '- Morning Check-in not yet recorded for today.'}

TODAY'S EVENING REVIEW (${todayDateStr}):
${todayReview ? `- Rating: ${todayReview.rating}/10 | What Went Well: "${todayReview.wentWell}" | What Didn't Go Well: "${todayReview.didntGoWell}" | Learned: "${todayReview.learnedText}" | Logged At: ${formatTime(todayReview.createdAtMillis)}` : '- Evening Review not yet recorded for today.'}

PENDING & IN-PROGRESS TASKS:
${tasks.filter((t) => t.status !== 'COMPLETED').map((t) => `- [${t.priority}] "${t.title}" (${t.category}) | Status: ${t.status} | Created At: ${formatTime(t.createdAtMillis)}`).join('\n') || '- No pending tasks.'}

RECENTLY COMPLETED TASKS:
${tasks.filter((t) => t.status === 'COMPLETED').slice(0, 5).map((t) => `- "${t.title}" (${t.category}) | Completed At: ${formatTime(t.completedAtMillis)}`).join('\n') || '- No completed tasks recorded.'}

RECENT TIMELINE & ACTIVITY LOGS (Most Recent First):
${timeline.map((t) => `- [${formatTime(t.timestampMillis)}] ${t.title} (${t.category}) ${t.durationMinutes ? `| Duration: ${t.durationMinutes}m` : ''} ${t.note ? `| Note: ${t.note}` : ''}`).join('\n') || '- No timeline entries.'}

RECENT QUICK CAPTURES / NOTES:
${captures.map((c) => `- [${formatTime(c.createdAtMillis)}] "${c.text}"`).join('\n') || '- No quick captures.'}

RECENT JOURNAL ENTRIES:
${journal.map((j) => `- [${formatTime(j.createdAtMillis)}] "${j.title}" (Mood Score: ${j.moodScore || 5}/10) | Preview: "${j.content.slice(0, 80)}..."`).join('\n') || '- No journal entries.'}
    `.trim();
  },
};

export const PAIOSStorage = storage;
