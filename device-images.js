// Real Device Images Configuration
const DeviceImages = {
    // Use data URIs or URLs for device images
    // For now, using enhanced SVG representations that look more realistic
    
    'router': {
        image: `<svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="routerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#2d3748;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#1a202c;stop-opacity:1" />
                </linearGradient>
            </defs>
            <rect x="20" y="30" width="160" height="60" fill="url(#routerGrad)" rx="4" stroke="#4a5568" stroke-width="2"/>
            <rect x="25" y="35" width="150" height="50" fill="#1a202c" rx="2"/>
            <text x="100" y="65" text-anchor="middle" fill="#ff6b00" font-size="14" font-weight="bold" font-family="Arial">ROUTER</text>
            <line x1="40" y1="30" x2="40" y2="15" stroke="#666" stroke-width="2"/>
            <line x1="160" y1="30" x2="160" y2="15" stroke="#666" stroke-width="2"/>
            <circle cx="40" cy="15" r="4" fill="#666"/>
            <circle cx="160" cy="15" r="4" fill="#666"/>
            <rect x="45" y="95" width="15" height="10" fill="#333" rx="1"/>
            <rect x="70" y="95" width="15" height="10" fill="#333" rx="1"/>
            <rect x="115" y="95" width="15" height="10" fill="#333" rx="1"/>
            <rect x="140" y="95" width="15" height="10" fill="#333" rx="1"/>
        </svg>`,
        width: 200,
        height: 120
    },
    
    'switch-tplink': {
        image: `<svg viewBox="0 0 200 140" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="switchGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#1a1a1a;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#0a0a0a;stop-opacity:1" />
                </linearGradient>
            </defs>
            <rect x="10" y="20" width="180" height="90" fill="url(#switchGrad)" rx="4" stroke="#333" stroke-width="2"/>
            <rect x="15" y="25" width="170" height="80" fill="#0a0a0a" rx="2"/>
            <text x="100" y="50" text-anchor="middle" fill="#00a8ff" font-size="16" font-weight="bold">TP-Link</text>
            <text x="100" y="70" text-anchor="middle" fill="#888" font-size="10">Omada Switch</text>
            <circle cx="30" cy="15" r="3" fill="#00ff00"/>
            <circle cx="50" cy="15" r="3" fill="#00ff00"/>
            <circle cx="70" cy="15" r="3" fill="#00ff00"/>
            <circle cx="90" cy="15" r="3" fill="#00ff00"/>
            <circle cx="110" cy="15" r="3" fill="#00ff00"/>
            <circle cx="130" cy="15" r="3" fill="#00ff00"/>
            <circle cx="150" cy="15" r="3" fill="#00ff00"/>
            <circle cx="170" cy="15" r="3" fill="#00ff00"/>
            <rect x="25" y="115" width="12" height="8" fill="#222" rx="1"/>
            <rect x="45" y="115" width="12" height="8" fill="#222" rx="1"/>
            <rect x="65" y="115" width="12" height="8" fill="#222" rx="1"/>
            <rect x="85" y="115" width="12" height="8" fill="#222" rx="1"/>
            <rect x="105" y="115" width="12" height="8" fill="#222" rx="1"/>
            <rect x="125" y="115" width="12" height="8" fill="#222" rx="1"/>
            <rect x="145" y="115" width="12" height="8" fill="#222" rx="1"/>
            <rect x="165" y="115" width="12" height="8" fill="#222" rx="1"/>
        </svg>`,
        width: 200,
        height: 140
    },
    
    'server': {
        image: `<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="serverGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#2d3748;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#1a202c;stop-opacity:1" />
                </linearGradient>
            </defs>
            <rect x="20" y="20" width="160" height="110" fill="url(#serverGrad)" rx="4" stroke="#4a5568" stroke-width="2"/>
            <rect x="25" y="30" width="150" height="95" fill="#1a202c" rx="2"/>
            <rect x="30" y="40" width="140" height="15" fill="#2d3748" rx="1"/>
            <rect x="30" y="60" width="140" height="15" fill="#2d3748" rx="1"/>
            <rect x="30" y="80" width="140" height="15" fill="#2d3748" rx="1"/>
            <rect x="30" y="100" width="140" height="15" fill="#2d3748" rx="1"/>
            <circle cx="180" cy="50" r="5" fill="#00ff00"/>
            <circle cx="180" cy="70" r="5" fill="#ffff00"/>
            <rect x="30" y="130" width="20" height="10" fill="#333" rx="1"/>
            <rect x="55" y="130" width="20" height="10" fill="#333" rx="1"/>
        </svg>`,
        width: 200,
        height: 150
    },
    
    'pc': {
        image: `<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg">
            <rect x="30" y="20" width="140" height="90" fill="#1a1a1a" rx="4" stroke="#333" stroke-width="2"/>
            <rect x="35" y="25" width="130" height="80" fill="#000" rx="2"/>
            <rect x="40" y="30" width="120" height="70" fill="#0a0a0a"/>
            <rect x="40" y="30" width="120" height="70" fill="#00a8ff" opacity="0.15"/>
            <rect x="90" y="110" width="20" height="15" fill="#2d2d2d"/>
            <rect x="80" y="125" width="40" height="5" fill="#1a1a1a" rx="2"/>
        </svg>`,
        width: 200,
        height: 150
    },
    
    'ipbx': {
        image: `<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg">
            <rect x="20" y="20" width="160" height="110" fill="#1a1a1a" rx="4" stroke="#00a8ff" stroke-width="2"/>
            <rect x="25" y="30" width="150" height="95" fill="#0a0a0a" rx="2"/>
            <path d="M 100 50 L 100 90 L 80 90 L 80 100 L 120 100 L 120 90 L 100 90 Z" fill="#00a8ff"/>
            <circle cx="100" cy="60" r="10" fill="#00a8ff"/>
            <text x="100" y="115" text-anchor="middle" fill="#00a8ff" font-size="12" font-weight="bold">IPBX SERVER</text>
            <rect x="30" y="130" width="18" height="10" fill="#333" rx="1"/>
            <rect x="52" y="130" width="18" height="10" fill="#333" rx="1"/>
        </svg>`,
        width: 200,
        height: 150
    },
    
    'ipphone': {
        image: `<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg">
            <rect x="40" y="30" width="120" height="90" fill="#1a1a1a" rx="8" stroke="#00a8ff" stroke-width="2"/>
            <rect x="45" y="35" width="110" height="80" fill="#0a0a0a" rx="6"/>
            <rect x="50" y="45" width="100" height="50" fill="#000" rx="2"/>
            <text x="100" y="75" text-anchor="middle" fill="#00ff00" font-size="12" font-weight="bold">IP Phone</text>
            <circle cx="70" cy="110" r="7" fill="#333"/>
            <circle cx="100" cy="110" r="7" fill="#333"/>
            <circle cx="130" cy="110" r="7" fill="#333"/>
            <rect x="60" y="20" width="80" height="15" fill="#1a1a1a" rx="4"/>
        </svg>`,
        width: 200,
        height: 150
    },
    
    'cisco-router': {
        image: `<svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="ciscoRouterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#0077b5;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#005885;stop-opacity:1" />
                </linearGradient>
            </defs>
            <rect x="20" y="30" width="160" height="60" fill="url(#ciscoRouterGrad)" rx="4" stroke="#004d6b" stroke-width="2"/>
            <rect x="25" y="35" width="150" height="50" fill="#003d55" rx="2"/>
            <text x="100" y="65" text-anchor="middle" fill="#ffffff" font-size="14" font-weight="bold" font-family="Arial">CISCO</text>
            <line x1="40" y1="30" x2="40" y2="15" stroke="#666" stroke-width="2"/>
            <line x1="160" y1="30" x2="160" y2="15" stroke="#666" stroke-width="2"/>
            <circle cx="40" cy="15" r="4" fill="#666"/>
            <circle cx="160" cy="15" r="4" fill="#666"/>
            <rect x="45" y="95" width="15" height="10" fill="#333" rx="1"/>
            <rect x="70" y="95" width="15" height="10" fill="#333" rx="1"/>
            <rect x="115" y="95" width="15" height="10" fill="#333" rx="1"/>
            <rect x="140" y="95" width="15" height="10" fill="#333" rx="1"/>
        </svg>`,
        width: 200,
        height: 120
    },
    
    'cisco-switch': {
        image: `<svg viewBox="0 0 200 140" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="ciscoSwitchGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#0077b5;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#005885;stop-opacity:1" />
                </linearGradient>
            </defs>
            <rect x="10" y="20" width="180" height="90" fill="url(#ciscoSwitchGrad)" rx="4" stroke="#004d6b" stroke-width="2"/>
            <rect x="15" y="25" width="170" height="80" fill="#003d55" rx="2"/>
            <text x="100" y="50" text-anchor="middle" fill="#ffffff" font-size="16" font-weight="bold">CISCO</text>
            <text x="100" y="70" text-anchor="middle" fill="#88ccff" font-size="10">Switch</text>
            <circle cx="30" cy="15" r="3" fill="#00ff00"/>
            <circle cx="50" cy="15" r="3" fill="#00ff00"/>
            <circle cx="70" cy="15" r="3" fill="#00ff00"/>
            <circle cx="90" cy="15" r="3" fill="#00ff00"/>
            <circle cx="110" cy="15" r="3" fill="#00ff00"/>
            <circle cx="130" cy="15" r="3" fill="#00ff00"/>
            <circle cx="150" cy="15" r="3" fill="#00ff00"/>
            <circle cx="170" cy="15" r="3" fill="#00ff00"/>
            <rect x="25" y="115" width="12" height="8" fill="#222" rx="1"/>
            <rect x="45" y="115" width="12" height="8" fill="#222" rx="1"/>
            <rect x="65" y="115" width="12" height="8" fill="#222" rx="1"/>
            <rect x="85" y="115" width="12" height="8" fill="#222" rx="1"/>
            <rect x="105" y="115" width="12" height="8" fill="#222" rx="1"/>
            <rect x="125" y="115" width="12" height="8" fill="#222" rx="1"/>
            <rect x="145" y="115" width="12" height="8" fill="#222" rx="1"/>
            <rect x="165" y="115" width="12" height="8" fill="#222" rx="1"/>
        </svg>`,
        width: 200,
        height: 140
    },
    
    'dahua-device': {
        image: `<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="dahuaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#ff6b00;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#cc5500;stop-opacity:1" />
                </linearGradient>
            </defs>
            <rect x="20" y="20" width="160" height="110" fill="url(#dahuaGrad)" rx="4" stroke="#aa4400" stroke-width="2"/>
            <rect x="25" y="30" width="150" height="95" fill="#992200" rx="2"/>
            <text x="100" y="65" text-anchor="middle" fill="#ffffff" font-size="18" font-weight="bold" font-family="Arial">DAHUA</text>
            <circle cx="180" cy="50" r="6" fill="#00ff00"/>
            <circle cx="180" cy="70" r="6" fill="#ffff00"/>
            <rect x="30" y="140" width="15" height="8" fill="#333" rx="1"/>
            <rect x="50" y="140" width="15" height="8" fill="#333" rx="1"/>
            <rect x="135" y="140" width="15" height="8" fill="#333" rx="1"/>
            <rect x="155" y="140" width="15" height="8" fill="#333" rx="1"/>
        </svg>`,
        width: 200,
        height: 150
    }
};

function getDeviceImage(type, model) {
    // Cisco devices
    if (model && model.includes('cisco')) {
        if (type === 'router') {
            return DeviceImages['cisco-router'] || DeviceImages['router'];
        } else if (type === 'switch') {
            return DeviceImages['cisco-switch'] || DeviceImages['switch-tplink'];
        }
    }
    
    // Dahua devices
    if (type === 'dahua') {
        return DeviceImages['dahua-device'] || DeviceImages['server'];
    }
    
    // TP-Link devices
    if (model && model.includes('tplink-omada')) {
        return DeviceImages['switch-tplink'];
    }
    
    return DeviceImages[type] || DeviceImages['pc'];
}

function getDeviceImage(type, model) {
    // Cisco devices
    if (model && model.includes('cisco')) {
        if (type === 'router') {
            return DeviceImages['cisco-router'] || DeviceImages['router'];
        } else if (type === 'switch') {
            return DeviceImages['cisco-switch'] || DeviceImages['switch-tplink'];
        }
    }
    
    // Dahua devices
    if (type === 'dahua') {
        return DeviceImages['dahua-device'] || DeviceImages['server'];
    }
    
    // TP-Link devices
    if (model && model.includes('tplink-omada')) {
        return DeviceImages['switch-tplink'];
    }
    
    return DeviceImages[type] || DeviceImages['pc'];
}

