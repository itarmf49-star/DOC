// Network Script Builder Application
class NetworkBuilder {
    constructor() {
        this.devices = [];
        this.connections = [];
        this.selectedDevice = null;
        this.currentMode = 'select';
        this.draggedDevice = null;
        this.isDrawingConnection = false;
        this.connectionStart = null;
        this.deviceCounter = { router: 0, switch: 0, pc: 0, server: 0, laptop: 0, wireless: 0, firewall: 0, cloud: 0, facade: 0 };
        this.zoomLevel = 1;
        this.departmentType = 'all-system';
        
        this.initializeEventListeners();
        this.initializeCanvas();
    }

    initializeEventListeners() {
        // Device palette drag
        document.querySelectorAll('.device-item').forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('deviceType', item.dataset.type);
                e.dataTransfer.setData('deviceModel', item.dataset.device);
            });
        });

        // Canvas drop
        const canvas = document.getElementById('networkCanvas');
        canvas.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            const deviceType = e.dataTransfer.getData('deviceType');
            const deviceModel = e.dataTransfer.getData('deviceModel');
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) / this.zoomLevel;
            const y = (e.clientY - rect.top) / this.zoomLevel;
            this.addDevice(deviceType, deviceModel, x, y);
        });

        // Mode buttons
        document.getElementById('selectMode').addEventListener('click', () => this.setMode('select'));
        document.getElementById('connectMode').addEventListener('click', () => this.setMode('connect'));
        document.getElementById('deleteMode').addEventListener('click', () => this.setMode('delete'));

        // Zoom buttons
        document.getElementById('zoomIn').addEventListener('click', () => this.zoom(1.1));
        document.getElementById('zoomOut').addEventListener('click', () => this.zoom(0.9));
        document.getElementById('resetZoom').addEventListener('click', () => this.resetZoom());

        // Department select
        document.getElementById('departmentSelect').addEventListener('change', (e) => {
            this.departmentType = e.target.value;
            this.updateScript();
        });

        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                this.switchTab(tab);
            });
        });

        // Action buttons
        document.getElementById('exportScript').addEventListener('click', () => this.exportScript());
        document.getElementById('clearCanvas').addEventListener('click', () => this.clearCanvas());
        document.getElementById('saveProject').addEventListener('click', () => this.saveProject());
        document.getElementById('loadProject').addEventListener('click', () => this.loadProject());
        document.getElementById('copyScript').addEventListener('click', () => this.copyScript());
        document.getElementById('downloadScript').addEventListener('click', () => this.downloadScript());
        document.getElementById('scriptFormat').addEventListener('change', () => this.updateScript());

        // Canvas click
        canvas.addEventListener('click', (e) => {
            if (this.currentMode === 'delete') {
                const device = e.target.closest('.network-device');
                if (device) {
                    this.deleteDevice(device.dataset.id);
                }
            } else if (this.currentMode === 'select') {
                const device = e.target.closest('.network-device');
                if (device) {
                    this.selectDevice(device.dataset.id);
                } else {
                    this.deselectDevice();
                }
            }
        });
    }

    initializeCanvas() {
        const canvas = document.getElementById('networkCanvas');
        canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        canvas.addEventListener('scroll', () => this.updateConnections());
    }

    handleMouseDown(e) {
        const canvas = document.getElementById('networkCanvas');
        if (this.currentMode === 'connect') {
            const connectionPoint = e.target.closest('.connection-point');
            if (connectionPoint) {
                this.isDrawingConnection = true;
                const deviceElement = connectionPoint.closest('.network-device');
                this.connectionStart = {
                    deviceId: deviceElement.dataset.id,
                    point: connectionPoint.dataset.side
                };
                canvas.classList.add('drawing-connection');
            }
        } else if (this.currentMode === 'select') {
            const device = e.target.closest('.network-device');
            if (device && !e.target.closest('.connection-point')) {
                this.draggedDevice = device;
                const rect = canvas.getBoundingClientRect();
                const scrollLeft = canvas.scrollLeft;
                const scrollTop = canvas.scrollTop;
                const deviceX = parseFloat(device.style.left || 0) * this.zoomLevel;
                const deviceY = parseFloat(device.style.top || 0) * this.zoomLevel;
                this.offsetX = (e.clientX - rect.left + scrollLeft) - deviceX;
                this.offsetY = (e.clientY - rect.top + scrollTop) - deviceY;
            }
        }
    }

    handleMouseMove(e) {
        if (this.draggedDevice) {
            const canvas = document.getElementById('networkCanvas');
            const rect = canvas.getBoundingClientRect();
            const scrollLeft = canvas.scrollLeft;
            const scrollTop = canvas.scrollTop;
            const x = ((e.clientX - rect.left + scrollLeft) - this.offsetX) / this.zoomLevel;
            const y = ((e.clientY - rect.top + scrollTop) - this.offsetY) / this.zoomLevel;
            
            // Constrain to canvas bounds
            const constrainedX = Math.max(0, x);
            const constrainedY = Math.max(0, y);
            
            this.draggedDevice.style.left = `${constrainedX}px`;
            this.draggedDevice.style.top = `${constrainedY}px`;
            
            this.updateDevicePosition(this.draggedDevice.dataset.id, constrainedX, constrainedY);
            this.updateConnections();
        } else if (this.isDrawingConnection) {
            this.drawTemporaryConnection(e);
        }
    }

    handleMouseUp(e) {
        if (this.isDrawingConnection) {
            const connectionPoint = e.target.closest('.connection-point');
            if (connectionPoint) {
                const deviceElement = connectionPoint.closest('.network-device');
                const endDeviceId = deviceElement.dataset.id;
                const endPoint = connectionPoint.dataset.side;
                
                if (this.connectionStart && this.connectionStart.deviceId !== endDeviceId) {
                    this.addConnection(
                        this.connectionStart.deviceId,
                        this.connectionStart.point,
                        endDeviceId,
                        endPoint
                    );
                }
            }
            this.isDrawingConnection = false;
            this.connectionStart = null;
            document.getElementById('networkCanvas').classList.remove('drawing-connection');
            this.clearTemporaryConnection();
        }
        this.draggedDevice = null;
    }

    addDevice(type, model, x, y) {
        const id = `${type}-${++this.deviceCounter[type]}`;
        const device = {
            id,
            type,
            model,
            x,
            y,
            label: this.generateDeviceLabel(type, model),
            properties: this.getDefaultProperties(type, model)
        };

        this.devices.push(device);
        this.renderDevice(device);
        this.updateScript();
    }

    generateDeviceLabel(type, model) {
        const prefixes = {
            router: 'R',
            switch: 'SW',
            pc: 'PC',
            server: 'SRV',
            laptop: 'LAP',
            wireless: 'AP',
            firewall: 'FW',
            cloud: 'CL',
            facade: 'FC'
        };
        return `${prefixes[type] || 'DEV'}${this.deviceCounter[type]}`;
    }

    getDefaultProperties(type, model) {
        const baseProps = {
            hostname: this.generateDeviceLabel(type, model),
            ip: this.generateIP(),
            subnet: '255.255.255.0',
            gateway: '0.0.0.0'
        };

        if (type === 'router') {
            return {
                ...baseProps,
                interfaces: ['GigabitEthernet0/0', 'GigabitEthernet0/1'],
                routing: 'static'
            };
        } else if (type === 'switch') {
            const props = {
                ...baseProps,
                vlans: ['1', '10', '20'],
                spanningTree: true
            };
            // Add TP-Link Omada specific properties
            if (model && model.includes('tplink-omada')) {
                props.omadaController = '';
                props.omadaMode = 'standalone'; // standalone or controller-managed
            }
            return props;
        } else if (type === 'facade') {
            return {
                ...baseProps,
                structureType: model,
                capacity: '1000',
                devices: []
            };
        }

        return baseProps;
    }

    generateIP() {
        const octets = [];
        for (let i = 0; i < 4; i++) {
            if (i === 0) octets.push(192);
            else if (i === 1) octets.push(168);
            else if (i === 2) octets.push(Math.floor(Math.random() * 255));
            else octets.push(Math.floor(Math.random() * 254) + 1);
        }
        return octets.join('.');
    }

    renderDevice(device) {
        const canvas = document.getElementById('networkCanvas');
        const deviceElement = document.createElement('div');
        deviceElement.className = `network-device type-${device.type}`;
        deviceElement.dataset.id = device.id;
        deviceElement.style.left = `${device.x}px`;
        deviceElement.style.top = `${device.y}px`;
        deviceElement.style.transform = `scale(${this.zoomLevel})`;
        deviceElement.style.transformOrigin = 'top left';

        const icons = {
            router: '🔄',
            switch: '🔀',
            pc: '💻',
            server: '🖥️',
            laptop: '📱',
            wireless: '📡',
            firewall: '🛡️',
            cloud: '☁️',
            facade: '🏭'
        };

        deviceElement.innerHTML = `
            <div class="network-device-icon">${icons[device.type] || '📦'}</div>
            <div class="network-device-label">${device.label}</div>
            <div class="connection-point top" data-side="top"></div>
            <div class="connection-point bottom" data-side="bottom"></div>
            <div class="connection-point left" data-side="left"></div>
            <div class="connection-point right" data-side="right"></div>
        `;

        deviceElement.addEventListener('mousedown', (e) => {
            if (this.currentMode === 'select') {
                this.selectDevice(device.id);
            }
        });

        canvas.appendChild(deviceElement);
        this.updateDeviceElement(device);
    }

    updateDeviceElement(device) {
        const element = document.querySelector(`.network-device[data-id="${device.id}"]`);
        if (element) {
            element.style.left = `${device.x}px`;
            element.style.top = `${device.y}px`;
        }
    }

    updateDevicePosition(id, x, y) {
        const device = this.devices.find(d => d.id === id);
        if (device) {
            device.x = x;
            device.y = y;
        }
    }

    selectDevice(id) {
        this.deselectDevice();
        this.selectedDevice = this.devices.find(d => d.id === id);
        if (this.selectedDevice) {
            const element = document.querySelector(`.network-device[data-id="${id}"]`);
            if (element) {
                element.classList.add('selected');
            }
            this.showDeviceProperties();
        }
    }

    deselectDevice() {
        if (this.selectedDevice) {
            const element = document.querySelector(`.network-device[data-id="${this.selectedDevice.id}"]`);
            if (element) {
                element.classList.remove('selected');
            }
        }
        this.selectedDevice = null;
    }

    deleteDevice(id) {
        this.devices = this.devices.filter(d => d.id !== id);
        this.connections = this.connections.filter(c => 
            c.fromDevice !== id && c.toDevice !== id
        );
        const element = document.querySelector(`.network-device[data-id="${id}"]`);
        if (element) {
            element.remove();
        }
        if (this.selectedDevice && this.selectedDevice.id === id) {
            this.deselectDevice();
        }
        this.updateConnections();
        this.updateScript();
        this.updateConnectionsList();
    }

    addConnection(fromDeviceId, fromPoint, toDeviceId, toPoint) {
        const connection = {
            id: `conn-${Date.now()}`,
            fromDevice: fromDeviceId,
            fromPoint,
            toDevice: toDeviceId,
            toPoint,
            type: 'ethernet',
            bandwidth: '1000'
        };
        this.connections.push(connection);
        this.updateConnections();
        this.updateConnectionsList();
        this.updateScript();
    }

    updateConnections() {
        const svg = document.getElementById('connectionOverlay');
        const canvas = document.getElementById('networkCanvas');
        
        // Preserve temporary connection line if drawing
        const tempLine = document.getElementById('temp-connection-line');
        const tempLineClone = tempLine ? tempLine.cloneNode(true) : null;
        svg.innerHTML = '';
        if (tempLineClone) {
            svg.appendChild(tempLineClone);
        }
        
        // Set SVG dimensions to match canvas scrollable area
        const canvasRect = canvas.getBoundingClientRect();
        const maxWidth = Math.max(canvas.scrollWidth, canvasRect.width, 2000);
        const maxHeight = Math.max(canvas.scrollHeight, canvasRect.height, 2000);
        svg.setAttribute('width', maxWidth);
        svg.setAttribute('height', maxHeight);

        this.connections.forEach(conn => {
            const fromEl = document.querySelector(`.network-device[data-id="${conn.fromDevice}"]`);
            const toEl = document.querySelector(`.network-device[data-id="${conn.toDevice}"]`);
            
            if (fromEl && toEl) {
                const fromX = parseFloat(fromEl.style.left || 0) + fromEl.offsetWidth / 2 + 
                             this.getConnectionOffset(conn.fromPoint, 'x', fromEl.offsetWidth);
                const fromY = parseFloat(fromEl.style.top || 0) + fromEl.offsetHeight / 2 + 
                             this.getConnectionOffset(conn.fromPoint, 'y', fromEl.offsetHeight);
                const toX = parseFloat(toEl.style.left || 0) + toEl.offsetWidth / 2 + 
                           this.getConnectionOffset(conn.toPoint, 'x', toEl.offsetWidth);
                const toY = parseFloat(toEl.style.top || 0) + toEl.offsetHeight / 2 + 
                           this.getConnectionOffset(conn.toPoint, 'y', toEl.offsetHeight);

                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', fromX);
                line.setAttribute('y1', fromY);
                line.setAttribute('x2', toX);
                line.setAttribute('y2', toY);
                line.setAttribute('class', 'connection-line');
                line.setAttribute('data-connection-id', conn.id);
                line.style.pointerEvents = 'stroke';
                line.style.cursor = 'pointer';
                line.addEventListener('click', () => {
                    if (this.currentMode === 'delete') {
                        this.connections = this.connections.filter(c => c.id !== conn.id);
                        this.updateConnections();
                        this.updateConnectionsList();
                        this.updateScript();
                    }
                });
                svg.appendChild(line);
            }
        });
    }

    getConnectionOffset(point, axis, size) {
        const offset = size / 2;
        if (axis === 'x') {
            if (point === 'left') return -offset;
            if (point === 'right') return offset;
            return 0;
        } else {
            if (point === 'top') return -offset;
            if (point === 'bottom') return offset;
            return 0;
        }
    }

    drawTemporaryConnection(e) {
        if (!this.connectionStart) return;
        
        const canvas = document.getElementById('networkCanvas');
        const svg = document.getElementById('connectionOverlay');
        let tempLine = document.getElementById('temp-connection-line');
        
        if (!tempLine) {
            tempLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            tempLine.setAttribute('id', 'temp-connection-line');
            tempLine.setAttribute('class', 'connection-line');
            tempLine.setAttribute('stroke-dasharray', '5,5');
            svg.appendChild(tempLine);
        }
        
        const startEl = document.querySelector(`.network-device[data-id="${this.connectionStart.deviceId}"]`);
        if (startEl) {
            const rect = canvas.getBoundingClientRect();
            const scrollLeft = canvas.scrollLeft;
            const scrollTop = canvas.scrollTop;
            const startX = parseFloat(startEl.style.left || 0) + startEl.offsetWidth / 2 + 
                          this.getConnectionOffset(this.connectionStart.point, 'x', startEl.offsetWidth);
            const startY = parseFloat(startEl.style.top || 0) + startEl.offsetHeight / 2 + 
                          this.getConnectionOffset(this.connectionStart.point, 'y', startEl.offsetHeight);
            const endX = (e.clientX - rect.left + scrollLeft) / this.zoomLevel;
            const endY = (e.clientY - rect.top + scrollTop) / this.zoomLevel;
            
            tempLine.setAttribute('x1', startX);
            tempLine.setAttribute('y1', startY);
            tempLine.setAttribute('x2', endX);
            tempLine.setAttribute('y2', endY);
        }
    }

    clearTemporaryConnection() {
        const tempLine = document.getElementById('temp-connection-line');
        if (tempLine) {
            tempLine.remove();
        }
    }

    setMode(mode) {
        this.currentMode = mode;
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-mode="${mode}"]`).classList.add('active');
    }

    zoom(factor) {
        this.zoomLevel *= factor;
        this.zoomLevel = Math.max(0.5, Math.min(2, this.zoomLevel));
        this.applyZoom();
    }

    resetZoom() {
        this.zoomLevel = 1;
        this.applyZoom();
    }

    applyZoom() {
        document.querySelectorAll('.network-device').forEach(device => {
            device.style.transform = `scale(${this.zoomLevel})`;
            device.style.transformOrigin = 'top left';
        });
        this.updateConnections();
    }

    switchTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        document.getElementById(`${tab}Tab`).classList.add('active');

        if (tab === 'script') {
            this.updateScript();
        } else if (tab === 'connections') {
            this.updateConnectionsList();
        }
    }

    showDeviceProperties() {
        if (!this.selectedDevice) return;

        const propsDiv = document.getElementById('deviceProperties');
        const device = this.selectedDevice;
        
        let html = `
            <div class="property-group">
                <label>Device ID</label>
                <input type="text" value="${device.id}" readonly>
            </div>
            <div class="property-group">
                <label>Hostname</label>
                <input type="text" value="${device.properties.hostname}" 
                       data-property="hostname" onchange="networkBuilder.updateProperty('hostname', this.value)">
            </div>
            <div class="property-group">
                <label>IP Address</label>
                <input type="text" value="${device.properties.ip}" 
                       data-property="ip" onchange="networkBuilder.updateProperty('ip', this.value)">
            </div>
            <div class="property-group">
                <label>Subnet Mask</label>
                <input type="text" value="${device.properties.subnet}" 
                       data-property="subnet" onchange="networkBuilder.updateProperty('subnet', this.value)">
            </div>
        `;

        if (device.type === 'router') {
            html += `
                <div class="property-group">
                    <label>Routing Protocol</label>
                    <select data-property="routing" onchange="networkBuilder.updateProperty('routing', this.value)">
                        <option value="static" ${device.properties.routing === 'static' ? 'selected' : ''}>Static</option>
                        <option value="rip" ${device.properties.routing === 'rip' ? 'selected' : ''}>RIP</option>
                        <option value="ospf" ${device.properties.routing === 'ospf' ? 'selected' : ''}>OSPF</option>
                        <option value="eigrp" ${device.properties.routing === 'eigrp' ? 'selected' : ''}>EIGRP</option>
                    </select>
                </div>
            `;
        } else if (device.type === 'switch') {
            html += `
                <div class="property-group">
                    <label>VLANs (comma-separated)</label>
                    <input type="text" value="${device.properties.vlans.join(',')}" 
                           data-property="vlans" onchange="networkBuilder.updateProperty('vlans', this.value)">
                </div>
            `;
            // Add TP-Link Omada specific properties if it's a TP-Link switch
            if (device.model && device.model.includes('tplink-omada')) {
                html += `
                    <div class="property-group">
                        <label>Omada Mode</label>
                        <select data-property="omadaMode" onchange="networkBuilder.updateProperty('omadaMode', this.value)">
                            <option value="standalone" ${device.properties.omadaMode === 'standalone' ? 'selected' : ''}>Standalone</option>
                            <option value="controller-managed" ${device.properties.omadaMode === 'controller-managed' ? 'selected' : ''}>Controller Managed</option>
                        </select>
                    </div>
                    <div class="property-group">
                        <label>Omada Controller IP (if managed)</label>
                        <input type="text" value="${device.properties.omadaController || ''}" 
                               data-property="omadaController" onchange="networkBuilder.updateProperty('omadaController', this.value)"
                               placeholder="192.168.0.1">
                    </div>
                `;
            }
        } else if (device.type === 'facade') {
            html += `
                <div class="property-group">
                    <label>Structure Type</label>
                    <input type="text" value="${device.model}" readonly>
                </div>
                <div class="property-group">
                    <label>Capacity</label>
                    <input type="number" value="${device.properties.capacity}" 
                           data-property="capacity" onchange="networkBuilder.updateProperty('capacity', this.value)">
                </div>
            `;
        }

        propsDiv.innerHTML = html;
    }

    updateProperty(property, value) {
        if (this.selectedDevice) {
            if (property === 'vlans') {
                this.selectedDevice.properties[property] = value.split(',').map(v => v.trim());
            } else {
                this.selectedDevice.properties[property] = value;
            }
            this.updateScript();
        }
    }

    updateScript() {
        const format = document.getElementById('scriptFormat').value;
        const scriptElement = document.getElementById('generatedScript');
        
        let script = '';
        
        if (format === 'cisco') {
            script = this.generateCiscoScript();
        } else if (format === 'junos') {
            script = this.generateJunosScript();
        } else if (format === 'json') {
            script = this.generateJSONScript();
        } else if (format === 'yaml') {
            script = this.generateYAMLScript();
        }

        scriptElement.textContent = script;
    }

    generateCiscoScript() {
        let script = `! Network Configuration Script\n`;
        script += `! Department: ${this.departmentType}\n`;
        script += `! Generated: ${new Date().toLocaleString()}\n\n`;

        this.devices.forEach(device => {
            script += `! === ${device.label} (${device.type.toUpperCase()}) ===\n`;
            
            if (device.type === 'router') {
                script += `hostname ${device.properties.hostname}\n`;
                script += `interface GigabitEthernet0/0\n`;
                script += ` ip address ${device.properties.ip} ${device.properties.subnet}\n`;
                script += ` no shutdown\n`;
                if (device.properties.routing === 'ospf') {
                    script += `router ospf 1\n`;
                    script += ` network ${device.properties.ip} 0.0.0.0 area 0\n`;
                }
                script += `!\n\n`;
            } else if (device.type === 'switch') {
                // Check if it's a TP-Link Omada switch
                if (device.model && device.model.includes('tplink-omada')) {
                    script += `# TP-Link Omada Switch Configuration\n`;
                    script += `# Model: ${device.model}\n`;
                    script += `configure\n`;
                    script += `hostname ${device.properties.hostname}\n`;
                    script += `interface vlan 1\n`;
                    script += ` ip address ${device.properties.ip} ${device.properties.subnet}\n`;
                    script += ` exit\n`;
                    device.properties.vlans.forEach(vlan => {
                        if (vlan !== '1') {
                            script += `vlan ${vlan}\n`;
                            script += ` name VLAN${vlan}\n`;
                            script += ` exit\n`;
                        }
                    });
                    if (device.properties.omadaMode === 'controller-managed' && device.properties.omadaController) {
                        script += `# Omada Controller: ${device.properties.omadaController}\n`;
                    }
                    script += `end\n`;
                    script += `save\n`;
                    script += `!\n\n`;
                } else {
                    // Cisco-style configuration
                    script += `hostname ${device.properties.hostname}\n`;
                    device.properties.vlans.forEach(vlan => {
                        script += `vlan ${vlan}\n`;
                        script += ` name VLAN${vlan}\n`;
                    });
                    script += `interface vlan 1\n`;
                    script += ` ip address ${device.properties.ip} ${device.properties.subnet}\n`;
                    script += `!\n\n`;
                }
            } else {
                script += `hostname ${device.properties.hostname}\n`;
                script += `ip address ${device.properties.ip} ${device.properties.subnet}\n`;
                script += `default-gateway ${device.properties.gateway}\n`;
                script += `!\n\n`;
            }
        });

        script += `! === CONNECTIONS ===\n`;
        this.connections.forEach(conn => {
            const fromDevice = this.devices.find(d => d.id === conn.fromDevice);
            const toDevice = this.devices.find(d => d.id === conn.toDevice);
            if (fromDevice && toDevice) {
                script += `! ${fromDevice.label} <-> ${toDevice.label}\n`;
            }
        });

        return script;
    }

    generateJunosScript() {
        let script = `/* Network Configuration Script */\n`;
        script += `/* Department: ${this.departmentType} */\n\n`;

        this.devices.forEach(device => {
            script += `set system host-name ${device.properties.hostname}\n`;
            script += `set interfaces ge-0/0/0 unit 0 family inet address ${device.properties.ip}/${this.getCIDR(device.properties.subnet)}\n`;
        });

        return script;
    }

    generateJSONScript() {
        const config = {
            department: this.departmentType,
            generated: new Date().toISOString(),
            devices: this.devices.map(d => ({
                id: d.id,
                type: d.type,
                model: d.model,
                label: d.label,
                properties: d.properties,
                position: { x: d.x, y: d.y }
            })),
            connections: this.connections
        };
        return JSON.stringify(config, null, 2);
    }

    generateYAMLScript() {
        let yaml = `department: ${this.departmentType}\n`;
        yaml += `generated: ${new Date().toISOString()}\n`;
        yaml += `devices:\n`;
        this.devices.forEach(device => {
            yaml += `  - id: ${device.id}\n`;
            yaml += `    type: ${device.type}\n`;
            yaml += `    label: ${device.label}\n`;
            yaml += `    properties:\n`;
            Object.entries(device.properties).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    yaml += `      ${key}: [${value.join(', ')}]\n`;
                } else {
                    yaml += `      ${key}: ${value}\n`;
                }
            });
        });
        yaml += `connections:\n`;
        this.connections.forEach(conn => {
            yaml += `  - from: ${conn.fromDevice}\n`;
            yaml += `    to: ${conn.toDevice}\n`;
        });
        return yaml;
    }

    getCIDR(subnet) {
        const parts = subnet.split('.');
        let cidr = 0;
        parts.forEach(part => {
            const num = parseInt(part);
            cidr += (num >>> 0).toString(2).split('1').length - 1;
        });
        return cidr;
    }

    updateConnectionsList() {
        const listDiv = document.getElementById('connectionsList');
        if (this.connections.length === 0) {
            listDiv.innerHTML = '<p class="placeholder">No connections yet</p>';
            return;
        }

        let html = '';
        this.connections.forEach(conn => {
            const fromDevice = this.devices.find(d => d.id === conn.fromDevice);
            const toDevice = this.devices.find(d => d.id === conn.toDevice);
            if (fromDevice && toDevice) {
                html += `
                    <div class="connection-item">
                        <div class="connection-item-header">${fromDevice.label} ↔ ${toDevice.label}</div>
                        <div class="connection-item-details">
                            Type: ${conn.type} | Bandwidth: ${conn.bandwidth} Mbps<br>
                            ${fromDevice.label} (${conn.fromPoint}) → ${toDevice.label} (${conn.toPoint})
                        </div>
                    </div>
                `;
            }
        });
        listDiv.innerHTML = html;
    }

    exportScript() {
        this.updateScript();
        const scriptText = document.getElementById('generatedScript').textContent;
        const blob = new Blob([scriptText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `network-config-${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    }

    copyScript() {
        const scriptText = document.getElementById('generatedScript').textContent;
        navigator.clipboard.writeText(scriptText).then(() => {
            alert('Script copied to clipboard!');
        });
    }

    downloadScript() {
        this.exportScript();
    }

    saveProject() {
        const project = {
            devices: this.devices,
            connections: this.connections,
            departmentType: this.departmentType,
            zoomLevel: this.zoomLevel
        };
        const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `network-project-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    loadProject() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const project = JSON.parse(event.target.result);
                        this.devices = project.devices || [];
                        this.connections = project.connections || [];
                        this.departmentType = project.departmentType || 'all-system';
                        this.zoomLevel = project.zoomLevel || 1;
                        this.reloadCanvas();
                        alert('Project loaded successfully!');
                    } catch (error) {
                        alert('Error loading project: ' + error.message);
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }

    reloadCanvas() {
        const canvas = document.getElementById('networkCanvas');
        canvas.innerHTML = '';
        this.devices.forEach(device => {
            this.renderDevice(device);
        });
        this.applyZoom();
        this.updateConnections();
        this.updateScript();
        this.updateConnectionsList();
        if (this.departmentType) {
            document.getElementById('departmentSelect').value = this.departmentType;
        }
    }

    clearCanvas() {
        if (confirm('Are you sure you want to clear the canvas? All devices and connections will be removed.')) {
            this.devices = [];
            this.connections = [];
            const canvas = document.getElementById('networkCanvas');
            canvas.innerHTML = '';
            document.getElementById('connectionOverlay').innerHTML = '';
            this.deselectDevice();
            this.updateScript();
            this.updateConnectionsList();
            document.getElementById('deviceProperties').innerHTML = '<p class="placeholder">Select a device to configure</p>';
        }
    }
}

// Initialize the application
const networkBuilder = new NetworkBuilder();

// Make device items draggable
document.querySelectorAll('.device-item').forEach(item => {
    item.draggable = true;
});

// Handle connection overlay mouse events
document.getElementById('connectionOverlay').addEventListener('mousemove', (e) => {
    if (networkBuilder.isDrawingConnection) {
        networkBuilder.drawTemporaryConnection(e);
    }
});

// Animated Background Canvas
function initAnimatedBackground() {
    const canvas = document.getElementById('animatedBackground');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const particles = [];
    const particleCount = 50;
    
    // Set canvas size
    function resizeCanvas() {
        const container = canvas.parentElement;
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Create particles
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
            this.radius = Math.random() * 2 + 1;
            this.alpha = Math.random() * 0.5 + 0.2;
        }
        
        update() {
            this.x += this.vx;
            this.y += this.vy;
            
            if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
            if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
            
            this.x = Math.max(0, Math.min(canvas.width, this.x));
            this.y = Math.max(0, Math.min(canvas.height, this.y));
        }
        
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(59, 130, 246, ${this.alpha})`;
            ctx.fill();
        }
    }
    
    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
    
    // Animation loop
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw connections
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.1)';
        ctx.lineWidth = 1;
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 150) {
                    ctx.globalAlpha = (150 - distance) / 150 * 0.2;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }
        ctx.globalAlpha = 1;
        
        // Update and draw particles
        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });
        
        requestAnimationFrame(animate);
    }
    
    animate();
}

// Initialize animated background when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAnimatedBackground);
} else {
    initAnimatedBackground();
}

