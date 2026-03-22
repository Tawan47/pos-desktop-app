// electron/preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // ฟังก์ชันสำหรับส่งคำสั่งปริ้นท์ (ใช้ send)
  printComponent: (htmlContent) => ipcRenderer.send('print-component', htmlContent),

  // ฟังก์ชันสำหรับปริ้นท์ใบเสร็จโดยเฉพาะ (รับข้อมูลการขาย)
  printReceipt: (saleData) => ipcRenderer.send('print-receipt', saleData),

  // ฟังก์ชันสำหรับรับข้อมูลโลโก้
  receive: (channel, func) => {
    const validChannels = ['logo-data']; 
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
  
  // ฟังก์ชันสำหรับร้องขอข้อมูลโลโก้
  getLogoData: () => ipcRenderer.invoke('get-logo-data'),
});
