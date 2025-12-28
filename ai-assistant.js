// AI Teaching Assistant
class AIAssistant {
    constructor() {
        this.messages = [];
        this.init();
    }

    init() {
        this.createUI();
        this.attachListeners();
    }

    createUI() {
        const aiBox = document.createElement('div');
        aiBox.id = 'aiAssistant';
        aiBox.className = 'ai-assistant';
        aiBox.innerHTML = `
            <div class="ai-header">
                <div class="ai-icon">🤖</div>
                <h3>AI Network Teacher</h3>
                <button class="ai-toggle" id="toggleAI">−</button>
            </div>
            <div class="ai-content" id="aiContent">
                <div class="ai-messages" id="aiMessages">
                    <div class="ai-message bot">
                        <div class="ai-avatar">🤖</div>
                        <div class="ai-text">
                            <p>Hello! I'm your AI Network Teacher. I can help you learn networking concepts, explain device configurations, and guide you through network design. How can I help you today?</p>
                        </div>
                    </div>
                </div>
                <div class="ai-input-container">
                    <input type="text" id="aiInput" placeholder="Ask me about networking..." class="ai-input">
                    <button id="aiSend" class="ai-send-btn">Send</button>
                </div>
            </div>
        `;
        document.body.appendChild(aiBox);
    }

    attachListeners() {
        const toggleBtn = document.getElementById('toggleAI');
        const sendBtn = document.getElementById('aiSend');
        const input = document.getElementById('aiInput');

        toggleBtn.addEventListener('click', () => {
            const content = document.getElementById('aiContent');
            const isHidden = content.style.display === 'none';
            content.style.display = isHidden ? 'block' : 'none';
            toggleBtn.textContent = isHidden ? '−' : '+';
        });

        sendBtn.addEventListener('click', () => this.sendMessage());
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
    }

    sendMessage() {
        const input = document.getElementById('aiInput');
        const message = input.value.trim();
        if (!message) return;

        this.addMessage(message, 'user');
        input.value = '';

        // Simulate AI response
        setTimeout(() => {
            const response = this.generateResponse(message);
            this.addMessage(response, 'bot');
        }, 500);
    }

    addMessage(text, sender) {
        const messagesDiv = document.getElementById('aiMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `ai-message ${sender}`;
        
        if (sender === 'bot') {
            messageDiv.innerHTML = `
                <div class="ai-avatar">🤖</div>
                <div class="ai-text">
                    <p>${text}</p>
                </div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="ai-text">
                    <p>${text}</p>
                </div>
            `;
        }

        messagesDiv.appendChild(messageDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    generateResponse(userMessage) {
        const msg = userMessage.toLowerCase();
        
        // Network concepts
        if (msg.includes('router') || msg.includes('routing')) {
            return 'A router is a network device that forwards data packets between computer networks. It operates at Layer 3 (Network Layer) of the OSI model and uses routing tables to determine the best path for data transmission. Routers can support multiple protocols like OSPF, EIGRP, and BGP.';
        }
        
        if (msg.includes('switch') || msg.includes('switching')) {
            return 'A switch is a network device that connects devices on a local area network (LAN). It operates at Layer 2 (Data Link Layer) and uses MAC addresses to forward frames. Switches can create VLANs for network segmentation and improve network performance by reducing collision domains.';
        }
        
        if (msg.includes('vlan')) {
            return 'VLAN (Virtual LAN) is a logical grouping of network devices that appear to be on the same LAN regardless of their physical location. VLANs improve security, reduce broadcast traffic, and allow network segmentation. You can create VLANs using the "vlan [id]" command in configuration mode.';
        }
        
        if (msg.includes('ip address') || msg.includes('ip')) {
            return 'An IP address is a unique identifier assigned to each device on a network. IPv4 addresses consist of four octets (e.g., 192.168.1.1). You can configure IP addresses using the "ip add [address] [mask]" command in interface configuration mode.';
        }
        
        if (msg.includes('connect') || msg.includes('cable')) {
            return 'To connect devices, use the Connect mode and click on connection points. Straight-through cables are used for different device types (e.g., PC to Switch), while crossover cables are used for similar device types (e.g., Switch to Switch).';
        }
        
        if (msg.includes('help') || msg.includes('how')) {
            return 'I can help you with:\n• Network device configuration\n• Understanding networking concepts\n• Troubleshooting network issues\n• Learning CLI commands\n• Network design principles\n\nJust ask me anything about networking!';
        }
        
        // Default response
        return `I understand you're asking about "${userMessage}". In networking, this is an important concept. Would you like me to explain more about routers, switches, VLANs, IP addressing, or network protocols? Feel free to ask specific questions!`;
    }
}

