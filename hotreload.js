const fs = require('fs');
const path = require('path');
const config = require('./config');

class HotReloader {
    constructor() {
        this.watchers = new Map();
        this.modules = new Map();
        this.watchPaths = [
            './main.js',
            './config.js',
            './utils/functions.js',
            './utils/smsg.js'
        ];
    }
    
    start() {
        config.logger('info', '🔥 Hot reloader started');
        
        this.watchPaths.forEach(filePath => {
            const fullPath = path.join(__dirname, filePath);
            this.watchFile(fullPath);
        });
        
        // Watch entire utils folder
        const utilsPath = path.join(__dirname, 'utils');
        if (fs.existsSync(utilsPath)) {
            fs.watch(utilsPath, (eventType, filename) => {
                if (filename && (filename.endsWith('.js'))) {
                    const fullPath = path.join(utilsPath, filename);
                    this.reloadModule(fullPath);
                }
            });
        }
    }
    
    watchFile(filePath) {
        if (!fs.existsSync(filePath)) return;
        
        const watcher = fs.watch(filePath, (eventType) => {
            if (eventType === 'change') {
                this.reloadModule(filePath);
            }
        });
        
        this.watchers.set(filePath, watcher);
    }
    
    reloadModule(filePath) {
        try {
            // Clear require cache
            delete require.cache[require.resolve(filePath)];
            
            // Reload module
            const module = require(filePath);
            
            config.logger('success', `🔄 Reloaded: ${path.basename(filePath)}`);
            
            // Trigger custom reload event
            if (global.onModuleReload) {
                global.onModuleReload(filePath, module);
            }
            
        } catch (error) {
            config.logger('error', `Failed to reload ${filePath}:`, error);
        }
    }
    
    stop() {
        this.watchers.forEach((watcher, filePath) => {
            watcher.close();
        });
        config.logger('info', 'Hot reloader stopped');
    }
}

module.exports = HotReloader;