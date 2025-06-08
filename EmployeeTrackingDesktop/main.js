const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const { ipcMain, desktopCapturer, powerMonitor } = electron
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
      sandbox: false
    }
  })

  // Enable all permissions for media capture
  mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    callback(true);
  });

  mainWindow.webContents.session.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) => {
    return true;
  });

  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, '/gui/gui.html'),
    protocol: 'file:',
    slashes: true
  }))

  // Setup IPC handlers
  setupIPC();

  mainWindow.on('closed', function () {
    mainWindow = null
  })
}

function setupIPC() {
  // Handle screen capture requests
  ipcMain.handle('capture-screen', async () => {
    try {
      console.log('Main process: Getting desktop sources...');
      const sources = await desktopCapturer.getSources({ 
        types: ['window', 'screen'],
        thumbnailSize: { width: 800, height: 600 }
      });
      
      console.log(`Main process: Found ${sources.length} sources`);
      
      // Find the main screen
      for (const source of sources) {
        if (
          source.name === 'Entire screen' ||
          source.name === 'Screen 1' ||
          source.name === 'Screen 2'
        ) {
          console.log(`Main process: Using source - ${source.name}`);
          return {
            success: true,
            sourceId: source.id,
            sourceName: source.name
          };
        }
      }
      
      // If no main screen found, use the first available source
      if (sources.length > 0) {
        console.log(`Main process: Using first available source - ${sources[0].name}`);
        return {
          success: true,
          sourceId: sources[0].id,
          sourceName: sources[0].name
        };
      }
      
      return {
        success: false,
        error: 'No screen sources found'
      };
    } catch (error) {
      console.error('Main process: Error getting desktop sources:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });

  // Handle power monitoring events
  setupPowerMonitoring();
}

function setupPowerMonitoring() {
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