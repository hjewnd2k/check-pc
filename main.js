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
// Hàm chạy lệnh PowerShell và trả về kết quả
function runPS(command) {
  return new Promise((resolve) => {
    exec(`powershell -NoProfile -Command "${command}"`, { timeout: 10000 }, (err, stdout) => {
      resolve(err ? '' : stdout.trim());
    });


// IPC: Lấy thông tin Wifi (card mạng) qua PowerShell netsh
ipcMain.handle('get-network-info', async () => {
  try {
    const wifiCmd = `netsh wlan show interfaces 2>$null`;
    const wifiOutput = await runPS(wifiCmd);
    
    let wifiInfo = { connected: false, ssid: '', signal: '', adapter: '', mac: '' };
    if (wifiOutput && wifiOutput.includes('SSID')) {
      const ssidMatch = wifiOutput.match(/\bSSID\s*:\s*(.+)/);
      const signalMatch = wifiOutput.match(/Signal\s*:\s*(\d+%?)/);
      const macMatch = wifiOutput.match(/Physical address\s*:\s*([0-9a-fA-F:-]+)/);
      const adapterMatch = wifiOutput.match(/Name\s*:\s*(.+)/);
      wifiInfo = {
        connected: true,
        ssid: ssidMatch ? ssidMatch[1].trim() : 'N/A',
        signal: signalMatch ? signalMatch[1].trim() : 'N/A',
        mac: macMatch ? macMatch[1].trim() : 'N/A',
        adapter: adapterMatch ? adapterMatch[1].trim() : 'N/A'
      };
    }

    // Check Bluetooth adapter
    const btCmd = `Get-PnpDevice -Class Bluetooth 2>$null | Select-Object -First 5 | ForEach-Object { $_.FriendlyName + '|' + $_.Status }`;
    const btOutput = await runPS(btCmd);
    let btDevices = [];
    if (btOutput && btOutput.trim()) {
      btDevices = btOutput.split('\n').filter(l => l.trim()).map(line => {
        const parts = line.split('|');
        return { name: (parts[0] || '').trim(), status: (parts[1] || '').trim() };
      }).filter(d => d.name);
    }

    // Also get all network adapters
    const netCmd = `Get-NetAdapter 2>$null | Select-Object Name, MacAddress, Status, LinkSpeed | ForEach-Object { $_.Name + '|' + $_.MacAddress + '|' + $_.Status + '|' + $_.LinkSpeed }`;
    const netOutput = await runPS(netCmd);
    let netAdapters = [];
    if (netOutput && netOutput.trim()) {
      netAdapters = netOutput.split('\n').filter(l => l.trim()).map(line => {
        const parts = line.split('|');
        return { name: (parts[0]||'').trim(), mac: (parts[1]||'').trim(), status: (parts[2]||'').trim(), speed: (parts[3]||'').trim() };
      }).filter(a => a.name);
    }

    return { wifi: wifiInfo, bluetooth: btDevices, adapters: netAdapters };
  } catch(e) {
    return { wifi: {}, bluetooth: [], adapters: [] };
  }
});
