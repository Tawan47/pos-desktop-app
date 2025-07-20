// main.cjs
const { app, BrowserWindow, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater'); // 1. เพิ่มการ require
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let serverProcess;
let mainWindow;

if (process.env.NODE_ENV === 'production') {
  app.setPath('userData', path.join(app.getPath('appData'), 'my-vite-app'));
}

function startBackend() {
    const isDev = !app.isPackaged;
    let backendPath;
    let nodePath;
    let serverWorkingDirectory;
    let spawnOptions;

    if (isDev) {
        // --- โหมด Development ---
        console.log('Running in Development mode.');
        nodePath = process.execPath;
        backendPath = path.join(__dirname, 'backend', 'server.js');
        serverWorkingDirectory = path.join(__dirname, 'backend');
        spawnOptions = {
            cwd: serverWorkingDirectory,
            stdio: 'inherit'
        };
    } else {
        // --- โหมด Production (หลัง Build เป็น EXE) ---
        console.log('Running in Production mode with detached process.');
        nodePath = path.join(process.resourcesPath, 'resources', 'node.exe');
        backendPath = path.join(process.resourcesPath, 'backend', 'server.js');
        serverWorkingDirectory = path.join(process.resourcesPath, 'backend');
        spawnOptions = {
            cwd: serverWorkingDirectory,
            stdio: 'ignore',  // ไม่ต้องเชื่อมต่อ stdio
            detached: true    // รัน process แยกออกไปเลย
        };
    }

    console.log(`Node path: ${nodePath}`);
    console.log(`Backend script path: ${backendPath}`);
    console.log(`Working directory: ${serverWorkingDirectory}`);

    if (!fs.existsSync(nodePath) || !fs.existsSync(backendPath)) {
        console.error('Fatal Error: Node.js or backend script not found.');
        app.quit();
        return;
    }

    try {
        serverProcess = spawn(nodePath, [backendPath], spawnOptions);

        if (!isDev) {
            // สั่งให้โปรแกรมหลักไม่ต้องรอ process ลูก
            serverProcess.unref();
        }

        serverProcess.on('error', (err) => {
            console.error('Failed to start backend process:', err);
        });

    } catch (error) {
        console.error('Error spawning backend process:', error);
    }
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1024,
        height: 768,
        webPreferences: {
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    // ตรวจสอบว่ากำลังรันในโหมดพัฒนา (มี VITE_DEV_SERVER_URL) หรือไม่
    if (process.env.VITE_DEV_SERVER_URL) {
        // โหมดพัฒนา: โหลด URL จาก Vite Dev Server
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    } else {
        // โหมดใช้งานจริง: โหลดไฟล์ index.html โดยตรง
        mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
    }
}

// รับคำร้องขอข้อมูลโลโก้จากหน้าแอป
ipcMain.handle('get-logo-data', async () => {
    const logoPath = path.join(__dirname, 'shop-logo.png');
    try {
        const logoFile = fs.readFileSync(logoPath);
        return `data:image/png;base64,${logoFile.toString('base64')}`;
    } catch (error) {
        console.error('Could not read shop-logo.png:', error);
        return null;
    }
});

// รับคำสั่งปริ้นท์จากหน้าแอป
ipcMain.on('print-component', (event, htmlContent) => {
    console.log('--- Received print command (new window method) ---');
    
    const printWindow = new BrowserWindow({
        width: 400,
        height: 600,
        show: false,
        parent: mainWindow,
    });

    printWindow.setMenu(null);
    
    printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
    
    printWindow.webContents.once('did-finish-load', () => {
        printWindow.show();
        
        printWindow.webContents.print({ silent: false }, (success, failureReason) => {
            if (!success && failureReason !== 'cancelled') {
                console.error(`Printing failed: ${failureReason}`);
            }
            if (!printWindow.isDestroyed()) {
                printWindow.close();
            }
        });
    });
});


app.whenReady().then(() => {
    startBackend();
    createWindow();
    // 2. เรียกใช้ autoUpdater เพื่อเช็คอัปเดต
    autoUpdater.checkForUpdatesAndNotify();
});

app.on('window-all-closed', () => {
    if (serverProcess) serverProcess.kill();
    if (process.platform !== 'darwin') app.quit();
});