// main.cjs
const { app, BrowserWindow, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
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
        // --- Development Mode (NestJS & Next.js) ---
        console.log('Running in Development mode (NestJS/Next.js).');
        nodePath = process.execPath;
        // Point to the built NestJS main file (if start via node) or use npm run
        backendPath = path.join(__dirname, 'backend-nest', 'dist', 'main.js');
        serverWorkingDirectory = path.join(__dirname, 'backend-nest');
        spawnOptions = {
            cwd: serverWorkingDirectory,
            stdio: 'inherit'
        };
    } else {
        // --- Production Mode ---
        console.log('Running in Production mode.');
        nodePath = path.join(process.resourcesPath, 'resources', 'node.exe');
        backendPath = path.join(process.resourcesPath, 'backend-nest', 'dist', 'main.js');
        serverWorkingDirectory = path.join(process.resourcesPath, 'backend-nest');
        spawnOptions = {
            cwd: serverWorkingDirectory,
            stdio: 'ignore',
            detached: true 
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
        // --- <<< จุดแก้ไขหลัก >>> ---
        const userDataPath = app.getPath('userData'); // 1. ดึงตำแหน่ง AppData
        // 2. เพิ่ม userDataPath เป็นอาร์กิวเมนต์ตอนเรียก spawn
        serverProcess = spawn(nodePath, [backendPath, userDataPath], spawnOptions);

        if (!isDev) {
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

    if (process.env.VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    } else if (app.isPackaged) {
        // In production, we might use a static export or its own server
        // For now, assume it's loading a local server or a built dist
        mainWindow.loadURL('http://localhost:3000'); 
    } else {
        // In dev, Next.js usually runs on 3000
        mainWindow.loadURL('http://localhost:3000');
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

// รับคำสั่งปริ้นท์ใบเสร็จ (ใหม่)
ipcMain.on('print-receipt', (event, saleData) => {
    console.log('--- Received print-receipt command ---');
    
    // สร้าง HTML สำหรับใบเสร็จ (ตัวอย่างเบื้องต้น)
    const itemsHtml = saleData.items.map(item => `
        <tr>
            <td>${item.name}</td>
            <td style="text-align: right;">${item.qty} x ${item.price}</td>
            <td style="text-align: right;">${(item.qty * item.price).toFixed(2)}</td>
        </tr>
    `).join('');

    const receiptHtml = `
        <html>
        <head>
            <style>
                body { font-family: sans-serif; font-size: 12px; width: 300px; padding: 10px; }
                table { width: 100%; border-collapse: collapse; }
                .text-center { text-align: center; }
                .text-right { text-align: right; }
                .divider { border-top: 1px dashed #000; margin: 10px 0; }
            </style>
        </head>
        <body>
            <h2 class="text-center">ใบเสร็จรับเงิน</h2>
            <div class="text-center">เลขที่: ${saleData.invoiceNumber}</div>
            <div class="text-center">วันที่: ${new Date(saleData.date).toLocaleString()}</div>
            <div class="divider"></div>
            <table>
                <thead>
                    <tr>
                        <th style="text-align: left;">รายการ</th>
                        <th style="text-align: right;">จำนวน</th>
                        <th style="text-align: right;">รวม</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>
            <div class="divider"></div>
            <div class="text-right"><strong>ยอดรวม: ${saleData.total.toFixed(2)}</strong></div>
            <div class="text-right">วิธีชำระ: ${saleData.paymentMethod}</div>
            <div class="divider"></div>
            <div class="text-center">ขอบคุณที่ใช้บริการ</div>
        </body>
        </html>
    `;

    const printWindow = new BrowserWindow({
        width: 400,
        height: 600,
        show: false,
        parent: mainWindow,
    });

    printWindow.setMenu(null);
    printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(receiptHtml)}`);
    
    printWindow.webContents.once('did-finish-load', () => {
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

// รับคำสั่งปริ้นท์จากหน้าแอป (แบบเก่า)
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
    autoUpdater.checkForUpdatesAndNotify();
});

app.on('window-all-closed', () => {
    if (serverProcess) serverProcess.kill();
    if (process.platform !== 'darwin') app.quit();
});