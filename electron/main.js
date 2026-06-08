app.whenReady().then(() => {
  createWindows();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindows();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

import { app, BrowserWindow, screen } from "electron";

function createWindows() {
  const displays = screen.getAllDisplays();

  const kioskDisplay = displays[0];

  const kioskWindow = new BrowserWindow({
    x: kioskDisplay.bounds.x,
    y: kioskDisplay.bounds.y,
    width: kioskDisplay.bounds.width,
    height: kioskDisplay.bounds.height,
    fullscreen: true,
    autoHideMenuBar: true,
  });

  kioskWindow.loadURL(
    "https://loketgayam.arjunadimas200.workers.dev/kiosk"
  );

  if (displays.length > 1) {
    const displayTV = displays[1];

    const displayWindow = new BrowserWindow({
      x: displayTV.bounds.x,
      y: displayTV.bounds.y,
      width: displayTV.bounds.width,
      height: displayTV.bounds.height,
      fullscreen: true,
      frame: false,
      autoHideMenuBar: true,
      resizable: false,
      movable: false,
    });

    displayWindow.loadURL(
      "https://loketgayam.arjunadimas200.workers.dev/display"
    );
  }
}

app.whenReady().then(() => {
  createWindows();
});