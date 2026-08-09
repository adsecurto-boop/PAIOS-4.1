import React, { useState, useRef, useEffect } from 'react';
import { Cpu, Send, Bot, User, Sparkles, Check, Play, Zap, AlertCircle } from 'lucide-react';
import { AiChatMessage, ActivityLog, Task, TimelineEntry, MorningCheckIn } from '../types';

interface AiScreenProps {
  messages: AiChatMessage[];
  userContextString: string;
  onSendMessage: (userText: string) => Promise<void>;
  onExecuteAction: (actionType: string, actionPayloadJson: string) => void;
}

export const AiScreen: React.FC<AiScreenProps> = ({
  messages,
  userContextString,
  onSendMessage,
  onExecuteAction,
}) => {
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [executedActionIds, setExecutedActionIds] = useState<number[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;
    const text = inputText.trim();
    setInputText('');
    setIsSending(true);
    try {
      await onSendMessage(text);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  const handleExecute = (msgId: number, type: string, payloadJson: string) => {
    onExecuteAction(type, payloadJson);
    setExecutedActionIds((prev) => [...prev, msgId]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-h-[800px] bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/80 backdrop-blur flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-base text-white flex items-center gap-2">
              PAIOS Intelligent Assistant
              <span className="text-[10px] font-mono uppercase bg-indigo-950 text-indigo-300 border border-indigo-800/60 px-1.5 py-0.5 rounded">
                Gemini 3.6
              </span>
            </h2>
            <p className="text-xs text-slate-400">Context-aware productivity AI with real-time system actions</p>
          </div>
        </div>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-slate-500 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-950 border border-indigo-800 flex items-center justify-center mx-auto text-indigo-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-300">How can PAIOS assist you today?</p>
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-md mx-auto pt-2">
              <button
                onClick={() => setInputText('Summarize my top priorities and schedule for today')}
                className="text-xs font-mono bg-slate-950 border border-slate-800 hover:border-indigo-500 text-slate-300 px-3 py-1.5 rounded-lg text-left"
              >
                &ldquo;Summarize my day&rdquo;
              </button>
              <button
                onClick={() => setInputText('Add a task to prepare ISTQB flashcards for testing category')}
                className="text-xs font-mono bg-slate-950 border border-slate-800 hover:border-indigo-500 text-slate-300 px-3 py-1.5 rounded-lg text-left"
              >
                &ldquo;Add a task for me&rdquo;
              </button>
              <button
                onClick={() => setInputText('Start a 45-minute Deep Work coding activity timer')}
                className="text-xs font-mono bg-slate-950 border border-slate-800 hover:border-indigo-500 text-slate-300 px-3 py-1.5 rounded-lg text-left"
              >
                &ldquo;Start a timer&rdquo;
              </button>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${msg.isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                  msg.isUser
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-cyan-400 border border-slate-700'
                }`}
              >
                {msg.isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className={`space-y-2 max-w-[85%] sm:max-w-[75%]`}>
                <div
                  className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    msg.isUser
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none whitespace-pre-line'
                  }`}
                >
                  {msg.text}
                </div>

                {/* Structured Action Block Execution Card */}
                {!msg.isUser && msg.actionType && msg.actionPayloadJson && (
                  <div className="bg-slate-950 border border-indigo-900/80 p-3 rounded-xl space-y-2 shadow-lg">
                    <div className="flex items-center justify-between text-[11px] font-mono font-bold text-indigo-400">
                      <span className="flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-amber-400" /> Suggested Action: {msg.actionType}
                      </span>
                    </div>

                    <pre className="text-[10px] font-mono text-slate-300 bg-slate-900 p-2 rounded border border-slate-800 overflow-x-auto">
                      {msg.actionPayloadJson}
                    </pre>

                    {executedActionIds.includes(msg.id) ? (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold pt-1">
                        <Check className="w-4 h-4" /> Action Executed Successfully
                      </div>
                    ) : (
                      <button
                        onClick={() => handleExecute(msg.id, msg.actionType!, msg.actionPayloadJson!)}
                        className="w-full py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                      >
                        <Play className="w-3 h-3 fill-current" /> Execute PAIOS Action
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {isSending && (
          <div className="flex items-center gap-2 text-xs font-mono text-indigo-400 p-2">
            <Bot className="w-4 h-4 animate-bounce" />
            <span>PAIOS is thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSend} className="p-3 border-t border-slate-800 bg-slate-950/80 backdrop-blur flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask PAIOS or issue a system command..."
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isSending}
          className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
