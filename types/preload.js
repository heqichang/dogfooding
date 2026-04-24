const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    send: (channel, data) => {
        const validChannels = ['import-text', 'export-records', 'restart-practice', 'next-text', 'switch-language', 'switch-level', 'toggle-sound', 'save-records', 'show-error'];
        if (validChannels.includes(channel)) {
            ipcRenderer.send(channel, data);
        }
    },
    receive: (channel, func) => {
        const validChannels = ['import-text', 'export-records', 'restart-practice', 'next-text', 'switch-language', 'switch-level', 'toggle-sound'];
        if (validChannels.includes(channel)) {
            ipcRenderer.on(channel, (event, ...args) => func(...args));
        }
    },
    removeAllListeners: (channel) => {
        ipcRenderer.removeAllListeners(channel);
    }
});
