const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const { ipcMain, powerMonitor, desktopCapturer } = electron
const path = require('path')
const url = require('url')

let mainWindow

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
      enableRemoteModule: true,
      sandbox: false
    }
  })

  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, '/gui/gui.html'),
    protocol: 'file:',
    slashes: true
  }))

  // Setup power monitoring
  setupPowerMonitoring();
  
  // Setup screen capture IPC
  setupScreenCaptureIPC();

  // Handle permissions
  mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'media') {
      callback(true);
    } else {
      callback(false);
    }
  });

  mainWindow.on('closed', function () {
    mainWindow = null
  })
}

function setupScreenCaptureIPC() {
  // Handle screen capture requests from renderer
  ipcMain.handle('get-desktop-sources', async () => {
    try {
      const sources = await desktopCapturer.getSources({ 
        types: ['window', 'screen'] 
      });
      return sources;
    } catch (error) {
      console.error('Error getting desktop sources:', error);
      return [];
    }
  });
}

function setupPowerMonitoring() {
  // Forward power events to renderer process
  powerMonitor.on('suspend', () => {
    if (mainWindow) {
      mainWindow.webContents.send('power-event', {
        type: 'suspend',
        status: '0',
        timestamp: new Date().toISOString()
      });
    }
  });

  powerMonitor.on('resume', () => {
    if (mainWindow) {
      mainWindow.webContents.send('power-event', {
        type: 'resume',
        status: '1',
        timestamp: new Date().toISOString()
      });
    }
  });

  powerMonitor.on('on-ac', () => {
    if (mainWindow) {
      mainWindow.webContents.send('power-event', {
        type: 'on-ac',
        status: '2',
        timestamp: new Date().toISOString()
      });
    }
  });

  powerMonitor.on('on-battery', () => {
    if (mainWindow) {
      mainWindow.webContents.send('power-event', {
        type: 'on-battery',
        status: '3',
        timestamp: new Date().toISOString()
      });
    }
  });

  powerMonitor.on('shutdown', () => {
    if (mainWindow) {
      mainWindow.webContents.send('power-event', {
        type: 'shutdown',
        status: '4',
        timestamp: new Date().toISOString()
      });
    }
  });

  powerMonitor.on('lock-screen', () => {
    if (mainWindow) {
      mainWindow.webContents.send('power-event', {
        type: 'lock-screen',
        status: '5',
        timestamp: new Date().toISOString()
      });
    }
  });

  powerMonitor.on('unlock-screen', () => {
    if (mainWindow) {
      mainWindow.webContents.send('power-event', {
        type: 'unlock-screen',
        status: '6',
        timestamp: new Date().toISOString()
      });
    }
  });
}

app.on('ready', createWindow)

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow()
  }
})