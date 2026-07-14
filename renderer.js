// Navigation logic
const navItems = document.querySelectorAll('.sidebar nav li');
const sections = document.querySelectorAll('.section');

navItems.forEach(item => {
  item.addEventListener('click', () => {
    // Xóa active hiện tại
    document.querySelector('.sidebar nav li.active').classList.remove('active');
    document.querySelector('.section.active').classList.remove('active');
    
    // Set active mới
    item.classList.add('active');
    const targetId = item.getAttribute('data-target');
    document.getElementById(targetId).classList.add('active');
  });
});

// Format bytes
function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function createRow(label, value, valueClass = '') {
  return `
    <div class="info-row">
      <span class="info-label">${label}:</span>
      <span class="info-value ${valueClass}">${value || 'N/A'}</span>
    </div>
  `;
}

// Lấy thông tin hệ thống
async function loadSystemInfo() {
  const spinner = document.getElementById('loading-spinner');
  const dashboard = document.getElementById('dashboard-grid');
  
  spinner.classList.remove('hidden');
  dashboard.classList.add('hidden');

  try {
    const info = await window.electronAPI.getSystemInfo();
    if (info.error) throw new Error(info.error);

    // 1. OS Info
    document.getElementById('os-info').innerHTML = 
      createRow('Nền tảng', info.os.platform) +
      createRow('Phiên bản', info.os.distro + ' ' + info.os.release) +
      createRow('Kiến trúc', info.os.arch) +
      createRow('Tên máy', info.os.hostname);

    // 2. Baseboard Info
    document.getElementById('mb-info').innerHTML = 
      createRow('Nhà sản xuất', info.baseboard.manufacturer) +
      createRow('Model', info.baseboard.model) +
      createRow('Phiên bản', info.baseboard.version);

    // 3. CPU Info
    let cpuHtml = createRow('CPU', `${info.cpu.manufacturer} ${info.cpu.brand}`) +
                  createRow('Tốc độ', `${info.cpu.speed} GHz`) +
                  createRow('Số nhân', `${info.cpu.physicalCores} nhân / ${info.cpu.cores} luồng`);
    if (info.cpu.temperature) {
       cpuHtml += createRow('Nhiệt độ CPU', `${info.cpu.temperature} °C`, info.cpu.temperature > 85 ? 'danger' : (info.cpu.temperature > 70 ? 'warning' : 'good'));
    }
    document.getElementById('cpu-info').innerHTML = cpuHtml;

    // 4. RAM Info
    let ramLayoutHtml = '';
    info.memory.layout.forEach((stick, i) => {
      if(stick.size > 0) {
        ramLayoutHtml += createRow(`Khe ${i+1}`, `${formatBytes(stick.size)} ${stick.type} ${stick.clockSpeed}MHz`);
      }
    });
    document.getElementById('ram-info').innerHTML = 
      createRow('Tổng RAM', formatBytes(info.memory.total)) +
      createRow('RAM Trống', formatBytes(info.memory.free)) +
      `<div style="margin-top: 10px; border-top: 1px solid var(--border); padding-top: 5px;">
        <strong>Chi tiết khe cắm:</strong>
      </div>` + ramLayoutHtml;

    // 5. GPU Info
    let gpuHtml = '';
    info.graphics.controllers.forEach((gpu, i) => {
      gpuHtml += createRow(`Card ${i+1}`, `${gpu.vendor} ${gpu.model}`);
      if (gpu.vram) gpuHtml += createRow(`VRAM`, `${gpu.vram} MB`);
      // Note: systeminformation does not reliably provide GPU temp.
    });
    info.graphics.displays.forEach((disp, i) => {
      gpuHtml += `<div style="margin-top: 10px; border-top: 1px solid var(--border); padding-top: 5px;"></div>` +
                 createRow(`Màn hình ${i+1}`, `${disp.resolutionX}x${disp.resolutionY} @${disp.refreshRate}Hz`);
    });
    document.getElementById('gpu-info').innerHTML = gpuHtml;

    // 6. Disk Info
    let diskHtml = '';
    info.disk.forEach((disk, i) => {
      // Kiểm tra xem là SSD hay HDD
      let typeClass = disk.type === 'SSD' || disk.type === 'NVMe' ? 'good' : 'warning';
      diskHtml += createRow(`Ổ ${i+1} (${disk.type})`, `${disk.name} (${formatBytes(disk.size)})`, typeClass);
    });
    document.getElementById('disk-info').innerHTML = diskHtml || '<p>Không lấy được thông tin ổ cứng.</p>';

    // 7. Battery Info
    if (info.battery.hasBattery) {
      let wearLevel = 0;
      if (info.battery.designedCapacity > 0) {
        wearLevel = 100 - (info.battery.maxCapacity / info.battery.designedCapacity * 100);
      }
      
      let wearClass = wearLevel < 10 ? 'good' : (wearLevel < 30 ? 'warning' : 'danger');

      document.getElementById('battery-info').innerHTML = 
        createRow('Tình trạng', info.battery.isCharging ? 'Đang sạc' : 'Dùng pin') +
        createRow('Dung lượng thiết kế', `${info.battery.designedCapacity} mWh`) +
        createRow('Dung lượng tối đa', `${info.battery.maxCapacity} mWh`) +
        createRow('Độ chai pin', `${wearLevel.toFixed(1)}%`, wearClass) +
        (info.battery.cycleCount ? createRow('Số lần sạc', info.battery.cycleCount) : '');
    } else {
      document.getElementById('battery-info').innerHTML = '<p style="color: var(--text-secondary)">Máy tính này không có pin (Desktop) hoặc không hỗ trợ đọc thông tin pin.</p>';
    }

  } catch (err) {
    console.error(err);
    alert('Có lỗi khi lấy thông tin hệ thống: ' + err.message);
  } finally {
    spinner.classList.add('hidden');
    dashboard.classList.remove('hidden');
  }
}

document.getElementById('refresh-btn').addEventListener('click', loadSystemInfo);

// Load info on start
loadSystemInfo();

// ==========================================
// Mouse & Touchpad Test Logic
// ==========================================
const btnLeft = document.getElementById('btn-left');
const btnRight = document.getElementById('btn-right');
const btnMiddle = document.getElementById('btn-middle');
const scrollIndicator = document.getElementById('scroll-indicator');
const touchpadCanvas = document.getElementById('touchpad-canvas');

window.addEventListener('mousedown', (e) => {
  if (!document.getElementById('mouse-test').classList.contains('active')) return;
  if (e.button === 0) btnLeft.classList.add('active');
  if (e.button === 1) {
     e.preventDefault();
     btnMiddle.classList.add('active');
  }
  if (e.button === 2) btnRight.classList.add('active');
});

window.addEventListener('mouseup', (e) => {
  if (e.button === 0) btnLeft.classList.remove('active');
  if (e.button === 1) btnMiddle.classList.remove('active');
  if (e.button === 2) btnRight.classList.remove('active');
});

// Chặn menu chuột phải trong app nếu đang test chuột
window.addEventListener('contextmenu', (e) => {
  if (document.getElementById('mouse-test').classList.contains('active')) {
    e.preventDefault();
  }
});

window.addEventListener('wheel', (e) => {
  if (!document.getElementById('mouse-test').classList.contains('active')) return;
  scrollIndicator.classList.add('active');
  clearTimeout(scrollIndicator.timeout);
  scrollIndicator.timeout = setTimeout(() => {
    scrollIndicator.classList.remove('active');
  }, 150);
});

touchpadCanvas.addEventListener('mousemove', (e) => {
  if (!document.getElementById('mouse-test').classList.contains('active')) return;
  const rect = touchpadCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  const dot = document.createElement('div');
  dot.className = 'trail-dot';
  dot.style.left = x + 'px';
  dot.style.top = y + 'px';
  touchpadCanvas.appendChild(dot);
  
  setTimeout(() => {
    if (dot.parentNode) dot.parentNode.removeChild(dot);
  }, 500);
});

// ==========================================
// Keyboard Test Logic
// ==========================================
// Dùng đúng mã e.code mà browser/Electron phát ra
const keyboardLayout = [
  // Hàng function
  ['Escape','F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12'],
  // Hàng số
  ['Backquote','Digit1','Digit2','Digit3','Digit4','Digit5','Digit6','Digit7','Digit8','Digit9','Digit0','Minus','Equal','Backspace'],
  // Hàng QWERTY
  ['Tab','KeyQ','KeyW','KeyE','KeyR','KeyT','KeyY','KeyU','KeyI','KeyO','KeyP','BracketLeft','BracketRight','Backslash'],
  // Hàng giữa
  ['CapsLock','KeyA','KeyS','KeyD','KeyF','KeyG','KeyH','KeyJ','KeyK','KeyL','Semicolon','Quote','Enter'],
  // Hàng Shift
  ['ShiftLeft','KeyZ','KeyX','KeyC','KeyV','KeyB','KeyN','KeyM','Comma','Period','Slash','ShiftRight'],
  // Hàng dưới
  ['ControlLeft','MetaLeft','AltLeft','Space','AltRight','ControlRight']
];

const keyDisplayNames = {
  'Escape':'ESC', 'Backspace':'Back←', 'ShiftLeft':'Shift', 'ShiftRight':'Shift',
  'ControlLeft':'Ctrl', 'ControlRight':'Ctrl', 'AltLeft':'Alt', 'AltRight':'Alt',
  'MetaLeft':'Win', 'CapsLock':'Caps Lock', 'Tab':'Tab', 'Enter':'Enter ⏎',
  'Backquote':'`', 'Minus':'-', 'Equal':'=', 'BracketLeft':'[', 'BracketRight':']',
  'Backslash':'\\', 'Semicolon':';', 'Quote':"'", 'Comma':',', 'Period':'.', 'Slash':'/',
  'Space':'Space Bar',
  'Digit1':'1','Digit2':'2','Digit3':'3','Digit4':'4','Digit5':'5',
  'Digit6':'6','Digit7':'7','Digit8':'8','Digit9':'9','Digit0':'0',
  'KeyA':'A','KeyB':'B','KeyC':'C','KeyD':'D','KeyE':'E','KeyF':'F','KeyG':'G',
  'KeyH':'H','KeyI':'I','KeyJ':'J','KeyK':'K','KeyL':'L','KeyM':'M','KeyN':'N',
  'KeyO':'O','KeyP':'P','KeyQ':'Q','KeyR':'R','KeyS':'S','KeyT':'T','KeyU':'U',
  'KeyV':'V','KeyW':'W','KeyX':'X','KeyY':'Y','KeyZ':'Z'
};

const wideKeys = ['Backspace','CapsLock','Enter','ShiftLeft','ShiftRight','Tab'];

const vkContainer = document.getElementById('virtual-keyboard');
const keyElements = {};

keyboardLayout.forEach(row => {
  const rowDiv = document.createElement('div');
  rowDiv.className = 'kb-row';
  row.forEach(code => {
    const keyDiv = document.createElement('div');
    keyDiv.className = 'key';
    if (wideKeys.includes(code)) keyDiv.classList.add('wide');
    if (code === 'CapsLock') keyDiv.classList.add('extra-wide');
    if (code === 'Space') keyDiv.classList.add('spacebar');
    keyDiv.innerText = keyDisplayNames[code] || code;
    keyDiv.id = `key-${code}`;
    keyElements[code] = keyDiv;
    rowDiv.appendChild(keyDiv);
  });
  vkContainer.appendChild(rowDiv);
});

// Lắng nghe sự kiện phím - chỉ active khi đang ở tab keyboard-test
window.addEventListener('keydown', (e) => {
  const kbSection = document.getElementById('keyboard-test');
  if (kbSection.classList.contains('active') && e.code !== 'F12') {
    e.preventDefault();
  }
  const keyEl = keyElements[e.code];
  if (keyEl) {
    keyEl.classList.add('pressed');
    keyEl.classList.add('tested');
  }
});

window.addEventListener('keyup', (e) => {
  const keyEl = keyElements[e.code];
  if (keyEl) keyEl.classList.remove('pressed');
});

document.getElementById('reset-kb-btn').addEventListener('click', () => {
  document.querySelectorAll('.key.tested').forEach(el => el.classList.remove('tested'));
});



// ==========================================
// Screen Test Logic
// ==========================================
const screenTestBtn = document.getElementById('start-screen-test-btn');
const overlay = document.getElementById('fullscreen-overlay');
const testColors = ['#ff0000', '#00ff00', '#0000ff', '#ffffff', '#000000'];
let currentColorIndex = 0;
let isTestingScreen = false;

screenTestBtn.addEventListener('click', () => {
  isTestingScreen = true;
  currentColorIndex = 0;
  overlay.style.backgroundColor = testColors[currentColorIndex];
  overlay.classList.remove('hidden');
  // Request full screen using standard web API
  if(document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen();
  }
});

function nextColor() {
  currentColorIndex++;
  if (currentColorIndex >= testColors.length) {
    stopScreenTest();
  } else {
    overlay.style.backgroundColor = testColors[currentColorIndex];
  }
}

function stopScreenTest() {
  isTestingScreen = false;
  overlay.classList.add('hidden');
  if(document.fullscreenElement) {
    document.exitFullscreen();
  }
}

overlay.addEventListener('click', () => {
  if (isTestingScreen) nextColor();
});

window.addEventListener('keydown', (e) => {
  if (isTestingScreen) {
    if (e.key === 'Escape') {
      stopScreenTest();
    } else {
      nextColor();
    }
  }
});

// ==========================================
// Media Test Logic
// ==========================================
let stream = null;
const startCameraBtn = document.getElementById('start-camera-btn');
const videoElement = document.getElementById('camera-preview');

startCameraBtn.addEventListener('click', async () => {
  if (stream) {
    // Stop camera
    stream.getTracks().forEach(track => track.stop());
    videoElement.srcObject = null;
    startCameraBtn.innerText = 'Bật Camera';
    stream = null;
  } else {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoElement.srcObject = stream;
      startCameraBtn.innerText = 'Tắt Camera';
    } catch (err) {
      alert('Lỗi truy cập Camera: ' + err.message);
    }
  }
});

let audioContext, analyser, microphone, javascriptNode;
let isMicOn = false;
const startMicBtn = document.getElementById('start-mic-btn');
const micLevel = document.getElementById('mic-level');
let micStream = null;

startMicBtn.addEventListener('click', async () => {
  if (isMicOn) {
    if (micStream) micStream.getTracks().forEach(t => t.stop());
    if (audioContext) audioContext.close();
    isMicOn = false;
    startMicBtn.innerText = 'Bật Mic';
    micLevel.style.height = '0%';
  } else {
    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContext = new AudioContext();
      analyser = audioContext.createAnalyser();
      microphone = audioContext.createMediaStreamSource(micStream);
      javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);

      analyser.smoothingTimeConstant = 0.8;
      analyser.fftSize = 1024;

      microphone.connect(analyser);
      analyser.connect(javascriptNode);
      javascriptNode.connect(audioContext.destination);

      javascriptNode.onaudioprocess = function() {
          var array = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(array);
          var values = 0;
          var length = array.length;
          for (var i = 0; i < length; i++) {
            values += (array[i]);
          }
          var average = values / length;
          // Set visualizer height (0 to 100)
          let percent = Math.min(100, Math.max(0, average * 1.5));
          micLevel.style.height = percent + '%';
      }

      isMicOn = true;
      startMicBtn.innerText = 'Tắt Mic';
    } catch (err) {
      alert('Lỗi truy cập Microphone: ' + err.message);
    }
  }
});

const playSoundBtn = document.getElementById('play-sound-btn');
playSoundBtn.addEventListener('click', () => {
   const context = new AudioContext();
   const oscillator = context.createOscillator();
   const gainNode = context.createGain();
   
   oscillator.connect(gainNode);
   gainNode.connect(context.destination);
   
   oscillator.type = 'sine';
   oscillator.frequency.value = 440; // A4
   gainNode.gain.setValueAtTime(0, context.currentTime);
   gainNode.gain.linearRampToValueAtTime(1, context.currentTime + 0.1);
   gainNode.gain.linearRampToValueAtTime(0, context.currentTime + 1);
   
   oscillator.start(context.currentTime);
   oscillator.stop(context.currentTime + 1);
});
