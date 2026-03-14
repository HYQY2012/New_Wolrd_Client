const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');

let mainWindow;

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';

app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors,AutoplayPolicy,MediaControls,WebUI');
app.commandLine.appendSwitch('disable-site-isolation-trials');
app.commandLine.appendSwitch('allow-insecure-localhost');
app.commandLine.appendSwitch('ignore-certificate-errors');
app.commandLine.appendSwitch('disable-pinch');
app.commandLine.appendSwitch('overscroll-history-navigation', 'disable');

const createWindow = () => {
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                'Access-Control-Allow-Origin': ['*'],
                'Access-Control-Allow-Methods': ['GET, POST, PUT, DELETE, OPTIONS'],
                'Access-Control-Allow-Headers': ['*'],
                'X-Frame-Options': ['ALLOWALL']
            }
        });
    });

    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        frame: false,
        titleBarStyle: 'hidden',
        backgroundColor: '#f8f9fa',
        resizable: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false,
            allowRunningInsecureContent: true,
            allowPopups: false,
            sandbox: false,
            disableBlinkFeatures: 'BlockCredentialedSubresources,OutOfBlinkCors,AutoplayPolicy,MediaControls',
            webviewTag: true,
            spellcheck: false,
            disableDialogs: true
        }
    });

    mainWindow.setMenu(null);
    mainWindow.webContents.setZoomFactor(1.0);
    mainWindow.webContents.setVisualZoomLevelLimits(1, 1);
    mainWindow.webContents.on('new-window', (e) => e.preventDefault());
    mainWindow.webContents.on('select-bluetooth-device', (e) => e.preventDefault());
    mainWindow.webContents.on('context-menu', (e) => e.preventDefault());

    mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
        callback(false);
    });

    mainWindow.webContents.session.setCertificateVerifyProc((request, callback) => {
        callback(0);
    });

    mainWindow.on('maximize', () => {
        mainWindow.webContents.send('window-maximized', true);
    });

    mainWindow.on('unmaximize', () => {
        mainWindow.webContents.send('window-maximized', false);
    });

    mainWindow.loadFile('index.html');

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
};

ipcMain.on('window-minimize', () => {
    mainWindow.minimize();
});

ipcMain.on('window-maximize', () => {
    if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
    } else {
        mainWindow.maximize();
    }
});

ipcMain.on('window-close', () => {
    mainWindow.close();
});

app.whenReady().then(() => {
    createWindow();
});

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

app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
    event.preventDefault();
    callback(true);
});