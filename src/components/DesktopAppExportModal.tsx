import React, { useState } from 'react';
import {
  X,
  Download,
  Terminal,
  Copy,
  Check,
  Folder,
  FileCode,
  ShieldCheck,
  Cpu,
  Monitor,
  Command,
  Sparkles,
} from 'lucide-react';

interface DesktopAppExportModalProps {
  onDismiss: () => void;
}

export const DesktopAppExportModal: React.FC<DesktopAppExportModalProps> = ({ onDismiss }) => {
  const [activeTab, setActiveTab] = useState<'electron' | 'tauri' | 'autoupdate' | 'hotkeys'>('electron');

  const githubWorkflowYaml = `name: Build & Release PAIOS Desktop (.exe)

on:
  push:
    branches: [ main, master ]
    tags: [ 'v*' ]
  workflow_dispatch:

jobs:
  build-windows-exe:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run build:exe
      - uses: actions/upload-artifact@v4
        with:
          name: PAIOS-Desktop-Windows-EXE
          path: dist-electron/PAIOS Desktop-win32-x64/
          retention-days: 30`;
  const [copiedScript, setCopiedScript] = useState<string | null>(null);

  const electronMainJs = `// PAIOS Desktop - Electron Main Process (main.js)
const { app, BrowserWindow, globalShortcut } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    icon: path.join(__dirname, 'icon.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // Load PAIOS Web App URL or build output index.html
  mainWindow.loadURL('http://localhost:3000'); // or mainWindow.loadFile('dist/index.html');

  // Register Global Shortcut (Ctrl+Shift+P for Quick PAIOS)
  globalShortcut.register('CommandOrControl+Shift+P', () => {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});`;

  const electronPackageJson = `{
  "name": "paios-desktop-win64",
  "version": "4.0.0",
  "description": "PAIOS Personal AI Operating System - Windows Desktop App",
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "build:win": "electron-builder --win nsis"
  },
  "devDependencies": {
    "electron": "^28.0.0",
    "electron-builder": "^24.9.0"
  }
}`;

  const winBatScript = `@echo off
echo ====================================================
echo Building PAIOS Desktop Windows (.exe) Application...
echo ====================================================
npm run build:exe
echo Built executable located in /dist-electron/PAIOS Desktop-win32-x64/PAIOS Desktop.exe!
pause`;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedScript(label);
    setTimeout(() => setCopiedScript(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl max-w-2xl w-full text-slate-100 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>PAIOS Windows Executable Package</span>
                <span className="text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-800 px-1.5 py-0.5 rounded uppercase">
                  Win64 Native
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Run PAIOS as a native Windows desktop app with desktop notifications and tray launcher
              </p>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="px-6 pt-3 bg-slate-900/60 border-b border-slate-800 flex gap-4 text-xs font-medium">
          <button
            onClick={() => setActiveTab('electron')}
            className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'electron'
                ? 'border-indigo-500 text-indigo-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>Electron Setup (Win64)</span>
          </button>

          <button
            onClick={() => setActiveTab('tauri')}
            className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'tauri'
                ? 'border-cyan-500 text-cyan-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Tauri Lightweight (.msi / .exe)</span>
          </button>

          <button
            onClick={() => setActiveTab('autoupdate')}
            className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'autoupdate'
                ? 'border-emerald-500 text-emerald-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Auto-Update & Git CI/CD</span>
          </button>

          <button
            onClick={() => setActiveTab('hotkeys')}
            className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'hotkeys'
                ? 'border-amber-500 text-amber-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Command className="w-4 h-4" />
            <span>Desktop Shortcuts</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-300 flex-1">
          {activeTab === 'electron' && (
            <div className="space-y-4">
              <div className="p-3 bg-indigo-950/40 border border-indigo-800/50 rounded-xl flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-200 text-sm">Standalone Windows .exe Packaging</h4>
                  <p className="text-slate-400 mt-0.5">
                    To compile PAIOS into a native Windows `.exe` installer on your PC, save these two files in your project root and run `npm run build:win`.
                  </p>
                </div>
              </div>

              {/* main.js snippet */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-indigo-300 font-semibold flex items-center gap-1">
                    <FileCode className="w-3.5 h-3.5" /> electron-main.cjs (Electron Process)
                  </span>
                  <button
                    onClick={() => handleCopy(electronMainJs, 'electron-main.cjs')}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md border border-slate-700 flex items-center gap-1 transition-colors text-[11px]"
                  >
                    {copiedScript === 'main.js' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy Code
                      </>
                    )}
                  </button>
                </div>
                <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-indigo-200 overflow-x-auto max-h-40">
                  {electronMainJs}
                </pre>
              </div>

              {/* build script */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-cyan-300 font-semibold flex items-center gap-1">
                    <Terminal className="w-3.5 h-3.5" /> build-installer.bat (Automated Build Script)
                  </span>
                  <button
                    onClick={() => handleCopy(winBatScript, 'bat')}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md border border-slate-700 flex items-center gap-1 transition-colors text-[11px]"
                  >
                    {copiedScript === 'bat' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy Script
                      </>
                    )}
                  </button>
                </div>
                <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-cyan-200 overflow-x-auto">
                  {winBatScript}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'tauri' && (
            <div className="space-y-3">
              <div className="p-3 bg-cyan-950/40 border border-cyan-800/50 rounded-xl">
                <h4 className="font-bold text-cyan-200 text-sm mb-1">Tauri Desktop Build (Ultra Lightweight ~12MB)</h4>
                <p className="text-slate-400">
                  Tauri uses native Windows WebView2 for minimal memory usage (&lt; 35MB RAM). Run the following command in terminal:
                </p>
                <div className="mt-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-cyan-300 flex items-center justify-between">
                  <span>npx @tauri-apps/cli init && npx @tauri-apps/cli build</span>
                  <button
                    onClick={() => handleCopy('npx @tauri-apps/cli init && npx @tauri-apps/cli build', 'tauri')}
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'autoupdate' && (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-950/40 border border-emerald-800/50 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>2 Methods for Auto-Updating Without Rebuilding .exe</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  You don't have to manually run <code className="bg-slate-950 px-1 py-0.5 rounded text-emerald-300 font-mono">npm run build:exe</code> every time you make a git commit. Pick either method below:
                </p>
              </div>

              {/* Method 1: Live Cloud Sync */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 flex items-center gap-1.5 text-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Method 1: Live Cloud Sync Mode (0 Rebuilds Needed)
                  </span>
                  <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-mono">
                    Instant Updates
                  </span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  When you deploy your web app (e.g. to Vercel, Cloud Run, or GitHub Pages), set the <code className="text-indigo-300 font-mono">PAIOS_REMOTE_URL</code> variable or set your live URL in <code className="text-indigo-300 font-mono">electron-main.cjs</code>.
                  Every time you <code className="text-emerald-300 font-mono">git push</code>, the desktop app will load the updated app instantly on launch or pressing <kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-200 rounded font-mono text-[10px]">Ctrl+Shift+R</kbd>!
                </p>
              </div>

              {/* Method 2: GitHub Actions CI/CD */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 flex items-center gap-1.5 text-xs">
                    <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                    Method 2: GitHub Actions CI/CD (Auto-Build .exe on Git Push)
                  </span>
                  <button
                    onClick={() => handleCopy(githubWorkflowYaml, 'github-workflow')}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md border border-slate-700 flex items-center gap-1 transition-colors text-[11px]"
                  >
                    {copiedScript === 'github-workflow' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy .yml Workflow
                      </>
                    )}
                  </button>
                </div>
                <p className="text-slate-400 text-[11px]">
                  We created <code className="text-cyan-300 font-mono">.github/workflows/build-exe.yml</code> in your repository.
                  When you push a commit to GitHub, GitHub Actions will automatically compile your Windows <code className="text-cyan-300 font-mono">PAIOS Desktop.exe</code> in the cloud and upload it as a downloadable release artifact!
                </p>
                <pre className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 font-mono text-[10px] text-cyan-200 overflow-x-auto max-h-36">
                  {githubWorkflowYaml}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'hotkeys' && (
            <div className="space-y-2">
              <h4 className="font-bold text-slate-200 mb-2">Built-In Desktop Keyboard Shortcuts</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-300">Command Search</span>
                  <kbd className="px-2 py-0.5 bg-slate-800 text-indigo-300 rounded font-mono text-[10px]">
                    Ctrl + K
                  </kbd>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-300">Quick New Task</span>
                  <kbd className="px-2 py-0.5 bg-slate-800 text-indigo-300 rounded font-mono text-[10px]">
                    Ctrl + N
                  </kbd>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-300">Quick Note Capture</span>
                  <kbd className="px-2 py-0.5 bg-slate-800 text-indigo-300 rounded font-mono text-[10px]">
                    Ctrl + Q
                  </kbd>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-300">Toggle Fullscreen</span>
                  <kbd className="px-2 py-0.5 bg-slate-800 text-indigo-300 rounded font-mono text-[10px]">
                    F11
                  </kbd>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex justify-between items-center">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Windows 11 Compatible &bull; x64 / ARM64</span>
          </div>
          <button
            onClick={onDismiss}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-colors shadow-lg shadow-indigo-600/20"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
