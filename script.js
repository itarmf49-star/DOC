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
        this.deviceCounter = { router: 0, switch: 0, pc: 0, server: 0, laptop: 0, wireless: 0, firewall: 0, cloud: 0, facade: 0, ipbx: 0, ipphone: 0 };
        this.zoomLevel = 1;
        this.departmentType = 'all-system';
        this.cliEngine = null;
        this.packetFlows = [];
        this.activeConnections = new Set();
        
        this.initializeEventListeners();
        this.initializeCanvas();
        this.initializeCLI();
        this.initializeModals();
        this.initializeCheatSheet();
        this.startPacketFlowAnimation();
    }

    initializeEventListeners() {
        // Device palette drag - try to initialize, but don't block if not found
        const deviceItems = document.querySelectorAll('.device-item');
        if (deviceItems.length > 0) {
            deviceItems.forEach(item => {
                item.draggable = true;
                item.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('deviceType', item.dataset.type);
                    e.dataTransfer.setData('deviceModel', item.dataset.device);
                });
            });
        } else {
            console.warn('Device items not found. Will retry device items later, but continuing with buttons...');
            // Retry device items later, but continue with button initialization
            setTimeout(() => {
                const retryItems = document.querySelectorAll('.device-item');
                retryItems.forEach(item => {
                    item.draggable = true;
                    item.addEventListener('dragstart', (e) => {
                        e.dataTransfer.setData('deviceType', item.dataset.type);
                        e.dataTransfer.setData('deviceModel', item.dataset.device);
                    });
                });
            }, 100);
        }

        // Canvas drop
        const canvas = document.getElementById('networkCanvas');
        if (canvas) {
            canvas.addEventListener('dragover', (e) => {
                e.preventDefault();
            });

            canvas.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const deviceType = e.dataTransfer.getData('deviceType');
                const deviceModel = e.dataTransfer.getData('deviceModel');
                if (deviceType && deviceModel) {
                    const rect = canvas.getBoundingClientRect();
                    const scrollLeft = canvas.scrollLeft;
                    const scrollTop = canvas.scrollTop;
                    const x = ((e.clientX - rect.left + scrollLeft) / this.zoomLevel);
                    const y = ((e.clientY - rect.top + scrollTop) / this.zoomLevel);
                    this.addDevice(deviceType, deviceModel, x, y);
                }
            });
            
            // Canvas click
            canvas.addEventListener('click', (e) => {
                if (this.currentMode === 'delete') {
                    const device = e.target.closest('.network-device');
                    if (device && device.dataset.id) {
                        this.deleteDevice(device.dataset.id);
                    }
                } else if (this.currentMode === 'select') {
                    const device = e.target.closest('.network-device');
                    if (device && device.dataset.id) {
                        this.selectDevice(device.dataset.id);
                    } else {
                        this.deselectDevice();
                    }
                }
            });
        } else {
            console.warn('Canvas element not found, but continuing with button initialization');
        }

        // Mode buttons
        const selectMode = document.getElementById('selectMode');
        const connectMode = document.getElementById('connectMode');
        const deleteMode = document.getElementById('deleteMode');
        
        if (selectMode) selectMode.addEventListener('click', () => this.setMode('select'));
        if (connectMode) connectMode.addEventListener('click', () => this.setMode('connect'));
        if (deleteMode) deleteMode.addEventListener('click', () => this.setMode('delete'));

        // Zoom buttons
        const zoomIn = document.getElementById('zoomIn');
        const zoomOut = document.getElementById('zoomOut');
        const resetZoom = document.getElementById('resetZoom');
        
        if (zoomIn) zoomIn.addEventListener('click', () => this.zoom(1.1));
        if (zoomOut) zoomOut.addEventListener('click', () => this.zoom(0.9));
        if (resetZoom) resetZoom.addEventListener('click', () => this.resetZoom());

        // Department select
        const deptSelect = document.getElementById('departmentSelect');
        if (deptSelect) {
            deptSelect.addEventListener('change', (e) => {
                this.departmentType = e.target.value;
                this.updateScript();
            });
        }

        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                if (tab) this.switchTab(tab);
            });
        });

        // Action buttons
        const exportBtn = document.getElementById('exportScript');
        const clearBtn = document.getElementById('clearCanvas');
        const saveBtn = document.getElementById('saveProject');
        const loadBtn = document.getElementById('loadProject');
        const copyBtn = document.getElementById('copyScript');
        const downloadBtn = document.getElementById('downloadScript');
        const scriptFormat = document.getElementById('scriptFormat');
        
        if (exportBtn) exportBtn.addEventListener('click', () => this.exportScript());
        if (clearBtn) clearBtn.addEventListener('click', () => this.clearCanvas());
        if (saveBtn) saveBtn.addEventListener('click', () => this.saveProject());
        if (loadBtn) loadBtn.addEventListener('click', () => this.loadProject());
        if (copyBtn) copyBtn.addEventListener('click', () => this.copyScript());
        if (downloadBtn) downloadBtn.addEventListener('click', () => this.downloadScript());
        if (scriptFormat) scriptFormat.addEventListener('change', () => this.updateScript());
    }

    initializeCanvas() {
        const canvas = document.getElementById('networkCanvas');
        if (canvas) {
            canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
            canvas.addEventListener('scroll', () => this.updateConnections());
        } else {
            console.warn('Canvas not found for mouse event initialization');
        }
        
        // Attach global mouse events for dragging (works even if mouse leaves canvas)
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    }

    handleMouseDown(e) {
        // Don't handle if clicking on a device (device handles its own events)
        if (e.target.closest('.network-device')) {
            return;
        }
        
        const canvas = document.getElementById('networkCanvas');
        if (this.currentMode === 'connect') {
            const connectionPoint = e.target.closest('.connection-point');
            if (connectionPoint) {
                e.stopPropagation();
                this.isDrawingConnection = true;
                const deviceElement = connectionPoint.closest('.network-device');
                this.connectionStart = {
                    deviceId: deviceElement.dataset.id,
                    point: connectionPoint.dataset.side
                };
                canvas.classList.add('drawing-connection');
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

        // Use real device images if available
        let iconHTML = '';
        if (typeof getDeviceImage === 'function') {
            const deviceImage = getDeviceImage(device.type, device.model);
            if (deviceImage && deviceImage.image) {
                iconHTML = `<div class="network-device-icon svg-icon real-device-icon">${deviceImage.image}</div>`;
            }
        }
        
        // Fallback to SVG icons
        if (!iconHTML && typeof getDeviceIcon === 'function') {
            const svgIcon = getDeviceIcon(device.type, device.model);
            if (svgIcon) {
                iconHTML = `<div class="network-device-icon svg-icon">${svgIcon}</div>`;
            }
        }
        
        // Final fallback to emoji icons
        if (!iconHTML) {
            const icons = {
                router: '🔄',
                switch: '🔀',
                pc: '💻',
                server: '🖥️',
                laptop: '📱',
                wireless: '📡',
                firewall: '🛡️',
                cloud: '☁️',
                facade: '🏭',
                ipbx: '📞',
                ipphone: '☎️'
            };
            iconHTML = `<div class="network-device-icon">${icons[device.type] || '📦'}</div>`;
        }

        deviceElement.innerHTML = `
            ${iconHTML}
            <div class="network-device-label">${device.label}</div>
            <div class="connection-point top" data-side="top"></div>
            <div class="connection-point bottom" data-side="bottom"></div>
            <div class="connection-point left" data-side="left"></div>
            <div class="connection-point right" data-side="right"></div>
        `;
        
        // Add double-click to show device info
        deviceElement.addEventListener('dblclick', () => {
            this.showDeviceInfo(device);
        });

        // Handle device interaction - allow both selection and dragging
        deviceElement.addEventListener('mousedown', (e) => {
            e.stopPropagation(); // Prevent canvas from handling this
            
            if (this.currentMode === 'select') {
                this.selectDevice(device.id);
                // Start dragging
                this.draggedDevice = deviceElement;
                const canvas = document.getElementById('networkCanvas');
                const rect = canvas.getBoundingClientRect();
                const scrollLeft = canvas.scrollLeft;
                const scrollTop = canvas.scrollTop;
                const deviceX = parseFloat(deviceElement.style.left || 0) * this.zoomLevel;
                const deviceY = parseFloat(deviceElement.style.top || 0) * this.zoomLevel;
                this.offsetX = (e.clientX - rect.left + scrollLeft) - deviceX;
                this.offsetY = (e.clientY - rect.top + scrollTop) - deviceY;
            }
        });
        
        // Make device draggable
        deviceElement.style.cursor = 'move';

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
            this.showHardwareView();
            if (this.cliEngine && typeof this.cliEngine.setDevice === 'function') {
                try {
                    this.cliEngine.setDevice(this.selectedDevice);
                } catch (error) {
                    console.warn('Error setting device in CLI:', error);
                }
            }
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
                
                // Apply cable type styling
                const cableType = conn.cableType || 'straight-through';
                const cableInfo = this.getCableInfo(cableType);
                line.setAttribute('data-cable-type', cableType);
                line.style.stroke = cableInfo.color;
                line.style.strokeWidth = '3';
                line.setAttribute('title', `${cableInfo.name}: ${cableInfo.description}`);
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
        if (!propsDiv) {
            console.warn('Device properties div not found');
            return;
        }
        
        const device = this.selectedDevice;
        
        let html = `
            <div class="property-group">
                <label>Device ID</label>
                <input type="text" value="${device.id}" readonly>
            </div>
            <div class="property-group">
                <label>Hostname</label>
                <input type="text" value="${device.properties.hostname}" 
                       data-property="hostname" class="property-input">
            </div>
            <div class="property-group">
                <label>IP Address</label>
                <input type="text" value="${device.properties.ip}" 
                       data-property="ip" class="property-input">
            </div>
            <div class="property-group">
                <label>Subnet Mask</label>
                <input type="text" value="${device.properties.subnet}" 
                       data-property="subnet" class="property-input">
            </div>
        `;

        if (device.type === 'router') {
            html += `
                <div class="property-group">
                    <label>Routing Protocol</label>
                    <select data-property="routing" class="property-input">
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
                           data-property="vlans" class="property-input">
                </div>
            `;
            // Add TP-Link Omada specific properties if it's a TP-Link switch
            if (device.model && device.model.includes('tplink-omada')) {
                html += `
                    <div class="property-group">
                        <label>Omada Mode</label>
                        <select data-property="omadaMode" class="property-input">
                            <option value="standalone" ${device.properties.omadaMode === 'standalone' ? 'selected' : ''}>Standalone</option>
                            <option value="controller-managed" ${device.properties.omadaMode === 'controller-managed' ? 'selected' : ''}>Controller Managed</option>
                        </select>
                    </div>
                    <div class="property-group">
                        <label>Omada Controller IP (if managed)</label>
                        <input type="text" value="${device.properties.omadaController || ''}" 
                               data-property="omadaController" class="property-input"
                               placeholder="192.168.0.1">
                    </div>
                `;
            }
        } else if (device.type === 'ipbx') {
            html += `
                <div class="property-group">
                    <label>SIP Port</label>
                    <input type="text" value="${device.properties.sipPort || '5060'}" 
                           data-property="sipPort" class="property-input">
                </div>
                <div class="property-group">
                    <label>Codec</label>
                    <select data-property="codec" class="property-input">
                        <option value="G.711" ${device.properties.codec === 'G.711' ? 'selected' : ''}>G.711</option>
                        <option value="G.729" ${device.properties.codec === 'G.729' ? 'selected' : ''}>G.729</option>
                        <option value="G.722" ${device.properties.codec === 'G.722' ? 'selected' : ''}>G.722</option>
                    </select>
                </div>
            `;
        } else if (device.type === 'ipphone') {
            html += `
                <div class="property-group">
                    <label>Extension</label>
                    <input type="text" value="${device.properties.extension || ''}" 
                           data-property="extension" class="property-input"
                           placeholder="1001">
                </div>
                <div class="property-group">
                    <label>SIP Server</label>
                    <input type="text" value="${device.properties.sipServer || ''}" 
                           data-property="sipServer" class="property-input"
                           placeholder="192.168.1.100">
                </div>
                <div class="property-group">
                    <label>SIP Username</label>
                    <input type="text" value="${device.properties.sipUsername || ''}" 
                           data-property="sipUsername" class="property-input">
                </div>
                <div class="property-group">
                    <label>SIP Password</label>
                    <input type="password" value="${device.properties.sipPassword || ''}" 
                           data-property="sipPassword" class="property-input">
                </div>
                <div class="property-group">
                    <label>Codec</label>
                    <select data-property="codec" class="property-input">
                        <option value="G.711" ${device.properties.codec === 'G.711' ? 'selected' : ''}>G.711</option>
                        <option value="G.729" ${device.properties.codec === 'G.729' ? 'selected' : ''}>G.729</option>
                        <option value="G.722" ${device.properties.codec === 'G.722' ? 'selected' : ''}>G.722</option>
                    </select>
                </div>
            `;
        } else if (device.type === 'facade') {
            html += `
                <div class="property-group">
                    <label>Structure Type</label>
                    <input type="text" value="${device.model}" readonly>
                </div>
                <div class="property-group">
                    <label>Capacity</label>
                    <input type="number" value="${device.properties.capacity}" 
                           data-property="capacity" class="property-input">
                </div>
            `;
        }

        propsDiv.innerHTML = html;
        
        // Attach event listeners using event delegation
        const propertyInputs = propsDiv.querySelectorAll('.property-input, [data-property]');
        propertyInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                const property = e.target.dataset.property || e.target.getAttribute('data-property');
                if (property) {
                    this.updateProperty(property, e.target.value);
                }
            });
        });
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

    exportAsPDF() {
        // Create PDF content
        const content = this.generatePDFContent();
        
        // Create a new window for PDF
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Please allow popups to export PDF');
            return;
        }
        
        printWindow.document.write(content);
        printWindow.document.close();
        
        setTimeout(() => {
            printWindow.print();
        }, 250);
    }

    generatePDFContent() {
        let html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Network Project - IT Hadrami Packet Tracker</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 2rem; background: white; color: #333; }
                    h1 { color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 0.5rem; }
                    h2 { color: #1e293b; margin-top: 2rem; }
                    .device-list { margin: 1rem 0; }
                    .device-item { padding: 0.75rem; border-bottom: 1px solid #ddd; background: #f8f9fa; margin-bottom: 0.5rem; border-radius: 0.25rem; }
                    .script-output { background: #1e293b; color: #00ff00; padding: 1rem; border-radius: 0.5rem; font-family: 'Courier New', monospace; white-space: pre-wrap; overflow-x: auto; }
                    .info-box { background: #e3f2fd; padding: 1rem; border-radius: 0.5rem; margin: 1rem 0; }
                    hr { border: none; border-top: 2px solid #ddd; margin: 2rem 0; }
                </style>
            </head>
            <body>
                <h1>🌐 IT Hadrami Packet Tracker</h1>
                <h2>Network Project Report</h2>
                <div class="info-box">
                    <p><strong>Department:</strong> ${this.departmentType}</p>
                    <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
                    <p><strong>Total Devices:</strong> ${this.devices.length}</p>
                    <p><strong>Total Connections:</strong> ${this.connections.length}</p>
                </div>
                <h2>Devices Configuration</h2>
                <div class="device-list">
        `;
        
        this.devices.forEach(device => {
            html += `
                <div class="device-item">
                    <strong>${device.label}</strong> (${device.type.toUpperCase()})<br>
                    <small>IP: ${device.properties.ip} | Subnet: ${device.properties.subnet} | Hostname: ${device.properties.hostname}</small>
                </div>
            `;
        });
        
        html += `
                </div>
                <h2>Network Connections</h2>
                <div class="device-list">
        `;
        
        this.connections.forEach(conn => {
            const fromDevice = this.devices.find(d => d.id === conn.fromDevice);
            const toDevice = this.devices.find(d => d.id === conn.toDevice);
            if (fromDevice && toDevice) {
                html += `
                    <div class="device-item">
                        <strong>${fromDevice.label}</strong> ↔ <strong>${toDevice.label}</strong><br>
                        <small>Cable Type: ${conn.cableType || 'ethernet'} | Bandwidth: ${conn.bandwidth || '1000'} Mbps</small>
                    </div>
                `;
            }
        });
        
        html += `
                </div>
                <h2>Configuration Script</h2>
                <pre class="script-output">${document.getElementById('generatedScript')?.textContent || 'No script generated'}</pre>
                <hr>
                <p style="text-align: center; color: #666; margin-top: 2rem;">
                    Created with <strong>IT Hadrami Packet Tracker</strong><br>
                    RAK Network Learning Portal<br>
                    © ${new Date().getFullYear()} IT HADRAMI
                </p>
            </body>
            </html>
        `;
        
        return html;
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

    initializeCLI() {
        // Wait for CLIEngine to be available
        if (typeof CLIEngine !== 'undefined') {
            try {
                this.cliEngine = new CLIEngine(this);
            } catch (error) {
                console.warn('CLI Engine initialization failed:', error);
            }
        } else {
            // Retry after a short delay
            setTimeout(() => {
                if (typeof CLIEngine !== 'undefined') {
                    this.cliEngine = new CLIEngine(this);
                }
            }, 100);
        }
    }

    initializeModals() {
        const helpButton = document.getElementById('helpButton');
        const closeModal = document.getElementById('closeModal');
        const modal = document.getElementById('instructionModal');
        const showEducationBtn = document.getElementById('showEducationWindow');
        const closeEducationBtn = document.getElementById('closeEducationWindow');
        const educationWindow = document.getElementById('educationWindow');

        if (helpButton) {
            helpButton.addEventListener('click', () => {
                this.showHelpModal();
            });
        }

        if (closeModal && modal) {
            closeModal.addEventListener('click', () => {
                modal.classList.remove('active');
            });
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        }

        // Education Window
        if (showEducationBtn && educationWindow) {
            showEducationBtn.addEventListener('click', () => {
                this.showEducationWindow();
            });
        }

        if (closeEducationBtn && educationWindow) {
            closeEducationBtn.addEventListener('click', () => {
                educationWindow.classList.remove('active');
            });
            educationWindow.addEventListener('click', (e) => {
                if (e.target === educationWindow) {
                    educationWindow.classList.remove('active');
                }
            });
        }

        // Education tabs
        document.querySelectorAll('.edu-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                document.querySelectorAll('.edu-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.edu-tab-content').forEach(c => c.classList.remove('active'));
                tab.classList.add('active');
                const content = document.getElementById(`edu-${tabName}`);
                if (content) content.classList.add('active');
            });
        });
    }

    initializeCheatSheet() {
        const toggleBtn = document.getElementById('toggleCheatSheetBtn');
        const closeBtn = document.getElementById('toggleCheatSheet');
        const cheatSheet = document.getElementById('cheatSheet');

        if (toggleBtn && cheatSheet) {
            toggleBtn.addEventListener('click', () => {
                cheatSheet.classList.toggle('open');
            });
        }

        if (closeBtn && cheatSheet) {
            closeBtn.addEventListener('click', () => {
                cheatSheet.classList.remove('open');
            });
        }
    }

    showDeviceInfo(device) {
        const modal = document.getElementById('instructionModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');

        if (!modal || !modalTitle || !modalBody) return;

        const deviceInfo = this.getDeviceInfo(device);
        modalTitle.textContent = `${device.label} - ${deviceInfo.name}`;
        modalBody.innerHTML = deviceInfo.html;
        modal.classList.add('active');
    }

    getDeviceInfo(device) {
        const info = {
            switch: {
                name: 'Network Switch',
                html: `
                    <h3>Description</h3>
                    <p>A network switch connects devices on a local area network (LAN) and forwards data packets between them.</p>
                    <h3>Technical Specifications</h3>
                    <ul>
                        <li>Type: Layer 2/3 Switch</li>
                        <li>Ports: 8-48 ports (varies by model)</li>
                        <li>Speed: 10/100/1000 Mbps or 10 Gbps</li>
                        <li>Features: VLAN support, STP, Port Security</li>
                    </ul>
                    <h3>Common Uses</h3>
                    <ul>
                        <li>Connecting multiple devices in a network</li>
                        <li>Creating VLANs for network segmentation</li>
                        <li>Providing high-speed data transfer</li>
                    </ul>
                `
            },
            router: {
                name: 'Network Router',
                html: `
                    <h3>Description</h3>
                    <p>A router forwards data packets between computer networks, performing traffic directing functions on the Internet.</p>
                    <h3>Technical Specifications</h3>
                    <ul>
                        <li>Type: Layer 3 Device</li>
                        <li>Interfaces: Multiple Ethernet/WAN ports</li>
                        <li>Routing Protocols: OSPF, EIGRP, BGP, RIP</li>
                        <li>Features: NAT, Firewall, VPN support</li>
                    </ul>
                `
            },
            ipbx: {
                name: 'IPBX Server',
                html: `
                    <h3>Description</h3>
                    <p>An IP Private Branch Exchange (IPBX) is a telephone switching system that manages voice calls over IP networks.</p>
                    <h3>Technical Specifications</h3>
                    <ul>
                        <li>Protocol: SIP (Session Initiation Protocol)</li>
                        <li>Codecs: G.711, G.729, G.722</li>
                        <li>Features: Call routing, Voicemail, IVR</li>
                        <li>Capacity: 10-1000+ extensions</li>
                    </ul>
                    <h3>Configuration</h3>
                    <p>Configure SIP trunks, extensions, and call routing rules through the web interface or CLI.</p>
                `
            },
            ipphone: {
                name: 'IP Phone',
                html: `
                    <h3>Description</h3>
                    <p>An IP phone uses Voice over IP (VoIP) technology to make and receive calls over an IP network.</p>
                    <h3>Technical Specifications</h3>
                    <ul>
                        <li>Protocol: SIP</li>
                        <li>Display: LCD screen</li>
                        <li>Features: Call hold, transfer, conference</li>
                        <li>Power: PoE or AC adapter</li>
                    </ul>
                `
            }
        };

        return info[device.type] || {
            name: device.type.toUpperCase(),
            html: `<p>Device information for ${device.label}</p>`
        };
    }

    showHelpModal() {
        const modal = document.getElementById('instructionModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');

        if (!modal || !modalTitle || !modalBody) return;

        modalTitle.textContent = 'IT Hadrami Packet Tracker - Help';
        modalBody.innerHTML = `
            <h3>Getting Started</h3>
            <p>Welcome to IT Hadrami Packet Tracker! This is a professional network simulation tool.</p>
            <h3>Basic Operations</h3>
            <ul>
                <li><strong>Add Device:</strong> Drag a device from the palette to the canvas</li>
                <li><strong>Move Device:</strong> Click and drag a device to reposition it</li>
                <li><strong>Connect Devices:</strong> Use Connect mode and click connection points</li>
                <li><strong>Configure Device:</strong> Select a device and use the Properties or CLI tab</li>
            </ul>
            <h3>CLI Terminal</h3>
            <p>Use the CLI Terminal tab to configure devices using command-line interface. Type "help" in the terminal for available commands.</p>
            <h3>Hardware View</h3>
            <p>View physical ports and hardware specifications of selected devices.</p>
            <h3>Learning Center</h3>
            <p>Click the "📚 Learning Center" button in the header to access comprehensive guides on devices, cables, commands, and programming examples.</p>
        `;
        modal.classList.add('active');
    }

    showEducationWindow() {
        const educationWindow = document.getElementById('educationWindow');
        if (!educationWindow) return;

        // Populate devices tab
        this.populateDevicesEducation();
        
        // Populate cables tab
        this.populateCablesEducation();
        
        // Populate commands tab
        this.populateCommandsEducation();
        
        // Populate programming tab
        this.populateProgrammingEducation();

        educationWindow.classList.add('active');
    }

    populateDevicesEducation() {
        const container = document.querySelector('#edu-devices .device-education-grid');
        if (!container) return;

        const devices = [
            {
                type: 'router',
                name: 'Router',
                icon: '🔄',
                description: 'A router connects multiple networks and routes data packets between them. It operates at Layer 3 (Network Layer) of the OSI model.',
                features: [
                    'Inter-network routing',
                    'IP address assignment',
                    'NAT (Network Address Translation)',
                    'Firewall capabilities',
                    'VPN support'
                ],
                ports: 'Multiple Ethernet ports, Serial ports for WAN',
                useCases: [
                    'Connecting LAN to WAN',
                    'Internet gateway',
                    'Inter-VLAN routing',
                    'Site-to-site VPN'
                ]
            },
            {
                type: 'switch',
                name: 'Switch',
                icon: '🔀',
                description: 'A switch connects devices on a local area network (LAN) and forwards data packets between them. It operates at Layer 2 (Data Link Layer).',
                features: [
                    'MAC address learning',
                    'VLAN support',
                    'Port security',
                    'STP (Spanning Tree Protocol)',
                    'Link aggregation'
                ],
                ports: '8-48 Ethernet ports (varies by model)',
                useCases: [
                    'Connecting multiple devices in a LAN',
                    'Creating VLANs',
                    'Network segmentation',
                    'High-speed data transfer'
                ]
            },
            {
                type: 'pc',
                name: 'PC / Computer',
                icon: '💻',
                description: 'A personal computer or workstation that connects to the network to access resources and services.',
                features: [
                    'Network interface card (NIC)',
                    'IP configuration',
                    'DHCP client',
                    'DNS resolution'
                ],
                ports: 'Ethernet port (RJ-45)',
                useCases: [
                    'End-user workstation',
                    'File sharing',
                    'Internet access',
                    'Application hosting'
                ]
            },
            {
                type: 'server',
                name: 'Server',
                icon: '🖥️',
                description: 'A powerful computer that provides services, resources, or data to other devices on the network.',
                features: [
                    'High-performance hardware',
                    'Multiple network interfaces',
                    'Service hosting (Web, DNS, DHCP, etc.)',
                    'Data storage and backup'
                ],
                ports: 'Multiple Ethernet ports',
                useCases: [
                    'Web server',
                    'File server',
                    'Database server',
                    'DNS/DHCP server'
                ]
            },
            {
                type: 'ipbx',
                name: 'IPBX / VoIP Server',
                icon: '☎️',
                description: 'An IP Private Branch Exchange manages VoIP calls and provides telephony services over IP networks.',
                features: [
                    'SIP protocol support',
                    'Call routing',
                    'Voicemail',
                    'Conference calling',
                    'Integration with PSTN'
                ],
                ports: 'Ethernet ports, SIP trunk connections',
                useCases: [
                    'Business phone system',
                    'VoIP call management',
                    'Unified communications',
                    'Call center operations'
                ]
            },
            {
                type: 'ipphone',
                name: 'IP Phone',
                icon: '📞',
                description: 'A telephone that uses Voice over IP (VoIP) technology to make calls over an IP network instead of traditional phone lines.',
                features: [
                    'SIP client',
                    'HD voice quality',
                    'LCD display',
                    'Multiple line support'
                ],
                ports: 'Ethernet port (RJ-45)',
                useCases: [
                    'Business communications',
                    'VoIP calling',
                    'Remote work',
                    'Cost-effective telephony'
                ]
            }
        ];

        container.innerHTML = devices.map(device => `
            <div class="device-edu-card">
                <div class="device-edu-header">
                    <span class="device-edu-icon">${device.icon}</span>
                    <h3>${device.name}</h3>
                </div>
                <p class="device-edu-description">${device.description}</p>
                <div class="device-edu-section">
                    <h4>Key Features:</h4>
                    <ul>
                        ${device.features.map(f => `<li>${f}</li>`).join('')}
                    </ul>
                </div>
                <div class="device-edu-section">
                    <h4>Ports:</h4>
                    <p>${device.ports}</p>
                </div>
                <div class="device-edu-section">
                    <h4>Common Use Cases:</h4>
                    <ul>
                        ${device.useCases.map(u => `<li>${u}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `).join('');
    }

    populateCablesEducation() {
        const container = document.querySelector('#edu-cables .cable-education-grid');
        if (!container) return;

        const cableTypes = ['straight-through', 'crossover', 'serial', 'fiber', 'console'];
        
        container.innerHTML = cableTypes.map(cableType => {
            const info = this.getCableInfo(cableType);
            return `
                <div class="cable-edu-card" style="border-left: 4px solid ${info.color}">
                    <div class="cable-edu-header">
                        <span class="cable-edu-icon">${info.icon}</span>
                        <h3>${info.name}</h3>
                    </div>
                    <p class="cable-edu-description">${info.description}</p>
                    <div class="cable-edu-section">
                        <h4>Pinout:</h4>
                        <p>${info.pinout}</p>
                    </div>
                    <div class="cable-edu-section">
                        <h4>When to Use:</h4>
                        <ul>
                            ${info.useCases.map(u => `<li>${u}</li>`).join('')}
                        </ul>
                    </div>
                    <div class="cable-edu-action">
                        <strong>Action:</strong> ${this.getCableAction(cableType)}
                    </div>
                </div>
            `;
        }).join('');
    }

    getCableAction(cableType) {
        const actions = {
            'straight-through': 'Automatically selected when connecting different device types (PC↔Switch, Router↔Switch). Ensures proper signal transmission between dissimilar devices.',
            'crossover': 'Automatically selected when connecting similar devices (Switch↔Switch, PC↔PC). Crosses transmit and receive pairs internally.',
            'serial': 'Used for WAN connections between routers. Requires DCE/DTE configuration. One router must be configured as DCE (provides clocking).',
            'fiber': 'Used for high-speed, long-distance connections. Immune to electromagnetic interference. Requires fiber-compatible ports on devices.',
            'console': 'Used for initial device configuration. Connect to console port for out-of-band management. Does not require network connectivity.'
        };
        return actions[cableType] || 'Standard network connection.';
    }

    populateCommandsEducation() {
        const container = document.querySelector('#edu-commands .command-education-content');
        if (!container) return;

        container.innerHTML = `
            <div class="command-category">
                <h3>🔄 Router Commands (Cisco IOS)</h3>
                <div class="command-list">
                    <div class="command-item">
                        <code>enable</code>
                        <p>Enter privileged EXEC mode (requires password)</p>
                    </div>
                    <div class="command-item">
                        <code>configure terminal</code> or <code>conf t</code>
                        <p>Enter global configuration mode</p>
                    </div>
                    <div class="command-item">
                        <code>interface gigabitethernet 0/0</code> or <code>int g0/0</code>
                        <p>Enter interface configuration mode</p>
                    </div>
                    <div class="command-item">
                        <code>ip address 192.168.1.1 255.255.255.0</code>
                        <p>Configure IP address and subnet mask</p>
                    </div>
                    <div class="command-item">
                        <code>no shutdown</code>
                        <p>Enable the interface</p>
                    </div>
                    <div class="command-item">
                        <code>router ospf 1</code>
                        <p>Enable OSPF routing protocol</p>
                    </div>
                    <div class="command-item">
                        <code>network 192.168.1.0 0.0.0.255 area 0</code>
                        <p>Advertise network in OSPF</p>
                    </div>
                    <div class="command-item">
                        <code>show ip route</code>
                        <p>Display routing table</p>
                    </div>
                    <div class="command-item">
                        <code>show ip interface brief</code>
                        <p>Display interface status</p>
                    </div>
                </div>
            </div>

            <div class="command-category">
                <h3>🔀 Switch Commands (Cisco IOS)</h3>
                <div class="command-list">
                    <div class="command-item">
                        <code>vlan 10</code>
                        <p>Create VLAN 10</p>
                    </div>
                    <div class="command-item">
                        <code>name Sales</code>
                        <p>Name the VLAN</p>
                    </div>
                    <div class="command-item">
                        <code>interface range fastethernet 0/1-10</code>
                        <p>Configure multiple interfaces</p>
                    </div>
                    <div class="command-item">
                        <code>switchport mode access</code>
                        <p>Set port as access port</p>
                    </div>
                    <div class="command-item">
                        <code>switchport access vlan 10</code>
                        <p>Assign port to VLAN 10</p>
                    </div>
                    <div class="command-item">
                        <code>switchport mode trunk</code>
                        <p>Set port as trunk port</p>
                    </div>
                    <div class="command-item">
                        <code>switchport trunk allowed vlan 10,20,30</code>
                        <p>Allow specific VLANs on trunk</p>
                    </div>
                    <div class="command-item">
                        <code>show vlan</code>
                        <p>Display VLAN information</p>
                    </div>
                    <div class="command-item">
                        <code>show mac address-table</code>
                        <p>Display MAC address table</p>
                    </div>
                </div>
            </div>

            <div class="command-category">
                <h3>☎️ IPBX / VoIP Commands</h3>
                <div class="command-list">
                    <div class="command-item">
                        <code>sip register</code>
                        <p>Register SIP extension</p>
                    </div>
                    <div class="command-item">
                        <code>extension 1001</code>
                        <p>Configure extension number</p>
                    </div>
                    <div class="command-item">
                        <code>sip server 192.168.1.10</code>
                        <p>Set SIP server address</p>
                    </div>
                    <div class="command-item">
                        <code>codec g711</code>
                        <p>Set audio codec (G.711, G.729, etc.)</p>
                    </div>
                    <div class="command-item">
                        <code>show sip status</code>
                        <p>Display SIP registration status</p>
                    </div>
                </div>
            </div>
        `;
    }

    populateProgrammingEducation() {
        const container = document.querySelector('#edu-programming .programming-education-content');
        if (!container) return;

        container.innerHTML = `
            <div class="programming-example">
                <h3>🔄 Router Configuration Example</h3>
                <div class="code-example">
                    <pre><code>Router> enable
Router# configure terminal
Router(config)# hostname R1
R1(config)# interface gigabitethernet 0/0
R1(config-if)# ip address 192.168.1.1 255.255.255.0
R1(config-if)# no shutdown
R1(config-if)# exit
R1(config)# router ospf 1
R1(config-router)# network 192.168.1.0 0.0.0.255 area 0
R1(config-router)# end
R1# copy running-config startup-config</code></pre>
                </div>
                <p><strong>Explanation:</strong> This configures a router with IP address 192.168.1.1/24 on interface G0/0, enables OSPF routing, and saves the configuration.</p>
            </div>

            <div class="programming-example">
                <h3>🔀 Switch VLAN Configuration Example</h3>
                <div class="code-example">
                    <pre><code>Switch> enable
Switch# configure terminal
Switch(config)# vlan 10
Switch(config-vlan)# name Sales
Switch(config-vlan)# exit
Switch(config)# vlan 20
Switch(config-vlan)# name Marketing
Switch(config-vlan)# exit
Switch(config)# interface range fastethernet 0/1-10
Switch(config-if-range)# switchport mode access
Switch(config-if-range)# switchport access vlan 10
Switch(config-if-range)# exit
Switch(config)# interface fastethernet 0/24
Switch(config-if)# switchport mode trunk
Switch(config-if)# switchport trunk allowed vlan 10,20
Switch(config-if)# end
Switch# show vlan</code></pre>
                </div>
                <p><strong>Explanation:</strong> Creates VLANs 10 (Sales) and 20 (Marketing), assigns ports 1-10 to VLAN 10, and configures port 24 as a trunk carrying both VLANs.</p>
            </div>

            <div class="programming-example">
                <h3>☎️ IP Phone Configuration Example</h3>
                <div class="code-example">
                    <pre><code>IPPhone> configure
IPPhone(config)# extension 1001
IPPhone(config)# sip server 192.168.1.10
IPPhone(config)# sip username 1001
IPPhone(config)# sip password mypassword
IPPhone(config)# codec g711
IPPhone(config)# register
IPPhone# show sip status</code></pre>
                </div>
                <p><strong>Explanation:</strong> Configures an IP phone with extension 1001, connects to SIP server at 192.168.1.10, sets authentication, and registers with the server.</p>
            </div>

            <div class="programming-example">
                <h3>🌐 Network Topology Example</h3>
                <div class="code-example">
                    <pre><code># Network Design:
# Router1 (192.168.1.1) ←→ Switch1 ←→ PC1 (192.168.1.10)
#                              ↓
#                         Switch2 ←→ Server1 (192.168.1.20)
#                              ↓
#                         IP Phone (Extension 1001)

# Configuration Steps:
# 1. Configure Router1 with IP 192.168.1.1/24
# 2. Configure Switch1 with VLAN 10
# 3. Assign PC1 and Server1 to VLAN 10
# 4. Configure IP Phone with SIP server
# 5. Test connectivity with ping</code></pre>
                </div>
                <p><strong>Explanation:</strong> A complete network setup showing how devices connect and communicate in a typical office network.</p>
            </div>
        `;
    }

    showHardwareView() {
        const hardwareView = document.getElementById('hardwareView');
        if (!hardwareView || !this.selectedDevice) return;

        const device = this.selectedDevice;
        let html = `<div class="hardware-specs">
            <h4>Device Specifications</h4>
            <div class="hardware-spec-item">
                <span>Type:</span>
                <span>${device.type.toUpperCase()}</span>
            </div>
            <div class="hardware-spec-item">
                <span>Model:</span>
                <span>${device.model || 'N/A'}</span>
            </div>
            <div class="hardware-spec-item">
                <span>Hostname:</span>
                <span>${device.properties.hostname}</span>
            </div>
            <div class="hardware-spec-item">
                <span>IP Address:</span>
                <span>${device.properties.ip}</span>
            </div>
        </div>`;

        // Add port grid for switches and routers
        if (device.type === 'switch' || device.type === 'router') {
            const portCount = device.type === 'switch' ? 8 : 4;
            html += `<div class="hardware-port-grid">`;
            for (let i = 1; i <= portCount; i++) {
                const portLabel = device.type === 'switch' ? `Port ${i}` : `Gig${i-1}/0`;
                html += `
                    <div class="hardware-port" data-port="${i}">
                        <div class="hardware-port-label">${portLabel}</div>
                    </div>
                `;
            }
            html += `</div>`;
        }

        hardwareView.innerHTML = html;
    }

    startPacketFlowAnimation() {
        setInterval(() => {
            this.animatePacketFlows();
        }, 100);
    }

    animatePacketFlows() {
        // Animate packets on active connections
        this.connections.forEach(conn => {
            if (this.activeConnections.has(conn.id)) {
                this.createPacketFlow(conn);
            }
        });
    }

    createPacketFlow(connection) {
        // This will be enhanced with actual packet animation
        const fromEl = document.querySelector(`.network-device[data-id="${connection.fromDevice}"]`);
        const toEl = document.querySelector(`.network-device[data-id="${connection.toDevice}"]`);
        
        if (!fromEl || !toEl) return;

        // Add active class to connection line
        const svg = document.getElementById('connectionOverlay');
        const line = svg.querySelector(`[data-connection-id="${connection.id}"]`);
        if (line) {
            line.classList.add('active');
        }
    }

    addConnection(fromDeviceId, fromPoint, toDeviceId, toPoint) {
        // Smart cabling detection
        const fromDevice = this.devices.find(d => d.id === fromDeviceId);
        const toDevice = this.devices.find(d => d.id === toDeviceId);
        
        const cableType = this.detectCableType(fromDevice, toDevice);
        
        const connection = {
            id: `conn-${Date.now()}`,
            fromDevice: fromDeviceId,
            fromPoint,
            toDevice: toDeviceId,
            toPoint,
            type: 'ethernet',
            bandwidth: '1000',
            cableType: cableType
        };
        this.connections.push(connection);
        this.activeConnections.add(connection.id);
        this.updateConnections();
        this.updateConnectionsList();
        this.updateScript();
    }

    detectCableType(fromDevice, toDevice) {
        // Enhanced cable type detection with multiple cable types
        const fromType = fromDevice.type;
        const toType = toDevice.type;
        
        // Router to Router: Serial or Fiber
        if (fromType === 'router' && toType === 'router') {
            return 'serial';
        }
        
        // Switch to Switch: Crossover or Fiber
        if (fromType === 'switch' && toType === 'switch') {
            return 'crossover';
        }
        
        // Same device types (except routers): Crossover
        if (fromType === toType && fromType !== 'router') {
            return 'crossover';
        }
        
        // Different device types: Straight-through
        if (fromType !== toType) {
            return 'straight-through';
        }
        
        // Default: Straight-through
        return 'straight-through';
    }
    
    getCableInfo(cableType) {
        const cableInfo = {
            'straight-through': {
                name: 'Straight-Through Cable',
                description: 'Used to connect different types of devices (e.g., PC to Switch, Router to Switch)',
                pinout: 'T568B on both ends',
                useCases: [
                    'PC to Switch',
                    'Router to Switch',
                    'Server to Switch',
                    'Hub to Switch'
                ],
                color: '#3b82f6',
                icon: '🔌'
            },
            'crossover': {
                name: 'Crossover Cable',
                description: 'Used to connect similar devices (e.g., Switch to Switch, PC to PC, Router to Router)',
                pinout: 'T568A on one end, T568B on the other',
                useCases: [
                    'Switch to Switch',
                    'PC to PC',
                    'Hub to Hub',
                    'Router to Router (Ethernet)'
                ],
                color: '#10b981',
                icon: '🔀'
            },
            'serial': {
                name: 'Serial Cable',
                description: 'Used for WAN connections between routers (DCE/DTE)',
                pinout: 'RS-232 or V.35 standard',
                useCases: [
                    'Router to Router (WAN)',
                    'Router to Modem',
                    'Point-to-Point connections'
                ],
                color: '#f59e0b',
                icon: '📡'
            },
            'fiber': {
                name: 'Fiber Optic Cable',
                description: 'High-speed long-distance connections using light signals',
                pinout: 'Single-mode or Multi-mode',
                useCases: [
                    'Long-distance connections',
                    'High-speed data transfer',
                    'Switch to Switch (backbone)',
                    'Data center connections'
                ],
                color: '#8b5cf6',
                icon: '💎'
            },
            'console': {
                name: 'Console Cable',
                description: 'Used for initial device configuration and management',
                pinout: 'RJ-45 to DB-9 or USB',
                useCases: [
                    'Initial router configuration',
                    'Switch management',
                    'Device troubleshooting',
                    'Out-of-band management'
                ],
                color: '#ef4444',
                icon: '🖥️'
            }
        };
        
        return cableInfo[cableType] || cableInfo['straight-through'];
    }
}

// Initialize the application when DOM is ready
let networkBuilder;

function initializeApplication() {
    // Check if main app exists and is visible
    const mainApp = document.getElementById('mainApp');
    if (!mainApp) {
        console.log('Main app element not found, cannot initialize');
        return;
    }
    
    // Check both inline style and computed style to be safe
    const inlineDisplay = mainApp.style.display;
    const computedStyle = window.getComputedStyle(mainApp);
    const computedDisplay = computedStyle.display;
    
    // If display is 'none' in either inline or computed style, don't initialize
    if (inlineDisplay === 'none' || computedDisplay === 'none') {
        console.log('Main app not visible yet (inline:', inlineDisplay, ', computed:', computedDisplay, '), skipping initialization');
        return;
    }
    
    console.log('Main app is visible (inline:', inlineDisplay, ', computed:', computedDisplay, '), proceeding with initialization');
    
    try {
        // Prevent multiple initializations
        if (window.networkBuilder) {
            console.log('Network Builder already initialized');
            return;
        }
        
        console.log('Initializing Network Builder...');
        networkBuilder = new NetworkBuilder();
        
        // Make device items draggable (if not already done in initializeEventListeners)
        setTimeout(() => {
            document.querySelectorAll('.device-item').forEach(item => {
                if (!item.hasAttribute('draggable')) {
                    item.draggable = true;
                }
            });
        }, 100);

        // Handle connection overlay mouse events
        const connectionOverlay = document.getElementById('connectionOverlay');
        if (connectionOverlay) {
            connectionOverlay.addEventListener('mousemove', (e) => {
                if (networkBuilder && networkBuilder.isDrawingConnection) {
                    networkBuilder.drawTemporaryConnection(e);
                }
            });
        }
        
        // Make networkBuilder globally accessible
        window.networkBuilder = networkBuilder;
        
        // Initialize animated background
        setTimeout(() => {
            initAnimatedBackground();
        }, 200);
        
        // Verify buttons are working
        setTimeout(() => {
            const testButton = document.getElementById('selectMode');
            if (testButton) {
                console.log('✓ Buttons found, event listeners should be attached');
            } else {
                console.warn('⚠ Buttons not found!');
            }
        }, 300);
        
        console.log('✓ Network Builder initialized successfully');
    } catch (error) {
        console.error('✗ Error initializing Network Builder:', error);
        console.error('Stack trace:', error.stack);
        // Try to show error to user
        alert('Error initializing application. Please check console for details.');
    }
}

// Make initializeApplication globally accessible
window.initializeApplication = initializeApplication;

// Don't auto-initialize - wait for main app to be shown
// initializeApplication() will be called by auth.js when user logs in

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

// Animated background is initialized by initializeApplication() when main app is shown

