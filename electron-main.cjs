const { app, BrowserWindow, globalShortcut } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'PAIOS Desktop - Personal AI Operating System',
    frame: true,
    titleBarStyle: 'default',
    autoHideMenuBar: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
    },
  });

  // Serve compiled index.html in dist or local server
  const distIndex = path.join(__dirname, 'dist', 'index.html');
  
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadFile(distIndex).catch(() => {
      mainWindow.loadURL('http://localhost:3000');
    });
  }

  // Register Global Shortcuts (Ctrl+Shift+P for Quick PAIOS)
  globalShortcut.register('CommandOrControl+Shift+P', () => {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
