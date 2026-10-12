// This app collects local diagnostics through a narrowly scoped preload bridge.
// Web content must not gain new windows, silent navigation, or privileged permissions.
function isSafeExternalLink(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' && !parsed.username && !parsed.password;
  } catch {
    return false;
  }
}
function secureDoctorWindow(win, shell) {
  win.webContents.setWindowOpenHandler(({url}) => {
    if (isSafeExternalLink(url)) {
      void shell.openExternal(url).catch(() => {});
    }
    return { action: 'deny' };
  });
  // Only app.loadFile/loadURL should navigate the desktop renderer.
  win.webContents.on('will-navigate', event => event.preventDefault());
  win.webContents.session.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
}
module.exports = { isSafeExternalLink, secureDoctorWindow };
