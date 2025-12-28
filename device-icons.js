// Realistic SVG Device Icons
const DeviceIcons = {
    // TP-Link Switch SVG
    'switch-tplink': `<svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="20" width="180" height="80" fill="#1a1a1a" rx="4"/>
        <rect x="15" y="25" width="170" height="70" fill="#2d2d2d" rx="2"/>
        <text x="100" y="65" text-anchor="middle" fill="#00a8ff" font-size="12" font-weight="bold">TP-Link</text>
        <text x="100" y="80" text-anchor="middle" fill="#888" font-size="8">Omada</text>
        <!-- Port LEDs -->
        <circle cx="30" cy="15" r="3" fill="#00ff00"/>
        <circle cx="50" cy="15" r="3" fill="#00ff00"/>
        <circle cx="70" cy="15" r="3" fill="#00ff00"/>
        <circle cx="90" cy="15" r="3" fill="#00ff00"/>
        <circle cx="110" cy="15" r="3" fill="#00ff00"/>
        <circle cx="130" cy="15" r="3" fill="#00ff00"/>
        <circle cx="150" cy="15" r="3" fill="#00ff00"/>
        <circle cx="170" cy="15" r="3" fill="#00ff00"/>
        <!-- Ports -->
        <rect x="25" y="100" width="10" height="8" fill="#333" rx="1"/>
        <rect x="45" y="100" width="10" height="8" fill="#333" rx="1"/>
        <rect x="65" y="100" width="10" height="8" fill="#333" rx="1"/>
        <rect x="85" y="100" width="10" height="8" fill="#333" rx="1"/>
        <rect x="105" y="100" width="10" height="8" fill="#333" rx="1"/>
        <rect x="125" y="100" width="10" height="8" fill="#333" rx="1"/>
        <rect x="145" y="100" width="10" height="8" fill="#333" rx="1"/>
        <rect x="165" y="100" width="10" height="8" fill="#333" rx="1"/>
    </svg>`,

    // Server SVG
    'server': `<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="20" width="160" height="110" fill="#1a1a1a" rx="4"/>
        <rect x="25" y="30" width="150" height="95" fill="#2d2d2d" rx="2"/>
        <!-- Drive bays -->
        <rect x="30" y="40" width="140" height="12" fill="#333" rx="1"/>
        <rect x="30" y="58" width="140" height="12" fill="#333" rx="1"/>
        <rect x="30" y="76" width="140" height="12" fill="#333" rx="1"/>
        <rect x="30" y="94" width="140" height="12" fill="#333" rx="1"/>
        <!-- Status LEDs -->
        <circle cx="180" cy="50" r="4" fill="#00ff00"/>
        <circle cx="180" cy="70" r="4" fill="#ffff00"/>
        <!-- Network ports -->
        <rect x="30" y="130" width="15" height="8" fill="#333" rx="1"/>
        <rect x="50" y="130" width="15" height="8" fill="#333" rx="1"/>
    </svg>`,

    // PC SVG
    'pc': `<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg">
        <!-- Monitor -->
        <rect x="30" y="20" width="140" height="90" fill="#1a1a1a" rx="4"/>
        <rect x="35" y="25" width="130" height="80" fill="#000" rx="2"/>
        <rect x="40" y="30" width="120" height="70" fill="#0a0a0a"/>
        <!-- Screen glow -->
        <rect x="40" y="30" width="120" height="70" fill="#00a8ff" opacity="0.1"/>
        <!-- Stand -->
        <rect x="90" y="110" width="20" height="15" fill="#2d2d2d"/>
        <rect x="80" y="125" width="40" height="5" fill="#1a1a1a" rx="2"/>
    </svg>`,

    // IPBX/VoIP Server SVG
    'ipbx': `<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="20" width="160" height="110" fill="#1a1a1a" rx="4"/>
        <rect x="25" y="30" width="150" height="95" fill="#2d2d2d" rx="2"/>
        <!-- Phone icon -->
        <path d="M 100 50 L 100 90 L 80 90 L 80 100 L 120 100 L 120 90 L 100 90 Z" fill="#00a8ff"/>
        <circle cx="100" cy="60" r="8" fill="#00a8ff"/>
        <text x="100" y="115" text-anchor="middle" fill="#00a8ff" font-size="10" font-weight="bold">IPBX</text>
        <!-- SIP ports -->
        <rect x="30" y="130" width="15" height="8" fill="#333" rx="1"/>
        <rect x="50" y="130" width="15" height="8" fill="#333" rx="1"/>
    </svg>`,

    // IP Phone SVG
    'ipphone': `<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg">
        <!-- Phone body -->
        <rect x="40" y="30" width="120" height="90" fill="#1a1a1a" rx="8"/>
        <rect x="45" y="35" width="110" height="80" fill="#2d2d2d" rx="6"/>
        <!-- Screen -->
        <rect x="50" y="45" width="100" height="50" fill="#000" rx="2"/>
        <text x="100" y="75" text-anchor="middle" fill="#00ff00" font-size="14" font-weight="bold">IP Phone</text>
        <!-- Buttons -->
        <circle cx="70" cy="110" r="6" fill="#333"/>
        <circle cx="100" cy="110" r="6" fill="#333"/>
        <circle cx="130" cy="110" r="6" fill="#333"/>
        <!-- Handset -->
        <rect x="60" y="20" width="80" height="15" fill="#1a1a1a" rx="4"/>
    </svg>`,

    // Router SVG
    'router': `<svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="20" width="180" height="80" fill="#1a1a1a" rx="4"/>
        <rect x="15" y="25" width="170" height="70" fill="#2d2d2d" rx="2"/>
        <text x="100" y="60" text-anchor="middle" fill="#ff6b00" font-size="14" font-weight="bold">Router</text>
        <!-- Antennas -->
        <line x1="30" y1="25" x2="30" y2="10" stroke="#666" stroke-width="2"/>
        <line x1="170" y1="25" x2="170" y2="10" stroke="#666" stroke-width="2"/>
        <circle cx="30" cy="10" r="3" fill="#666"/>
        <circle cx="170" cy="10" r="3" fill="#666"/>
        <!-- Ports -->
        <rect x="40" y="100" width="12" height="8" fill="#333" rx="1"/>
        <rect x="60" y="100" width="12" height="8" fill="#333" rx="1"/>
        <rect x="128" y="100" width="12" height="8" fill="#333" rx="1"/>
        <rect x="148" y="100" width="12" height="8" fill="#333" rx="1"/>
    </svg>`
};

// Get icon SVG for device
function getDeviceIcon(type, model) {
    if (model && model.includes('tplink-omada')) {
        return DeviceIcons['switch-tplink'];
    }
    return DeviceIcons[type] || DeviceIcons['pc'];
}

