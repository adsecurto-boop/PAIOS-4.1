import React, { useState, useEffect } from 'react';
import {
  Sun,
  History,
  CheckCircle2,
  Brain,
  BarChart3,
  Cpu,
  BookOpen,
  Settings,
  Plus,
  Play,
  Zap,
} from 'lucide-react';
import { NavTab, ActivityLog, Task, TimelineEntry, StudyCard, JournalEntry, MorningCheckIn, EveningReview, AiChatMessage, UserSettings, SearchResults } from './types';
import { PAIOSStorage } from './storage';
import { TopHeaderBar } from './components/TopHeaderBar';
import { MiniTimerPlayer } from './components/MiniTimerPlayer';
import { StartActivityModal } from './components/StartActivityModal';
import { QuickCaptureModal } from './components/QuickCaptureModal';
import { CheckInModal } from './components/CheckInModal';
import { ReviewModal } from './components/ReviewModal';
import { TaskModal } from './components/TaskModal';
import { StudyCardModal } from './components/StudyCardModal';
import { SearchModal } from './components/SearchModal';

import { TodayScreen } from './screens/TodayScreen';
import { TimelineScreen } from './screens/TimelineScreen';
import { TasksScreen } from './screens/TasksScreen';
import { LearnScreen } from './screens/LearnScreen';
import { InsightsScreen } from './screens/InsightsScreen';
import { AiScreen } from './screens/AiScreen';
import { JournalScreen } from './screens/JournalScreen';
import { SettingsScreen } from './screens/SettingsScreen';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>(NavTab.TODAY);

  // Storage State
  const [activeActivity, setActiveActivity] = useState<ActivityLog | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>([]);
  const [studyCards, setStudyCards] = useState<StudyCard[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [checkIns, setCheckIns] = useState<MorningCheckIn[]>([]);
  const [reviews, setReviews] = useState<EveningReview[]>([]);
  const [aiMessages, setAiMessages] = useState<AiChatMessage[]>([]);
  const [settings, setSettings] = useState<UserSettings>(PAIOSStorage.getSettings());

  // Search
  const [searchResults, setSearchResults] = useState<SearchResults>({
    tasks: [],
    timeline: [],
    captures: [],
    journal: [],
    studyCards: [],
  });

  // Modals
  const [showStartActivityModal, setShowStartActivityModal] = useState(false);
  const [showQuickCaptureModal, setShowQuickCaptureModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showStudyCardModal, setShowStudyCardModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);

  // Live Timer State for MiniTimerPlayer
  const [elapsedTimerSeconds, setElapsedTimerSeconds] = useState(0);

  // Reload state helper
  const reloadState = () => {
    setActiveActivity(PAIOSStorage.getActiveActivity());
    setTasks(PAIOSStorage.getTasks());
    setTimelineEntries(PAIOSStorage.getTimelineEntries());
    setStudyCards(PAIOSStorage.getStudyCards());
    setJournalEntries(PAIOSStorage.getJournalEntries());
    setCheckIns(PAIOSStorage.getCheckIns());
    setReviews(PAIOSStorage.getReviews());
    setAiMessages(PAIOSStorage.getAiMessages());
    setSettings(PAIOSStorage.getSettings());
  };

  useEffect(() => {
    reloadState();
  }, []);

  // Timer Ticker Loop
  useEffect(() => {
    let interval: any = null;
    if (activeActivity) {
      const updateSeconds = () => {
        const now = Date.now();
        if (activeActivity.isRunning && !activeActivity.isPaused) {
          const grossSecs = Math.floor((now - activeActivity.startTimeMillis) / 1000);
          const netSecs = Math.max(0, grossSecs - activeActivity.accumulatedPausedDurationSeconds);
          setElapsedTimerSeconds(netSecs);
        } else if (activeActivity.isPaused) {
          const pauseStart = activeActivity.pauseStartTimeMillis || now;
          const grossSecs = Math.floor((pauseStart - activeActivity.startTimeMillis) / 1000);
          const netSecs = Math.max(0, grossSecs - activeActivity.accumulatedPausedDurationSeconds);
          setElapsedTimerSeconds(netSecs);
        }
      };
      updateSeconds();
      interval = setInterval(updateSeconds, 1000);
    } else {
      setElapsedTimerSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeActivity]);

  // Activity Handlers
  const handleStartActivity = (name: string, category: string, note?: string) => {
    PAIOSStorage.startActivity(name, category, note);
    reloadState();
  };

  const handlePauseActivity = (id: number) => {
    PAIOSStorage.pauseActivity(id);
    reloadState();
  };

  const handleResumeActivity = (id: number) => {
    PAIOSStorage.resumeActivity(id);
    reloadState();
  };

  const handleFinishActivity = (id: number) => {
    PAIOSStorage.finishActivity(id);
    reloadState();
  };

  // Quick Capture
  const handleSaveQuickCapture = (text: string, category: string) => {
    PAIOSStorage.addQuickCaptureNote(text, category);
    reloadState();
  };

  // CheckIn & Review
  const handleSaveCheckIn = (checkIn: MorningCheckIn) => {
    PAIOSStorage.saveCheckIn(checkIn);
    reloadState();
  };

  const handleSaveReview = (review: EveningReview) => {
    PAIOSStorage.saveReview(review);
    reloadState();
  };

  // Tasks
  const handleSaveTask = (title: string, category: string, isPriority: boolean, description: string) => {
    PAIOSStorage.addTask(title, category, isPriority, description);
    reloadState();
  };

  const handleToggleTaskStatus = (taskId: number) => {
    PAIOSStorage.toggleTaskStatus(taskId);
    reloadState();
  };

  const handleToggleTaskPriority = (taskId: number) => {
    PAIOSStorage.toggleTaskPriorityPin(taskId);
    reloadState();
  };

  const handleDeleteTask = (taskId: number) => {
    PAIOSStorage.deleteTask(taskId);
    reloadState();
  };

  // Study Cards
  const handleSaveStudyCard = (topic: string, question: string, answer: string) => {
    PAIOSStorage.addStudyCard(topic, question, answer);
    reloadState();
  };

  const handleReviewStudyCard = (cardId: number, rating: 'AGAIN' | 'HARD' | 'GOOD' | 'EASY') => {
    PAIOSStorage.reviewStudyCard(cardId, rating);
    reloadState();
  };

  const handleDeleteStudyCard = (id: number) => {
    PAIOSStorage.deleteStudyCard(id);
    reloadState();
  };

  // Journal
  const handleAddJournalEntry = (title: string, content: string, moodScore: number, category: string) => {
    PAIOSStorage.addJournalEntry(title, content, moodScore, category);
    reloadState();
  };

  const handleDeleteJournalEntry = (id: number) => {
    PAIOSStorage.deleteJournalEntry(id);
    reloadState();
  };

  // Timeline
  const handleDeleteTimelineEntry = (id: number) => {
    PAIOSStorage.deleteTimelineEntry(id);
    reloadState();
  };

  // Search
  const handleSearch = (query: string) => {
    const res = PAIOSStorage.searchAll(query);
    setSearchResults(res);
  };

  // Settings
  const handleUpdateSettings = (updated: Partial<UserSettings>) => {
    PAIOSStorage.updateSettings(updated);
    reloadState();
  };

  const handleResetSampleData = () => {
    PAIOSStorage.seedSampleData();
    reloadState();
  };

  const handleClearAllData = () => {
    PAIOSStorage.clearAllData();
    reloadState();
  };

  const handleExportData = () => {
    const backupJson = PAIOSStorage.exportBackupJson();
    const blob = new Blob([backupJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `paios_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // AI Chat Communication
  const handleSendAiMessage = async (userText: string) => {
    const userMsg: AiChatMessage = {
      id: Date.now(),
      text: userText,
      isUser: true,
      timestampMillis: Date.now(),
    };

    PAIOSStorage.addAiMessage(userMsg);
    reloadState();

    const contextStr = PAIOSStorage.getUserContextString();

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userText,
          userContext: contextStr,
          modelName: settings.preferredModel,
          customApiKey: settings.customApiKey,
        }),
      });

      const data = await response.json();

      const botMsg: AiChatMessage = {
        id: Date.now() + 1,
        text: data.text || "I'm sorry, I couldn't generate a response.",
        isUser: false,
        timestampMillis: Date.now(),
        actionType: data.actionType || undefined,
        actionPayloadJson: data.actionPayloadJson || undefined,
      };

      PAIOSStorage.addAiMessage(botMsg);
      reloadState();
    } catch (err) {
      console.error(err);
      const errorMsg: AiChatMessage = {
        id: Date.now() + 1,
        text: 'Error connecting to PAIOS AI server. Please verify your network or Gemini settings.',
        isUser: false,
        timestampMillis: Date.now(),
      };
      PAIOSStorage.addAiMessage(errorMsg);
      reloadState();
    }
  };

  // AI Action Execution
  const handleExecuteAiAction = (actionType: string, actionPayloadJson: string) => {
    try {
      const payload = JSON.parse(actionPayloadJson);
      if (actionType === 'ADD_TASK' || payload.type === 'ADD_TASK') {
        PAIOSStorage.addTask(payload.title || 'AI Generated Task', payload.category || 'General', true, 'Added via PAIOS AI');
      } else if (actionType === 'START_ACTIVITY' || payload.type === 'START_ACTIVITY') {
        PAIOSStorage.startActivity(payload.name || 'AI Session', payload.category || 'Work', 'Started via PAIOS AI');
      } else if (actionType === 'SAVE_NOTE' || payload.type === 'SAVE_NOTE') {
        PAIOSStorage.addQuickCaptureNote(payload.text || 'AI Note', 'Personal');
      }
      reloadState();
    } catch (e) {
      console.error('Failed to parse AI action payload:', e);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayCheckIn = checkIns.find((c) => c.dateString === todayStr) || null;
  const todayReview = reviews.find((r) => r.dateString === todayStr) || null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Header Bar */}
      <TopHeaderBar
        userName={settings.userName}
        onOpenSearch={() => {
          handleSearch('');
          setShowSearchModal(true);
        }}
        onOpenCheckIn={() => setShowCheckInModal(true)}
        onOpenReview={() => setShowReviewModal(true)}
        onOpenSettings={() => setActiveTab(NavTab.SETTINGS)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6">
        {activeTab === NavTab.TODAY && (
          <TodayScreen
            activeActivity={activeActivity}
            priorities={tasks.filter((t) => t.isPriorityPin)}
            todayTasks={tasks}
            timelineEntries={timelineEntries}
            userName={settings.userName}
            onStartActivity={handleStartActivity}
            onPauseActivity={handlePauseActivity}
            onResumeActivity={handleResumeActivity}
            onFinishActivity={handleFinishActivity}
            onToggleTaskStatus={handleToggleTaskStatus}
            onOpenStartActivity={() => setShowStartActivityModal(true)}
            onOpenQuickCapture={() => setShowQuickCaptureModal(true)}
            onOpenAddTask={() => setShowTaskModal(true)}
            onOpenJournal={() => setActiveTab(NavTab.JOURNAL)}
            onOpenStudy={() => setActiveTab(NavTab.LEARN)}
          />
        )}

        {activeTab === NavTab.TIMELINE && (
          <TimelineScreen timelineEntries={timelineEntries} onDeleteEntry={handleDeleteTimelineEntry} />
        )}

        {activeTab === NavTab.TASKS && (
          <TasksScreen
            tasks={tasks}
            onToggleTaskStatus={handleToggleTaskStatus}
            onToggleTaskPriorityPin={handleToggleTaskPriority}
            onDeleteTask={handleDeleteTask}
            onOpenAddTask={() => setShowTaskModal(true)}
          />
        )}

        {activeTab === NavTab.LEARN && (
          <LearnScreen
            studyCards={studyCards}
            onStartStudySession={(topic, mins) => {
              handleStartActivity(`Study: ${topic}`, 'Study', `${mins} min active recall session`);
            }}
            onReviewStudyCard={handleReviewStudyCard}
            onDeleteStudyCard={handleDeleteStudyCard}
            onOpenAddCard={() => setShowStudyCardModal(true)}
          />
        )}

        {activeTab === NavTab.INSIGHTS && (
          <InsightsScreen activityLogs={timelineEntries as any} checkIns={checkIns} reviews={reviews} />
        )}

        {activeTab === NavTab.AI && (
          <AiScreen
            messages={aiMessages}
            userContextString={PAIOSStorage.getUserContextString()}
            onSendMessage={handleSendAiMessage}
            onExecuteAction={handleExecuteAiAction}
          />
        )}

        {activeTab === NavTab.JOURNAL && (
          <JournalScreen
            entries={journalEntries}
            onAddJournalEntry={handleAddJournalEntry}
            onDeleteJournalEntry={handleDeleteJournalEntry}
          />
        )}

        {activeTab === NavTab.SETTINGS && (
          <SettingsScreen
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onResetSampleData={handleResetSampleData}
            onClearAllData={handleClearAllData}
            onExportData={handleExportData}
          />
        )}
      </main>

      {/* Persistent Floating Mini Timer Player */}
      {activeActivity && activeTab !== NavTab.TODAY && (
        <div className="fixed bottom-16 left-0 right-0 z-40">
          <MiniTimerPlayer
            activity={activeActivity}
            elapsedSeconds={elapsedTimerSeconds}
            onPause={handlePauseActivity}
            onResume={handleResumeActivity}
            onFinish={handleFinishActivity}
            onTap={() => setActiveTab(NavTab.TODAY)}
          />
        </div>
      )}

      {/* Bottom Navigation Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-slate-900/95 border-t border-slate-800/80 backdrop-blur-md px-2 py-2">
        <div className="max-w-2xl mx-auto flex items-center justify-around">
          <button
            onClick={() => setActiveTab(NavTab.TODAY)}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
              activeTab === NavTab.TODAY ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sun className="w-5 h-5" />
            <span className="text-[10px] font-mono">Today</span>
          </button>

          <button
            onClick={() => setActiveTab(NavTab.TIMELINE)}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
              activeTab === NavTab.TIMELINE ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-5 h-5" />
            <span className="text-[10px] font-mono">Timeline</span>
          </button>

          <button
            onClick={() => setActiveTab(NavTab.TASKS)}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
              activeTab === NavTab.TASKS ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-[10px] font-mono">Tasks</span>
          </button>

          <button
            onClick={() => setActiveTab(NavTab.LEARN)}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
              activeTab === NavTab.LEARN ? 'text-purple-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Brain className="w-5 h-5" />
            <span className="text-[10px] font-mono">Learn</span>
          </button>

          <button
            onClick={() => setActiveTab(NavTab.INSIGHTS)}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
              activeTab === NavTab.INSIGHTS ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-[10px] font-mono">Insights</span>
          </button>

          <button
            onClick={() => setActiveTab(NavTab.AI)}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
              activeTab === NavTab.AI ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-5 h-5" />
            <span className="text-[10px] font-mono">PAIOS AI</span>
          </button>

          <button
            onClick={() => setActiveTab(NavTab.JOURNAL)}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
              activeTab === NavTab.JOURNAL ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-[10px] font-mono">Journal</span>
          </button>
        </div>
      </nav>

      {/* Modals */}
      {showStartActivityModal && (
        <StartActivityModal
          onDismiss={() => setShowStartActivityModal(false)}
          onStart={handleStartActivity}
        />
      )}

      {showQuickCaptureModal && (
        <QuickCaptureModal
          onDismiss={() => setShowQuickCaptureModal(false)}
          onSave={handleSaveQuickCapture}
        />
      )}

      {showCheckInModal && (
        <CheckInModal
          dateString={todayStr}
          existingCheckIn={todayCheckIn}
          onDismiss={() => setShowCheckInModal(false)}
          onSave={handleSaveCheckIn}
        />
      )}

      {showReviewModal && (
        <ReviewModal
          dateString={todayStr}
          activeTimeText={`${(
            timelineEntries.reduce((acc, e) => acc + (e.durationMinutes || 0), 0) / 60
          ).toFixed(1)}h`}
          tasksCompletedText={`${tasks.filter((t) => t.status === 'COMPLETED').length} tasks`}
          existingReview={todayReview}
          onDismiss={() => setShowReviewModal(false)}
          onSave={handleSaveReview}
        />
      )}

      {showTaskModal && (
        <TaskModal
          onDismiss={() => setShowTaskModal(false)}
          onSave={handleSaveTask}
        />
      )}

      {showStudyCardModal && (
        <StudyCardModal
          onDismiss={() => setShowStudyCardModal(false)}
          onSave={handleSaveStudyCard}
        />
      )}

      {showSearchModal && (
        <SearchModal
          searchResults={searchResults}
          onSearch={handleSearch}
          onDismiss={() => setShowSearchModal(false)}
        />
      )}
    </div>
  );
};

export default App;
