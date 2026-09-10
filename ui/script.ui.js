let currentScale = 1.0;
let currentCornerType = "roundsmall"; // "roundsmall" | "round" | "none"
let currentBlurType = "acrylic";       // "acrylic" | "blurbehind" | "none"

let lastTimeFormatted = "19<color=rgba(165,172,165,0.72)>:</color>40";
let lastDateStr = "September 05, 2026";
let lastDayStr = "SATURDAY";
let lastSecFormatted = "57  <size=12><color=rgba(160,165,160,0.8)>SEC</color></size>";
let lastProgress = 0.95;
let lastLocalText = "LOCAL";
let lastFormatStr = "24H";

const ALL_ELEMENT_IDS = [
  "card_bg",
  "left_accent_strip",
  "header_label",
  "live_dot",
  "clock_time",
  "date_text",
  "day_text",
  "seconds_label",
  "seconds_bar",
  "footer_local",
  "footer_format",
  "footer_live"
];

function getCornerRadii(cornerType, s) {
  if (cornerType === "none") {
    return {
      cardRadius: 0,
      accentRadiusX: 0,
      accentRadiusY: 0
    };
  } else if (cornerType === "round") {
    return {
      cardRadius: Math.round(18 * s),
      accentRadiusX: Math.round(8 * s),
      accentRadiusY: Math.round(8 * s)
    };
  } else {
    // "roundsmall"
    return {
      cardRadius: Math.round(10 * s),
      accentRadiusX: Math.round(4 * s),
      accentRadiusY: Math.round(4 * s)
    };
  }
}

function getCardFillColor(blurType) {
  if (blurType === "none") {
    return "rgba(22, 26, 24, 0.92)"; // More opaque backdrop when blur is disabled
  } else if (blurType === "blurbehind") {
    return "rgba(22, 26, 24, 0.65)";
  } else {
    // "acrylic"
    return "rgba(22, 26, 24, 0.78)";
  }
}

function renderUI(scale, cornerType, blurType) {
  if (typeof scale === "number" && scale > 0) {
    currentScale = scale;
  }
  if (typeof cornerType === "string") {
    currentCornerType = cornerType;
  }
  if (typeof blurType === "string") {
    currentBlurType = blurType;
  }

  const s = currentScale;
  const W = Math.round(500 * s);
  const H = Math.round(290 * s);

  const radii = getCornerRadii(currentCornerType, s);
  const cardBgColor = getCardFillColor(currentBlurType);

  ui.beginUpdate();

  // Remove previous elements before creating newly configured ones
  for (let i = 0; i < ALL_ELEMENT_IDS.length; i++) {
    if (ui.isElementExist(ALL_ELEMENT_IDS[i])) {
      ui.removeElementById(ALL_ELEMENT_IDS[i]);
    }
  }

  // 1. Frosted card backdrop with dynamic radius matching cornerType
  ui.addShape({
    id: "card_bg",
    type: "rectangle",
    x: 0,
    y: 0,
    width: W,
    height: H,
    radius: radii.cardRadius,
    fillColor: cardBgColor,
    strokeColor: "rgba(255, 255, 255, 0.09)",
    strokeWidth: Math.max(1, Math.round(1 * s))
  });

  // 2. Left white vertical accent bar with matching corner radius
  ui.addShape({
    id: "left_accent_strip",
    type: "rectangle",
    x: 0,
    y: 0,
    width: Math.max(4, Math.round(7 * s)),
    height: H,
    radiusX: radii.accentRadiusX,
    radiusY: radii.accentRadiusY,
    fillColor: "rgba(255, 255, 255, 0.95)",
    strokeWidth: 0
  });

  // 3. Header: "SYSTEM TIME"
  ui.addText({
    id: "header_label",
    x: Math.round(44 * s),
    y: Math.round(36 * s),
    width: Math.round(220 * s),
    height: Math.round(20 * s),
    text: "SYSTEM TIME",
    fontFace: "Segoe UI",
    fontSize: Math.round(12 * s),
    fontWeight: "semibold",
    fontColor: "rgba(160, 168, 160, 0.78)",
    letterSpacing: Math.max(1, Math.round(3 * s)),
    textAlign: "left"
  });

  // 4. Top-right live indicator dot
  ui.addShape({
    id: "live_dot",
    type: "ellipse",
    x: Math.round(446 * s),
    y: Math.round(38 * s),
    width: Math.max(6, Math.round(9 * s)),
    height: Math.max(6, Math.round(9 * s)),
    fillColor: "#ffffff",
    strokeWidth: 0
  });

  // 5. Clock time display (Hours & Minutes with dimmed colon, slashed-zero Consolas font)
  ui.addText({
    id: "clock_time",
    x: Math.round(44 * s),
    y: Math.round(68 * s),
    width: Math.round(300 * s),
    height: Math.round(105 * s),
    text: lastTimeFormatted,
    fontFace: "Consolas",
    fontSize: Math.round(84 * s),
    fontWeight: "bold",
    fontColor: "#ffffff",
    textAlign: "left"
  });

  // 6. Date display: "September 05, 2026"
  ui.addText({
    id: "date_text",
    x: Math.round(44 * s),
    y: Math.round(182 * s),
    width: Math.round(260 * s),
    height: Math.round(24 * s),
    text: lastDateStr,
    fontFace: "Segoe UI",
    fontSize: Math.round(16 * s),
    fontWeight: "normal",
    fontColor: "rgba(235, 240, 235, 0.95)",
    textAlign: "left"
  });

  // 7. Day of week display: "SATURDAY"
  ui.addText({
    id: "day_text",
    x: Math.round(44 * s),
    y: Math.round(208 * s),
    width: Math.round(220 * s),
    height: Math.round(20 * s),
    text: lastDayStr,
    fontFace: "Segoe UI",
    fontSize: Math.round(13 * s),
    fontWeight: "semibold",
    fontColor: "rgba(145, 152, 145, 0.78)",
    letterSpacing: Math.max(1, Math.round(2 * s)),
    textAlign: "left"
  });

  // 8. Seconds label: "57  SEC"
  ui.addText({
    id: "seconds_label",
    x: Math.round(320 * s),
    y: Math.round(190 * s),
    width: Math.round(135 * s),
    height: Math.round(24 * s),
    text: lastSecFormatted,
    fontFace: "Segoe UI",
    fontSize: Math.round(15 * s),
    fontWeight: "semibold",
    fontColor: "rgba(225, 230, 225, 0.95)",
    textAlign: "right"
  });

  // 9. Horizontal seconds progress bar
  ui.addBar({
    id: "seconds_bar",
    x: Math.round(325 * s),
    y: Math.round(220 * s),
    width: Math.round(130 * s),
    height: Math.max(2, Math.round(3 * s)),
    value: lastProgress,
    barColor: "#ffffff",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    barCornerRadius: Math.round(1.5 * s),
    backgroundColorRadius: Math.round(1.5 * s)
  });

  // 10. Footer: "LOCAL"
  ui.addText({
    id: "footer_local",
    x: Math.round(44 * s),
    y: Math.round(254 * s),
    width: Math.round(100 * s),
    height: Math.round(20 * s),
    text: lastLocalText,
    fontFace: "Segoe UI",
    fontSize: Math.round(12 * s),
    fontWeight: "semibold",
    fontColor: "rgba(135, 142, 135, 0.72)",
    letterSpacing: Math.max(1, Math.round(2 * s)),
    textAlign: "left"
  });

  // 11. Footer: "24H" / "12H" (Interactive button to toggle format)
  ui.addText({
    id: "footer_format",
    x: Math.round(215 * s),
    y: Math.round(254 * s),
    width: Math.round(70 * s),
    height: Math.round(20 * s),
    text: lastFormatStr,
    fontFace: "Segoe UI",
    fontSize: Math.round(12 * s),
    fontWeight: "semibold",
    fontColor: "rgba(135, 142, 135, 0.72)",
    letterSpacing: Math.max(1, Math.round(2 * s)),
    textAlign: "center",
    mouseEventCursor: true,
    tooltipText: "Click to toggle 12H / 24H format",
    onLeftMouseUp: function () {
      ipcRenderer.send("toggleFormat");
    }
  });

  // 12. Footer: "LIVE"
  ui.addText({
    id: "footer_live",
    x: Math.round(385 * s),
    y: Math.round(254 * s),
    width: Math.round(70 * s),
    height: Math.round(20 * s),
    text: "LIVE",
    fontFace: "Segoe UI",
    fontSize: Math.round(12 * s),
    fontWeight: "semibold",
    fontColor: "rgba(135, 142, 135, 0.72)",
    letterSpacing: Math.max(1, Math.round(2 * s)),
    textAlign: "right"
  });

  ui.endUpdate();
}

// Initial render
renderUI(1.0, "roundsmall", "acrylic");

// Initial settings synchronization
ipcRenderer.on("initSettings", function (event, settings) {
  if (!settings) return;
  if (typeof settings.scale === "number") currentScale = settings.scale;
  if (typeof settings.cornerType === "string") currentCornerType = settings.cornerType;
  if (typeof settings.blurType === "string") currentBlurType = settings.blurType;
  renderUI(currentScale, currentCornerType, currentBlurType);
});

// Scale change event
ipcRenderer.on("scaleUpdate", function (event, newScale) {
  if (typeof newScale === "number" && newScale > 0) {
    renderUI(newScale, currentCornerType, currentBlurType);
  }
});

// Corner style change event
ipcRenderer.on("cornerUpdate", function (event, newCorner) {
  if (typeof newCorner === "string") {
    currentCornerType = newCorner;
    renderUI(currentScale, currentCornerType, currentBlurType);
  }
});

// Blur effect change event
ipcRenderer.on("blurUpdate", function (event, newBlur) {
  if (typeof newBlur === "string") {
    currentBlurType = newBlur;
    renderUI(currentScale, currentCornerType, currentBlurType);
  }
});

// Real-time listener for clock data updates
ipcRenderer.on("clockUpdate", function (event, data) {
  if (!data) return;

  let needsReRender = false;
  if (typeof data.scale === "number" && Math.abs(data.scale - currentScale) > 0.01) {
    currentScale = data.scale;
    needsReRender = true;
  }
  if (typeof data.cornerType === "string" && data.cornerType !== currentCornerType) {
    currentCornerType = data.cornerType;
    needsReRender = true;
  }
  if (typeof data.blurType === "string" && data.blurType !== currentBlurType) {
    currentBlurType = data.blurType;
    needsReRender = true;
  }

  const s = currentScale;
  const secSize = Math.max(9, Math.round(12 * s));
  lastTimeFormatted = data.hour + "<color=rgba(165,172,165,0.72)>:</color>" + data.minute;
  lastSecFormatted = data.secondStr + "  <size=" + secSize + "><color=rgba(160,165,160,0.8)>SEC</color></size>";
  lastDateStr = data.dateStr;
  lastDayStr = data.dayStr;
  lastProgress = Math.max(0, Math.min(1, data.second / 59));
  lastFormatStr = data.formatStr;
  lastLocalText = data.is24Hour ? "LOCAL" : ("LOCAL " + data.period);

  if (needsReRender) {
    renderUI(currentScale, currentCornerType, currentBlurType);
    return;
  }

  ui.beginUpdate();

  if (ui.isElementExist("clock_time")) {
    ui.setElementProperties("clock_time", { text: lastTimeFormatted });
  }

  if (ui.isElementExist("date_text")) {
    ui.setElementProperties("date_text", { text: lastDateStr });
  }

  if (ui.isElementExist("day_text")) {
    ui.setElementProperties("day_text", { text: lastDayStr });
  }

  if (ui.isElementExist("seconds_label")) {
    ui.setElementProperties("seconds_label", { text: lastSecFormatted });
  }

  if (ui.isElementExist("seconds_bar")) {
    ui.setElementProperties("seconds_bar", { value: lastProgress });
  }

  if (ui.isElementExist("footer_format")) {
    ui.setElementProperties("footer_format", { text: lastFormatStr });
  }

  if (ui.isElementExist("footer_local")) {
    ui.setElementProperties("footer_local", { text: lastLocalText });
  }

  ui.endUpdate();
});

// Notify Main script that UI script is ready
ipcRenderer.send("uiReady");