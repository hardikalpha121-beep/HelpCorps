'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ai, ChatMessage, ChatPayload, ChatResponseData } from '@/lib/api';
import { useSpeechRecognition, speakText, stopSpeaking } from '@/lib/useSpeechRecognition';

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isSpeakingMessage, setIsSpeakingMessage] = useState<number | null>(null);
  const [messages, setMessages] = useState<Array<ChatMessage & { volunteers?: ChatResponseData['volunteers']; booking?: ChatResponseData['booking'] }>>([
    {
      role: 'assistant',
      content:
        '👋 **Hello! I am HelpCorps AI.**\n\nI can help you:\n• Track live nearby volunteers & their skills\n• Book a volunteer directly\n• Guide you on Elderly Care, Disability Assistance, & Women Safety SOS\n• Explain Kindness Points & Economics\n\nHow may I support you today? You can also click the microphone to speak!',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Voice speech recognition for input
  const { isListening, toggleListening, isSupported: voiceSupported } = useSpeechRecognition({
    onTranscript: (spokenText) => {
      setInput(spokenText);
    },
    continuous: false,
  });

  // Chat mutation
  const chatMutation = useMutation({
    mutationFn: (payload: ChatPayload) => ai.chat(payload),
    onSuccess: (res) => {
      const data = res.data.data;
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply,
          volunteers: data.volunteers,
          booking: data.booking,
        },
      ]);
    },
    onError: (err: any) => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an issue connecting to the AI service. Please check your connection or try again shortly.',
        },
      ]);
    },
  });

  function handleSend(textToSend?: string) {
    const text = (textToSend || input).trim();
    if (!text || chatMutation.isPending) return;

    const userMessage: ChatMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    // Prepare history
    const history: ChatMessage[] = messages.slice(-6).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    chatMutation.mutate({
      message: text,
      history,
    });
  }

  function handleBookVolunteer(volunteer: { id: string; name: string; skills: string[] }) {
    const bookingMsg = `Please book volunteer ${volunteer.name} for ${volunteer.skills[0] || 'assistance'}`;
    const userMessage: ChatMessage = { role: 'user', content: bookingMsg };
    setMessages((prev) => [...prev, userMessage]);

    chatMutation.mutate({
      message: bookingMsg,
      bookVolunteerId: volunteer.id,
      bookingServiceType: volunteer.skills[0] || 'Civic Help',
    });
  }

  function handleSpeak(text: string, index: number) {
    if (isSpeakingMessage === index) {
      stopSpeaking();
      setIsSpeakingMessage(null);
    } else {
      setIsSpeakingMessage(index);
      speakText(text);
    }
  }

  const QUICK_PROMPTS = [
    { label: '👥 Find Nearby Volunteers', prompt: 'Who are the active volunteers nearby and what are their skills?' },
    { label: '🦽 Book Aarav for Mobility', prompt: 'Please book volunteer Aarav Sharma for wheelchair mobility assistance' },
    { label: '🛒 Book Elderly Grocery', prompt: 'Book Priya Verma for elderly grocery run' },
    { label: '🚨 How SOS Works', prompt: 'How does Women Safety SOS work and do I need to sign in?' },
    { label: '⭐ Kindness Points', prompt: 'Explain the 70% volunteer and 30% civic pool Kindness Points system' },
  ];

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2">
          <button
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-2.5 px-4 py-3 bg-primary hover:bg-primary-container text-on-primary rounded-full shadow-[0_8px_24px_rgba(0,3,193,0.35)] transition-all hover:scale-105 active:scale-95 border border-white/20"
            title="Open HelpCorps AI Assistant (Voice Enabled)"
          >
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary-fixed opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-secondary-fixed"></span>
            </span>
            <span className="material-symbols-outlined text-[24px]">smart_toy</span>
            <span className="font-label-md text-label-md font-bold tracking-tight">AI Assistant</span>
          </button>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-4 sm:right-6 z-50 w-[95vw] sm:w-[440px] h-[640px] max-h-[85vh] bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container-high flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-primary-container px-space-md py-3.5 text-on-primary flex items-center justify-between shadow-sm shrink-0">
            <div className="flex items-center gap-space-sm">
              <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                <span className="material-symbols-outlined text-[20px] text-white">smart_toy</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-label-lg text-label-lg font-bold leading-none">HelpCorps AI</h3>
                  <span className="px-1.5 py-0.2 bg-secondary text-on-secondary text-[10px] rounded-full font-bold uppercase tracking-wider">
                    OpenRouter
                  </span>
                </div>
                <p className="text-[11px] text-white/80 mt-0.5">Live volunteer tracking & voice assistance</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  stopSpeaking();
                  setIsOpen(false);
                }}
                className="p-1 rounded-lg hover:bg-white/10 text-white transition-colors"
                title="Close chat"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
          </div>

          {/* Quick Prompts Bar */}
          <div className="bg-surface-container-low px-space-sm py-2 border-b border-surface-container-high flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 text-xs">
            {QUICK_PROMPTS.map((p, i) => (
              <button
                key={i}
                onClick={() => handleSend(p.prompt)}
                disabled={chatMutation.isPending}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-surface-container-lowest hover:bg-primary-container hover:text-on-primary border border-surface-container-high font-medium text-on-surface-variant transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-space-md space-y-space-md bg-surface/50">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl p-space-sm sm:p-space-md text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary text-on-primary rounded-tr-xs shadow-sm'
                      : 'bg-surface-container-low text-on-surface rounded-tl-xs border border-surface-container shadow-xs'
                  }`}
                >
                  <div className="whitespace-pre-wrap font-body-sm text-body-sm">
                    {msg.content}
                  </div>

                  {/* Confirmed Booking Card */}
                  {msg.booking && (
                    <div className="mt-space-sm p-space-sm bg-secondary-fixed/30 border border-secondary/40 rounded-xl">
                      <div className="flex items-center gap-1.5 text-secondary font-bold text-xs uppercase mb-1">
                        <span className="material-symbols-outlined text-[16px]">verified</span>
                        <span>Booking Confirmed</span>
                      </div>
                      <p className="font-label-md text-label-md font-semibold text-on-surface">
                        {msg.booking.volunteerName}
                      </p>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        Booking ID: <code className="bg-surface px-1 py-0.5 rounded font-mono text-[10px]">{msg.booking.bookingId}</code>
                      </p>
                    </div>
                  )}

                  {/* Volunteer Cards from response */}
                  {msg.volunteers && msg.volunteers.length > 0 && (
                    <div className="mt-space-sm space-y-1.5 pt-2 border-t border-outline-variant/30">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                        Quick Booking Available:
                      </p>
                      <div className="grid grid-cols-1 gap-1.5">
                        {msg.volunteers.slice(0, 3).map((v) => (
                          <div
                            key={v.id}
                            className="p-2 rounded-lg bg-surface-container-lowest border border-outline-variant/40 flex items-center justify-between gap-2"
                          >
                            <div>
                              <p className="font-label-sm text-label-sm font-bold text-on-surface">
                                {v.name} <span className="text-secondary text-[11px]">★ {v.rating}</span>
                              </p>
                              <p className="text-[10px] text-on-surface-variant line-clamp-1">
                                {v.skills.join(', ')}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleBookVolunteer(v)}
                              className="px-2.5 py-1 bg-primary text-on-primary text-[11px] font-semibold rounded-lg hover:bg-primary-container transition-colors shrink-0"
                            >
                              Book Now
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Speaker TTS button for bot replies */}
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-2 mt-1 px-1">
                    <button
                      onClick={() => handleSpeak(msg.content, index)}
                      className={`flex items-center gap-1 text-[11px] ${
                        isSpeakingMessage === index ? 'text-primary font-bold animate-pulse' : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                      title={isSpeakingMessage === index ? 'Stop speaking' : 'Read message aloud'}
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {isSpeakingMessage === index ? 'volume_up' : 'volume_mute'}
                      </span>
                      <span>{isSpeakingMessage === index ? 'Speaking...' : 'Listen'}</span>
                    </button>
                  </div>
                )}
              </div>
            ))}

            {chatMutation.isPending && (
              <div className="flex items-center gap-2 p-3 bg-surface-container-low rounded-2xl rounded-tl-xs max-w-[70%] border border-surface-container">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                <span className="text-xs text-on-surface-variant animate-pulse font-medium">
                  HelpCorps AI is thinking...
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Voice Speaking / Listening Banner */}
          {isListening && (
            <div className="px-space-md py-1.5 bg-error-container text-on-error-container text-xs flex items-center justify-between border-t border-error/20">
              <span className="flex items-center gap-1.5 font-medium animate-pulse">
                <span className="material-symbols-outlined text-[16px] text-error">mic</span>
                Listening to your voice... Speak now!
              </span>
              <button
                onClick={toggleListening}
                className="text-error font-bold underline"
              >
                Stop
              </button>
            </div>
          )}

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-space-sm bg-surface-container-lowest border-t border-surface-container-high flex items-center gap-2 shrink-0"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isListening ? 'Listening...' : 'Ask or book a volunteer...'}
              disabled={chatMutation.isPending}
              className="flex-1 bg-surface-container-low text-on-surface px-space-sm py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary border border-transparent focus:border-primary/30"
            />

            {/* Voice Dictation Button */}
            {voiceSupported && (
              <button
                type="button"
                onClick={toggleListening}
                className={`p-2 rounded-xl transition-all ${
                  isListening
                    ? 'bg-error text-on-error ring-4 ring-error/30 animate-pulse'
                    : 'bg-surface-container text-on-surface-variant hover:text-primary hover:bg-surface-container-high'
                }`}
                title={isListening ? 'Click to stop listening' : 'Speak with your voice'}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {isListening ? 'mic' : 'mic_none'}
                </span>
              </button>
            )}

            {/* Send Button */}
            <button
              type="submit"
              disabled={!input.trim() || chatMutation.isPending}
              className="p-2 bg-primary hover:bg-primary-container text-on-primary rounded-xl transition-colors disabled:opacity-40 disabled:hover:bg-primary"
              title="Send message"
            >
              <span className="material-symbols-outlined text-[20px]">send</span>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
