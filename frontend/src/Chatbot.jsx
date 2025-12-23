import React, { useState, useRef, useEffect } from 'react';
import './Chatbot.css';

const Chatbot = () => {
    const [messages, setMessages] = useState([
        { 
            text: "Olá! Sou o SUS Virtual 🤖\n\nPosso ajudar com informações sobre:\n• Consultas e exames no SUS\n• Localização de unidades de saúde\n• Programas de saúde e vacinação\n• Medicamentos e Farmácia Popular\n\nPara emergências, ligue **192** imediatamente.", 
            sender: 'bot',
            timestamp: new Date(),
            type: 'welcome'
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const chatMessagesRef = useRef(null);
    const [showQuickReplies, setShowQuickReplies] = useState(true);
    
    const API_URL = 'http://localhost:5000/api/chat';
    const [connected, setConnected] = useState(true);

    // Scroll automático melhorado
    useEffect(() => {
        const scrollToBottom = () => {
            if (messagesEndRef.current) {
                setTimeout(() => {
                    messagesEndRef.current.scrollIntoView({ 
                        behavior: 'smooth',
                        block: 'nearest'
                    });
                }, 50);
            }
        };
        
        scrollToBottom();
    }, [messages, isTyping]);

    // Verificar se o scroll está no fundo para novas mensagens
    useEffect(() => {
        const handleNewMessage = () => {
            if (chatMessagesRef.current) {
                const { scrollTop, scrollHeight, clientHeight } = chatMessagesRef.current;
                const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
                
                if (isNearBottom) {
                    setTimeout(() => {
                        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                }
            }
        };
        
        handleNewMessage();
    }, [messages.length]);

    // Testar conexão com backend
    useEffect(() => {
        const checkConnection = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/health');
                if (response.ok) setConnected(true);
            } catch (error) {
                console.log('Backend offline');
                setConnected(false);
            }
        };
        checkConnection();
        const interval = setInterval(checkConnection, 30000);
        return () => clearInterval(interval);
    }, []);

    const sendMessage = async () => {
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput('');
        
        // Adicionar mensagem do usuário
        const userMsgObj = {
            text: userMessage,
            sender: 'user',
            timestamp: new Date(),
            type: 'user'
        };
        setMessages(prev => [...prev, userMsgObj]);
        setLoading(true);
        setIsTyping(true);

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage })
            });

            const data = await response.json();
            
            // Simular digitação
            setTimeout(() => {
                setIsTyping(false);
                
                const botMsgObj = {
                    text: data.response,
                    sender: 'bot',
                    timestamp: new Date(),
                    type: data.metadata?.type || 'ai_response',
                    isEmergency: data.metadata?.type === 'emergency'
                };
                
                setMessages(prev => [...prev, botMsgObj]);
                setLoading(false);
            }, 800);
            
        } catch (error) {
            console.error('Erro:', error);
            setIsTyping(false);
            
            const errorMsg = {
                text: "⚠️ **Conexão Interrompida**\n\nO servidor está temporariamente indisponível.\n\nPara ajuda imediata:\n• 📞 **Disque 136** - Informações 24h\n• 🏥 **Procure uma UBS** - Atendimento presencial",
                sender: 'bot',
                timestamp: new Date(),
                type: 'error',
                isError: true
            };
            
            setMessages(prev => [...prev, errorMsg]);
            setConnected(false);
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // Sugestões rápidas
    const quickReplies = [
        { text: "Como marcar consulta?", icon: "event_available" },
        { text: "Onde fica a UPA mais próxima?", icon: "location_on" },
        { text: "Quais documentos preciso?", icon: "description" },
        { text: "Febre e dor de cabeça", icon: "thermostat" },
        { text: "Medicamentos gratuitos", icon: "medication" },
        { text: "Direitos do paciente", icon: "gavel" }
    ];

    const formatTime = (date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const clearChat = () => {
        setMessages([
            { 
                text: "Conversa reiniciada! Como posso ajudar você hoje?", 
                sender: 'bot',
                timestamp: new Date(),
                type: 'system'
            }
        ]);
    };

    const handleQuickReply = (text) => {
        setInput(text);
        // Envia automaticamente após 300ms
        setTimeout(() => {
            const textarea = document.querySelector('.chat-input textarea');
            if (textarea) {
                textarea.focus();
            }
        }, 100);
    };

    // Função para copiar mensagem
    const copyMessage = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            // Feedback visual (poderia ser um toast)
            console.log('Mensagem copiada!');
        });
    };

    return (
        <div className="chatbot-wrapper">
            <div className="chatbot-container">
                {/* Chat Header */}
                <div className="chat-header">
                    <div className="chat-title">
                        <span className="material-icons">smart_toy</span>
                        <div>
                            <h3>SUS Virtual Assistant</h3>
                            <div className="status-indicator">
                                <span className={`status-dot ${connected ? 'online' : 'offline'}`}></span>
                                <span>{connected ? 'Conectado' : 'Offline'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="chat-actions">
                        <button 
                            onClick={clearChat} 
                            className="action-btn"
                            title="Nova conversa"
                        >
                            <span className="material-icons">restart_alt</span>
                        </button>
                        <button 
                            className="action-btn" 
                            title="Ajuda"
                            onClick={() => window.open('https://www.gov.br/saude', '_blank')}
                        >
                            <span className="material-icons">help</span>
                        </button>
                    </div>
                </div>

                {/* Chat Messages - REF adicionada aqui */}
                <div className="chat-messages" ref={chatMessagesRef}>
                    {messages.map((msg, index) => (
                        <div 
                            key={index} 
                            className={`message ${msg.sender} ${msg.type} ${msg.isEmergency ? 'emergency' : ''}`}
                        >
                            <div className="message-avatar">
                                {msg.sender === 'bot' ? (
                                    <span className="material-icons">smart_toy</span>
                                ) : (
                                    <span className="material-icons">person</span>
                                )}
                            </div>
                            <div className="message-content-wrapper">
                                <div className="message-header">
                                    <span className="message-sender">
                                        {msg.sender === 'bot' ? 'SUS Virtual' : 'Você'}
                                    </span>
                                    <div className="message-actions">
                                        <span className="message-time">{formatTime(msg.timestamp)}</span>
                                        <button 
                                            className="message-action-btn"
                                            onClick={() => copyMessage(msg.text)}
                                            title="Copiar mensagem"
                                        >
                                            <span className="material-icons">content_copy</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="message-content">
                                    {msg.text.split('\n').map((line, i) => (
                                        <React.Fragment key={i}>
                                            {line.includes('**') ? (
                                                <strong>{line.replace(/\*\*/g, '')}</strong>
                                            ) : (
                                                line
                                            )}
                                            {i < msg.text.split('\n').length - 1 && <br />}
                                        </React.Fragment>
                                    ))}
                                </div>
                                {msg.type === 'error' && (
                                    <div className="message-footer">
                                        <span className="material-icons">error_outline</span>
                                        <span>Tente novamente em alguns instantes</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    
                    {isTyping && (
                        <div className="message bot typing">
                            <div className="message-avatar">
                                <span className="material-icons">smart_toy</span>
                            </div>
                            <div className="typing-indicator">
                                <span>Digitando</span>
                                <div className="dots">
                                    <div className="dot"></div>
                                    <div className="dot"></div>
                                    <div className="dot"></div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <div ref={messagesEndRef} className="scroll-anchor" />
                </div>

                {/* Quick Replies */}
                 <div className={`quick-replies-section ${showQuickReplies ? 'expanded' : 'collapsed'}`}>
                    <div className="quick-replies-header" onClick={() => setShowQuickReplies(!showQuickReplies)}>
                    <span className="material-icons">
                        {showQuickReplies ? 'expand_less' : 'expand_more'}
                    </span>
                    <span>Perguntas rápidas {showQuickReplies ? '(ocultar)' : '(mostrar)'}</span>
                    </div>
                    
                    {showQuickReplies && (
                    <div className="quick-replies-grid">
                        {quickReplies.slice(0, 3).map((reply, index) => ( // Mostra só 3 inicialmente
                        <button
                            key={index}
                            className="quick-reply-btn"
                            onClick={(e) => {
                            e.stopPropagation();
                            handleQuickReply(reply.text);
                            }}
                        >
                            <span className="material-icons">{reply.icon}</span>
                            <span>{reply.text}</span>
                        </button>
                        ))}
                    </div>
                    )}
                </div>


                {/* Input Area */}
                <div className="input-section">
                    <div className="input-wrapper">
                        <div className="input-container">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Digite sua dúvida sobre saúde pública..."
                                rows="2"
                                disabled={loading || !connected}
                                className="chat-input"
                            />
                            <div className="input-actions">
                                <button 
                                    className="input-action-btn" 
                                    title="Anexar"
                                    onClick={() => document.querySelector('.chat-input').focus()}
                                >
                                    <span className="material-icons">attach_file</span>
                                </button>
                                <button 
                                    className="input-action-btn" 
                                    title="Gravar áudio"
                                    onClick={() => alert('Funcionalidade de áudio em desenvolvimento')}
                                >
                                    <span className="material-icons">mic</span>
                                </button>
                            </div>
                        </div>
                        <button 
                            onClick={sendMessage}
                            disabled={loading || !input.trim() || !connected}
                            className="send-button"
                            title="Enviar mensagem"
                        >
                            {loading ? (
                                <span className="material-icons spin">refresh</span>
                            ) : (
                                <span className="material-icons">send</span>
                            )}
                        </button>
                    </div>
                    <div className="input-hint">
                        <span className="material-icons">info</span>
                        <span>Pressione Enter para enviar, Shift+Enter para nova linha</span>
                    </div>
                </div>

                {/* Chat Footer */}
                <div className="chat-footer">
                    <div className="footer-note">
                        <span className="material-icons">shield</span>
                        <span>Suas conversas são privadas e seguras</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Chatbot;