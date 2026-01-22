import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Check, RefreshCw } from 'lucide-react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import api from '../../services/apiService';
import { API_BASE_URL } from '../../constants/api';

// Backend URL for socket connection - use API_BASE_URL from .env
// SockJS works with HTTP/HTTPS URLs and handles WebSocket upgrade automatically
const SOCKET_URL = `${API_BASE_URL}/ws`;

const JdGeneratorSidebar = ({ isOpen, onClose, inputData, onUseJd }) => {
    const [jdContent, setJdContent] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [status, setStatus] = useState('idle');

    const stompClientRef = useRef(null);
    const sessionIdRef = useRef(`session_${Date.now()}`);

    useEffect(() => {
        if (isOpen && inputData.title) {
            connectWebSocket();
        }
        return () => {
            disconnectWebSocket();
        };
    }, [isOpen]);

    const connectWebSocket = () => {
        const socket = new SockJS(SOCKET_URL);
        const client = new Client({
            webSocketFactory: () => socket,
            debug: (str) => console.log(str),
            onConnect: () => {
                setStatus('connected');
            },
            onStompError: (frame) => {
                console.error('Broker reported error: ' + frame.headers['message']);
                setStatus('error');
            }
        });

        client.onConnect = (frame) => {
            console.log('Connected: ' + frame);

            // Subscribe to user-specific topic
            client.subscribe(`/topic/jd/${sessionIdRef.current}`, (message) => {
                const payload = JSON.parse(message.body);
                if (payload.content) {
                    setJdContent(prev => prev + payload.content);
                } else if (payload.done) {
                    setIsGenerating(false);
                    setStatus('complete');
                } else if (payload.error) {
                    console.error("Stream error:", payload.error);
                    setStatus('error');
                    setIsGenerating(false);
                }
            });

            // Trigger generation via REST
            generateJdTrigger();
        };

        client.activate();
        stompClientRef.current = client;
    };

    const disconnectWebSocket = () => {
        if (stompClientRef.current) {
            stompClientRef.current.deactivate();
        }
    };

    const generateJdTrigger = async () => {
        if (!inputData.title) return;

        setIsGenerating(true);
        setStatus('generating');
        setJdContent('');

        try {
            await api.post('/api/ai/generate-jd', {
                sessionId: sessionIdRef.current,
                title: inputData.title,
                domain: inputData.domain,
                minExp: inputData.minExp,
                maxExp: inputData.maxExp,
                skills: inputData.skills
            });
        } catch (error) {
            console.error("Failed to trigger generation:", error);
            setStatus('error');
            setIsGenerating(false);
        }
    };

    const handleUseJd = () => {
        onUseJd(jdContent);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-y-0 right-0 w-[600px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col border-l">
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between bg-blue-50">
                <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-blue-600" />
                    <h2 className="text-lg font-bold text-gray-800">AI JD Generator</h2>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full">
                    <X className="h-5 w-5 text-gray-600" />
                </button>
            </div>

            {/* AI Generated Badge */}
            <div className="px-6 pt-4 pb-2">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-full">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-semibold text-purple-700">AI Generated</span>
                    {isGenerating && (
                        <RefreshCw className="h-3 w-3 text-purple-600 animate-spin" />
                    )}
                </div>
            </div>

            {/* Content - Full Height */}
            <div className="flex-1 px-6 pb-4 overflow-hidden flex flex-col">
                <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-700">Generated Job Description</label>
                    {isGenerating && (
                        <span className="text-xs text-blue-600 animate-pulse flex items-center gap-1">
                            <RefreshCw className="h-3 w-3 animate-spin" /> Generating...
                        </span>
                    )}
                </div>
                <textarea
                    className="flex-1 w-full border rounded-lg p-4 font-mono text-xs leading-relaxed focus:ring-2 focus:ring-blue-500 outline-none resize-none overflow-auto"
                    value={jdContent}
                    onChange={(e) => setJdContent(e.target.value)}
                    placeholder="AI will generate the job description here..."
                />
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t bg-gray-50 flex justify-between items-center flex-shrink-0">
                <button
                    onClick={() => {
                        setJdContent('');
                        generateJdTrigger();
                    }}
                    disabled={isGenerating}
                    className="text-gray-600 hover:text-blue-600 text-sm flex items-center gap-1 disabled:opacity-50"
                >
                    <RefreshCw className="h-4 w-4" /> Regenerate
                </button>

                <button
                    onClick={handleUseJd}
                    disabled={isGenerating || !jdContent}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50 transition-all font-medium"
                >
                    <Check className="h-4 w-4" /> Use this JD (as PDF)
                </button>
            </div>
        </div>
    );
};

export default JdGeneratorSidebar;
