// CLI Engine for Network Devices
class CLIEngine {
    constructor(networkBuilder) {
        this.networkBuilder = networkBuilder;
        this.currentDevice = null;
        this.mode = 'user'; // user, enable, config
        this.commandHistory = [];
        this.historyIndex = -1;
        this.initializeCLI();
    }

    initializeCLI() {
        const cliInput = document.getElementById('cliInput');
        const cliOutput = document.getElementById('cliOutput');
        const clearCliBtn = document.getElementById('clearCli');

        if (!cliInput || !cliOutput) {
            // Retry if elements don't exist yet
            setTimeout(() => this.initializeCLI(), 100);
            return;
        }

        cliInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.executeCommand(cliInput.value);
                cliInput.value = '';
                this.historyIndex = -1;
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (this.commandHistory.length > 0) {
                    this.historyIndex = Math.max(0, this.historyIndex - 1);
                    cliInput.value = this.commandHistory[this.commandHistory.length - 1 - this.historyIndex] || '';
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (this.historyIndex >= 0) {
                    this.historyIndex = Math.min(this.commandHistory.length - 1, this.historyIndex + 1);
                    cliInput.value = this.commandHistory[this.commandHistory.length - 1 - this.historyIndex] || '';
                }
            }
        });

        if (clearCliBtn) {
            clearCliBtn.addEventListener('click', () => {
                cliOutput.innerHTML = '';
                this.addOutput('Terminal cleared.', 'system');
            });
        }

        // Auto-focus CLI when tab is opened
        const cliTab = document.querySelector('[data-tab="cli"]');
        if (cliTab) {
            cliTab.addEventListener('click', () => {
                setTimeout(() => cliInput.focus(), 100);
            });
        }
    }

    setDevice(device) {
        this.currentDevice = device;
        this.mode = 'user';
        this.updatePrompt();
        this.addOutput(`\nConnected to ${device.label} (${device.type.toUpperCase()})`, 'system');
        this.addOutput('Type "help" for available commands.\n', 'system');
    }

    updatePrompt() {
        const prompt = document.getElementById('cliPrompt');
        if (!prompt) return;

        if (!this.currentDevice) {
            prompt.textContent = 'No device selected#';
            return;
        }

        const prompts = {
            user: `${this.currentDevice.label}>`,
            enable: `${this.currentDevice.label}#`,
            config: `${this.currentDevice.label}(config)#`
        };
        prompt.textContent = prompts[this.mode] || prompts.user;
    }

    executeCommand(command) {
        if (!this.currentDevice) {
            this.addOutput('Error: No device selected. Please select a device first.', 'error');
            return;
        }

        const cmd = command.trim().toLowerCase();
        if (!cmd) {
            this.addOutput('', 'command');
            return;
        }

        this.commandHistory.push(command);
        if (this.commandHistory.length > 50) {
            this.commandHistory.shift();
        }

        this.addOutput(command, 'command');

        // Parse and execute command
        const parts = cmd.split(/\s+/);
        const mainCmd = parts[0];

        switch (mainCmd) {
            case 'enable':
                this.handleEnable();
                break;
            case 'conf':
            case 'configure':
                if (parts[1] === 't' || parts[1] === 'terminal') {
                    this.handleConfigTerminal();
                } else {
                    this.addOutput('Invalid command. Use "conf t" or "configure terminal"', 'error');
                }
                break;
            case 'exit':
                this.handleExit();
                break;
            case 'vlan':
                this.handleVlan(parts);
                break;
            case 'name':
                this.handleName(parts);
                break;
            case 'interface':
                this.handleInterface(parts);
                break;
            case 'ip':
                if (parts[1] === 'add' || parts[1] === 'address') {
                    this.handleIpAddress(parts);
                } else {
                    this.addOutput('Invalid command. Use "ip add [address] [mask]"', 'error');
                }
                break;
            case 'no':
                this.handleNo(parts);
                break;
            case 'show':
                this.handleShow(parts);
                break;
            case 'help':
                this.showHelp();
                break;
            default:
                this.addOutput(`% Invalid command: ${mainCmd}`, 'error');
                this.addOutput('Type "help" for available commands.', 'system');
        }
    }

    handleEnable() {
        if (this.mode === 'user') {
            this.mode = 'enable';
            this.updatePrompt();
            this.addOutput('', 'system');
        } else {
            this.addOutput('Already in privileged mode.', 'system');
        }
    }

    handleConfigTerminal() {
        if (this.mode === 'enable') {
            this.mode = 'config';
            this.updatePrompt();
            this.addOutput('Enter configuration commands, one per line. End with CNTL/Z.', 'system');
        } else {
            this.addOutput('% Invalid input detected at \'^\' marker.', 'error');
        }
    }

    handleExit() {
        if (this.mode === 'config') {
            this.mode = 'enable';
            this.updatePrompt();
            this.addOutput('', 'system');
        } else if (this.mode === 'enable') {
            this.mode = 'user';
            this.updatePrompt();
            this.addOutput('', 'system');
        } else {
            this.addOutput('', 'system');
        }
    }

    handleVlan(parts) {
        if (this.mode !== 'config') {
            this.addOutput('% Invalid input detected at \'^\' marker.', 'error');
            return;
        }

        if (parts.length < 2) {
            this.addOutput('% Incomplete command.', 'error');
            return;
        }

        const vlanId = parts[1];
        if (!/^\d+$/.test(vlanId)) {
            this.addOutput(`% Invalid VLAN ID: ${vlanId}`, 'error');
            return;
        }

        const device = this.networkBuilder.devices.find(d => d.id === this.currentDevice.id);
        if (device && device.properties.vlans) {
            if (!device.properties.vlans.includes(vlanId)) {
                device.properties.vlans.push(vlanId);
                device.properties.vlans.sort((a, b) => parseInt(a) - parseInt(b));
            }
            this.addOutput('', 'system');
            this.networkBuilder.updateScript();
        }
    }

    handleName(parts) {
        if (this.mode !== 'config') {
            this.addOutput('% Invalid input detected at \'^\' marker.', 'error');
            return;
        }

        if (parts.length < 2) {
            this.addOutput('% Incomplete command.', 'error');
            return;
        }

        const name = parts.slice(1).join(' ');
        this.addOutput(`VLAN name set to: ${name}`, 'system');
        // Store in device properties if needed
    }

    handleInterface(parts) {
        if (this.mode !== 'config') {
            this.addOutput('% Invalid input detected at \'^\' marker.', 'error');
            return;
        }

        if (parts.length < 2) {
            this.addOutput('% Incomplete command.', 'error');
            return;
        }

        const interfaceName = parts.slice(1).join(' ');
        this.addOutput(`Entering interface configuration mode for ${interfaceName}`, 'system');
        // Store current interface context
        this.currentInterface = interfaceName;
    }

    handleIpAddress(parts) {
        if (this.mode !== 'config') {
            this.addOutput('% Invalid input detected at \'^\' marker.', 'error');
            return;
        }

        if (parts.length < 4) {
            this.addOutput('% Incomplete command. Use: ip add [address] [mask]', 'error');
            return;
        }

        const ip = parts[2];
        const mask = parts[3];

        // Validate IP format
        if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
            this.addOutput(`% Invalid IP address format: ${ip}`, 'error');
            return;
        }

        const device = this.networkBuilder.devices.find(d => d.id === this.currentDevice.id);
        if (device) {
            device.properties.ip = ip;
            device.properties.subnet = this.cidrToSubnet(mask) || mask;
            this.addOutput('', 'system');
            this.networkBuilder.updateScript();
            this.networkBuilder.showDeviceProperties();
        }
    }

    handleNo(parts) {
        if (this.mode !== 'config') {
            this.addOutput('% Invalid input detected at \'^\' marker.', 'error');
            return;
        }

        if (parts.length < 2) {
            this.addOutput('% Incomplete command.', 'error');
            return;
        }

        if (parts[1] === 'shutdown') {
            this.addOutput('Interface enabled.', 'system');
        } else {
            this.addOutput(`% Unknown command: ${parts.slice(1).join(' ')}`, 'error');
        }
    }

    handleShow(parts) {
        if (this.mode === 'user') {
            this.addOutput('% Invalid input detected at \'^\' marker.', 'error');
            return;
        }

        const device = this.networkBuilder.devices.find(d => d.id === this.currentDevice.id);
        if (!device) return;

        if (parts.length < 2) {
            this.addOutput('% Incomplete command.', 'error');
            return;
        }

        const showCmd = parts.slice(1).join(' ').toLowerCase();

        if (showCmd.includes('vlan') || showCmd === 'vlans') {
            this.addOutput('\nVLAN Name                             Status    Ports', 'system');
            this.addOutput('---- --------------------------------- --------- -------------------------------', 'system');
            device.properties.vlans.forEach(vlan => {
                this.addOutput(`${vlan.padStart(4)} VLAN${vlan.padEnd(30)} active`, 'system');
            });
        } else if (showCmd.includes('ip') || showCmd.includes('interface')) {
            this.addOutput(`\nInterface: ${device.properties.ip}`, 'system');
            this.addOutput(`Subnet Mask: ${device.properties.subnet}`, 'system');
        } else if (showCmd.includes('running') || showCmd.includes('config')) {
            this.addOutput('\nCurrent configuration:', 'system');
            this.addOutput(`hostname ${device.properties.hostname}`, 'system');
            this.addOutput(`ip address ${device.properties.ip} ${device.properties.subnet}`, 'system');
        } else {
            this.addOutput(`% Unknown show command: ${showCmd}`, 'error');
        }
    }

    showHelp() {
        this.addOutput('\nAvailable Commands:', 'system');
        this.addOutput('  enable              - Enter privileged mode', 'system');
        this.addOutput('  conf t              - Enter configuration mode', 'system');
        this.addOutput('  exit                - Exit current mode', 'system');
        this.addOutput('  vlan [id]           - Create/configure VLAN', 'system');
        this.addOutput('  name [name]         - Name the VLAN', 'system');
        this.addOutput('  interface [type]    - Configure interface', 'system');
        this.addOutput('  ip add [ip] [mask]  - Set IP address', 'system');
        this.addOutput('  no shutdown         - Enable interface', 'system');
        this.addOutput('  show [option]       - Display information', 'system');
        this.addOutput('  help                - Show this help message', 'system');
    }

    addOutput(text, type = 'system') {
        const cliOutput = document.getElementById('cliOutput');
        if (!cliOutput) return;

        const line = document.createElement('div');
        line.className = `cli-line cli-${type}`;
        line.textContent = text;
        cliOutput.appendChild(line);
        cliOutput.scrollTop = cliOutput.scrollHeight;
    }

    cidrToSubnet(cidr) {
        if (cidr.includes('.')) return cidr; // Already a subnet mask
        const bits = parseInt(cidr);
        if (isNaN(bits) || bits < 0 || bits > 32) return null;
        const mask = [];
        for (let i = 0; i < 4; i++) {
            const octet = Math.min(255, 256 - Math.pow(2, Math.max(0, 8 - (bits - i * 8))));
            mask.push(octet);
        }
        return mask.join('.');
    }

    clear() {
        const cliOutput = document.getElementById('cliOutput');
        if (cliOutput) {
            cliOutput.innerHTML = '';
        }
    }
}

