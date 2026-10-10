'use client';

import React from 'react';
import { useSpeechRecognition } from '@/lib/useSpeechRecognition';

interface VoiceDictationButtonProps {
  onTranscript: (text: string) => void;
  className?: string;
  title?: string;
}

export function VoiceDictationButton({
  onTranscript,
  className = '',
  title = 'Speak to dictate text',
}: VoiceDictationButtonProps) {
  const { isListening, isSupported, toggleListening } = useSpeechRecognition({
    onTranscript,
    continuous: false,
  });

  if (!isSupported) return null;

  return (
    <button
      type="button"
      onClick={toggleListening}
      title={isListening ? 'Listening... click to stop' : title}
      className={`relative inline-flex items-center justify-center p-2 rounded-lg transition-all ${
        isListening
          ? 'bg-error text-on-error animate-pulse shadow-md ring-4 ring-error/30'
          : 'bg-surface-container-high hover:bg-primary-container text-on-surface-variant hover:text-on-primary'
      } ${className}`}
    >
      <span className="material-symbols-outlined text-[18px]">
        {isListening ? 'mic' : 'mic_none'}
      </span>
      {isListening && (
        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-error"></span>
        </span>
      )}
    </button>
  );
}
