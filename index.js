import { widgetWindow, addon, app } from "novadesk";
import * as system from "system";

const BASE_WIDTH = 500;
const BASE_HEIGHT = 290;

// Unique, namespaced storage keys to prevent collisions with other widgets
const STORAGE_KEYS = {
  SCALE: "AClock.scale",
  IS_24_HOUR: "AClock.is24Hour",
  BLUR_TYPE: "AClock.blurType",
  CORNER_TYPE: "AClock.cornerType"
};

let clockWindow = null;
let clockTimer = null;
let blurBehind = null;

// Settings with defaults
let currentScale = 1.0;
let is24Hour = true;
let currentBlurType = "acrylic";       // "acrylic" | "blurbehind" | "none"
let currentCornerType = "roundsmall";   // "roundsmall" | "round" | "none"

// Load persisted settings from app.storage using unique keys & clean up any legacy collision keys
try {
  if (app && app.storage && typeof app.storage.get === "function") {
    // Read only from unique namespaced keys
    const storedScale = app.storage.get(STORAGE_KEYS.SCALE);
    if (typeof storedScale === "number" && storedScale > 0) {
      currentScale = storedScale;
    }

    const storedIs24Hour = app.storage.get(STORAGE_KEYS.IS_24_HOUR);
    if (typeof storedIs24Hour === "boolean") {
      is24Hour = storedIs24Hour;
    }

    const storedBlur = app.storage.get(STORAGE_KEYS.BLUR_TYPE);
    if (typeof storedBlur === "string" && ["acrylic", "blurbehind", "none"].includes(storedBlur)) {
      currentBlurType = storedBlur;
    }

    const storedCorner = app.storage.get(STORAGE_KEYS.CORNER_TYPE);
    if (typeof storedCorner === "string" && ["roundsmall", "round", "none"].includes(storedCorner)) {
      currentCornerType = storedCorner;
    }

    // Safely purge legacy un-prefixed keys so they never collide with other widgets
    if (typeof app.storage.remove === "function") {
      app.storage.remove("scale");
      app.storage.remove("cornerType");
      app.storage.remove("blurType");
      app.storage.remove("is24Hour");
    }
  }
} catch (e) {
  console.log("Error accessing app.storage:", e);
}

// Attempt to load BlurBehind addon
try {
  if (typeof __addonsPath !== "undefined") {
    blurBehind = addon.load(path.join(__addonsPath, "BlurBehind"));
  }
} catch (e) {
  console.log("Could not load BlurBehind addon:", e);
}

function getFormattedData() {
  const now = new Date();

  const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const DAYS = [
    "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"
  ];

  const rawHours = now.getHours();
  const rawMinutes = now.getMinutes();
  const rawSeconds = now.getSeconds();

  let displayHour = rawHours;
  if (!is24Hour) {
    displayHour = rawHours % 12;
    if (displayHour === 0) displayHour = 12;
  }

  const hourStr = String(displayHour).padStart(2, "0");
  const minStr = String(rawMinutes).padStart(2, "0");
  const secStr = String(rawSeconds).padStart(2, "0");

  const monthName = MONTHS[now.getMonth()];
  const dayDate = String(now.getDate()).padStart(2, "0");
  const year = now.getFullYear();
  const dateStr = `${monthName} ${dayDate}, ${year}`;
  const dayStr = DAYS[now.getDay()];

  const period = rawHours >= 12 ? "PM" : "AM";
  const formatStr = is24Hour ? "24H" : "12H";

  return {
    hour: hourStr,
    minute: minStr,
    second: rawSeconds,
    secondStr: secStr,
    dateStr: dateStr,
    dayStr: dayStr,
    formatStr: formatStr,
    period: period,
    is24Hour: is24Hour,
    scale: currentScale,
    cornerType: currentCornerType,
    blurType: currentBlurType
  };
}

function publishClockData() {
  if (!clockWindow) return;
  const data = getFormattedData();
  ipcMain.send("clockUpdate", data);
}

function applyWindowBlur(win) {
  if (!win) return;
  if (blurBehind && typeof blurBehind.apply === "function") {
    try {
      const hwnd = String(win.getHandle());
      blurBehind.apply(hwnd, currentBlurType, currentCornerType);
    } catch (e) {
      console.log("Error applying blurBehind:", e);
    }
  }
}

function toggleTimeFormat() {
  is24Hour = !is24Hour;
  try {
    if (app && app.storage && typeof app.storage.set === "function") {
      app.storage.set(STORAGE_KEYS.IS_24_HOUR, is24Hour);
    }
  } catch (e) {
    console.log("Error saving is24Hour to app.storage:", e);
  }

  if (clockWindow) {
    clockWindow.setContextMenu(buildContextMenu(clockWindow));
  }
  publishClockData();
}

function setScale(newScale) {
  currentScale = newScale;

  try {
    if (app && app.storage && typeof app.storage.set === "function") {
      app.storage.set(STORAGE_KEYS.SCALE, currentScale);
    }
  } catch (e) {
    console.log("Error saving scale to app.storage:", e);
  }

  const scaledW = Math.round(BASE_WIDTH * currentScale);
  const scaledH = Math.round(BASE_HEIGHT * currentScale);

  if (clockWindow) {
    clockWindow.setSize(scaledW, scaledH);
    applyWindowBlur(clockWindow);
    clockWindow.setContextMenu(buildContextMenu(clockWindow));
  }

  ipcMain.send("scaleUpdate", currentScale);
  publishClockData();
}

function setBlurType(newBlur) {
  currentBlurType = newBlur;

  try {
    if (app && app.storage && typeof app.storage.set === "function") {
      app.storage.set(STORAGE_KEYS.BLUR_TYPE, currentBlurType);
    }
  } catch (e) {
    console.log("Error saving blurType to app.storage:", e);
  }

  applyWindowBlur(clockWindow);
  if (clockWindow) {
    clockWindow.setContextMenu(buildContextMenu(clockWindow));
  }
  ipcMain.send("blurUpdate", currentBlurType);
  publishClockData();
}

function setCornerType(newCorner) {
  currentCornerType = newCorner;

  try {
    if (app && app.storage && typeof app.storage.set === "function") {
      app.storage.set(STORAGE_KEYS.CORNER_TYPE, currentCornerType);
    }
  } catch (e) {
    console.log("Error saving cornerType to app.storage:", e);
  }

  applyWindowBlur(clockWindow);
  if (clockWindow) {
    clockWindow.setContextMenu(buildContextMenu(clockWindow));
  }
  ipcMain.send("cornerUpdate", currentCornerType);
  publishClockData();
}

function buildContextMenu(win) {
  const scaleOptions = [
    { label: "75%", value: 0.75 },
    { label: "100% (Default)", value: 1.0 },
    { label: "125%", value: 1.25 },
    { label: "150%", value: 1.5 },
    { label: "175%", value: 1.75 },
    { label: "200%", value: 2.0 }
  ];

  const blurOptions = [
    { label: "Acrylic", value: "acrylic" },
    { label: "Blur", value: "blurbehind" },
    { label: "None", value: "none" }
  ];

  const cornerOptions = [
    { label: "Round Small", value: "roundsmall" },
    { label: "Round", value: "round" },
    { label: "None", value: "none" }
  ];

  return [
    {
      text: is24Hour ? "Switch to 12-Hour Format" : "Switch to 24-Hour Format",
      action: () => toggleTimeFormat()
    },
    {
      text: "Scale",
      items: scaleOptions.map(opt => ({
        text: opt.label,
        checked: Math.abs(currentScale - opt.value) < 0.01,
        action: () => setScale(opt.value)
      }))
    },
    {
      text: "Blur Effect",
      items: blurOptions.map(opt => ({
        text: opt.label,
        checked: currentBlurType === opt.value,
        action: () => setBlurType(opt.value)
      }))
    },
    {
      text: "Corners",
      items: cornerOptions.map(opt => ({
        text: opt.label,
        checked: currentCornerType === opt.value,
        action: () => setCornerType(opt.value)
      }))
    },
    { type: "separator" },
    {
      text: "Reload Widget",
      action: () => {
        if (win && typeof win.refresh === "function") {
          win.refresh();
        }
      }
    },
    {
      text: "Close AClock",
      action: () => {
        if (clockTimer) {
          clearInterval(clockTimer);
          clockTimer = null;
        }
        if (win && typeof win.close === "function") {
          win.close();
        }
      }
    }
  ];
}

function initWidget() {
  const scaledW = Math.round(BASE_WIDTH * currentScale);
  const scaledH = Math.round(BASE_HEIGHT * currentScale);

  clockWindow = new widgetWindow({
    id: "AClock_Window",
    width: scaledW,
    height: scaledH,
    script: "ui/script.ui.js",
    backgroundColor: "rgba(0,0,0,0)",
    draggable: true,
    snapEdges: true,
    keepOnScreen: true,
    show: true
  });

  applyWindowBlur(clockWindow);
  clockWindow.setContextMenu(buildContextMenu(clockWindow));

  ipcMain.on("uiReady", () => {
    ipcMain.send("initSettings", {
      scale: currentScale,
      cornerType: currentCornerType,
      blurType: currentBlurType,
      is24Hour: is24Hour
    });
    publishClockData();
  });

  ipcMain.on("toggleFormat", () => {
    toggleTimeFormat();
  });

  ipcMain.on("setScale", (event, newScale) => {
    if (typeof newScale === "number" && newScale > 0) {
      setScale(newScale);
    }
  });

  ipcMain.on("setBlur", (event, newBlur) => {
    if (typeof newBlur === "string") {
      setBlurType(newBlur);
    }
  });

  ipcMain.on("setCorner", (event, newCorner) => {
    if (typeof newCorner === "string") {
      setCornerType(newCorner);
    }
  });

  publishClockData();
  clockTimer = setInterval(publishClockData, 500);
}

initWidget();