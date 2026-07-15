const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const si = require('systeminformation');
const { exec } = require('child_process');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1000,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    // Khung cửa sổ tuỳ chỉnh (nếu muốn làm app không viền)
    // autoHideMenuBar: true, 
  });

  win.setMenuBarVisibility(false);
  win.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers: Nhận yêu cầu từ UI và trả về dữ liệu phần cứng
ipcMain.handle('get-system-info', async () => {
  try {
    const [osInfo, cpu, cpuTemp, mem, memLayout, graphics, diskLayout, battery, baseboard, wifi, bluetooth] = await Promise.all([
      si.osInfo(),
      si.cpu(),
      si.cpuTemperature(),
      si.mem(),
      si.memLayout(),
      si.graphics(),
      si.diskLayout(),
      si.battery(),
      si.baseboard(),
      si.wifiInterfaces().catch(() => []),
      si.bluetoothDevices().catch(() => [])
    ]);

    return {
      os: {
        platform: osInfo.platform,
        distro: osInfo.distro,
        release: osInfo.release,
        arch: osInfo.arch,
        hostname: osInfo.hostname
      },
      baseboard: {
        manufacturer: baseboard.manufacturer,
        model: baseboard.model,
        version: baseboard.version
      },
      cpu: {
        manufacturer: cpu.manufacturer,
        brand: cpu.brand,
        speed: cpu.speed,
        cores: cpu.cores,
        physicalCores: cpu.physicalCores,
        temperature: cpuTemp.main || cpuTemp.max || null
      },
      memory: {
        total: mem.total,
        free: mem.free,
        layout: memLayout.map(m => ({
          size: m.size,
          type: m.type,
          clockSpeed: m.clockSpeed,
          manufacturer: m.manufacturer
        }))
      },
      graphics: {
        controllers: graphics.controllers.map(g => ({
          vendor: g.vendor,
          model: g.model,
          vram: g.vram
        })),
        displays: graphics.displays.map(d => ({
          vendor: d.vendor,
          model: d.model,
          resolutionX: d.resolutionX,
          resolutionY: d.resolutionY,
          refreshRate: d.currentRefreshRate
        }))
      },
      disk: diskLayout.map(d => ({
        device: d.device,
        type: d.type,
        name: d.name,
        vendor: d.vendor,
        size: d.size
      })),
      battery: {
        hasBattery: battery.hasBattery,
        designedCapacity: battery.designedCapacity,
        maxCapacity: battery.maxCapacity,
        currentCapacity: battery.currentCapacity,
        isCharging: battery.isCharging,
        percent: battery.percent,
        cycleCount: battery.cycleCount
      },
      wifi: wifi,
      bluetooth: bluetooth
    };
  } catch (error) {
    console.error("Error getting system info:", error);
    return { error: error.message };
  }
});
