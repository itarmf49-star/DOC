# Network Script Builder

A modern web-based network topology designer and configuration script generator, inspired by Cisco Packet Tracer. This tool allows you to create, visualize, and generate network configurations for multi-device departments and all-system environments.

## Features

### 🎨 Visual Network Designer
- **Drag-and-Drop Interface**: Easily add network devices to your topology by dragging from the device palette
- **Moveable Components**: Click and drag devices to position them anywhere on the canvas
- **Connection System**: Connect devices using connection points on each device
- **Zoom Controls**: Zoom in/out for detailed view or overview of large networks

### 📡 Device Support
- **Routers**: Multiple router models (2901, 1941, ASR)
- **Switches**: Layer 2 and Layer 3 switches (2960, 3750, L3)
- **End Devices**: PCs, Servers, Laptops
- **Infrastructure**: Wireless Access Points, Firewalls, Cloud services
- **Engineering Structures**: Moveable facades for distribution centers, data centers, network hubs, and communication towers

### 🔧 Configuration Features
- **Multi-Device Configuration**: Configure individual device properties (IP addresses, hostnames, VLANs, routing protocols)
- **Connection Management**: View and manage all network connections
- **Department Types**: Support for All-System, Multi-Device, Electronics Distribution, and Network Infrastructure departments

### 📝 Script Generation
Generate network configuration scripts in multiple formats:
- **Cisco IOS**: Standard Cisco router/switch configuration commands
- **Juniper JunOS**: Juniper network device configurations
- **JSON**: Structured data format for automation
- **YAML**: Human-readable configuration format

### 💾 Project Management
- **Save Projects**: Save your network topology as JSON files
- **Load Projects**: Restore previously saved network designs
- **Export Scripts**: Download generated configuration scripts
- **Copy to Clipboard**: Quick copy of generated scripts

## Usage

### Getting Started

1. Open `index.html` in a modern web browser
2. Select a device from the device palette on the left
3. Drag the device onto the canvas
4. Configure device properties in the Properties panel on the right

### Creating Connections

1. Click the "Connect" button in the toolbar
2. Click on a connection point (blue dots) on the source device
3. Click on a connection point on the destination device
4. The connection will be established and displayed

### Configuring Devices

1. Click on a device to select it
2. Use the Properties tab to modify:
   - Hostname
   - IP Address
   - Subnet Mask
   - Device-specific settings (VLANs, routing protocols, etc.)

### Generating Scripts

1. Click the "Generated Script" tab
2. Select your preferred script format (Cisco IOS, Juniper, JSON, or YAML)
3. The script will automatically update as you modify your network
4. Use "Copy" or "Download" to save the script

### Working with Engineering Structures

Engineering structure facades (distribution centers, data centers, etc.) can be:
- Dragged onto the canvas like regular devices
- Positioned to represent physical network locations
- Connected to other devices in the network
- Configured with capacity and structure type properties

## Browser Compatibility

- Chrome/Edge (recommended)
- Firefox
- Safari
- Any modern browser with ES6 support

## File Structure

```
.
├── index.html      # Main HTML structure
├── styles.css      # Styling and layout
├── script.js       # Application logic and functionality
└── README.md       # This file
```

## Technical Details

- **Pure JavaScript**: No external dependencies required
- **SVG Connections**: Dynamic connection lines using SVG
- **Local Storage**: Projects saved as downloadable JSON files
- **Responsive Design**: Works on desktop and tablet devices

## Features Comparison with Cisco Packet Tracer

✅ Visual network topology design
✅ Drag-and-drop device placement
✅ Device connections and links
✅ Configuration script generation
✅ Multiple device types
✅ Moveable components
✅ Project save/load functionality
➕ Web-based (no installation required)
➕ Multiple script format support
➕ Engineering structure facades for distribution networks

## License

This project is open source and available for hadrami


