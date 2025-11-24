const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const { scanProject } = require('./scanner')

function createWindow () {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  win.loadFile('renderer/index.html')
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.handle('pick-folder', async () => {
  const res = await dialog.showOpenDialog({ properties: ['openDirectory'] })
  return res.canceled ? null : res.filePaths[0]
})

ipcMain.handle('scan-project', async (event, folder) => {
  try {
    const result = await scanProject(folder)
    return { ok: true, result }
  } catch (err) {
    return { ok: false, error: err.message }
  }
})
