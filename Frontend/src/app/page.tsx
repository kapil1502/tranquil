"use client"

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Mic, MicOff } from "lucide-react";
import { useRef, useEffect } from "react";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface ChatMessage {
  user: boolean;
  text: string;
  emotion?: string;
  audioUrl?: string;
}

interface ChatApiResponse {
  emotion: string;
  response: string;
}

export default function DoctorChat() {
  const [chatLog, setChatLog] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [transcripts, setTranscripts] = useState<string[]>([]);
  const [recognitionStatus, setRecognitionStatus] = useState<string>('');


  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        const recognition = recognitionRef.current;
        
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          console.log("Speech recognition started");
          setIsListening(true);
          setRecognitionStatus('Listening...');
        };

        recognition.onend = () => {
          console.log("Speech recognition ended");
          setIsListening(false);
          setRecognitionStatus('');
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
          setRecognitionStatus(`Error: ${event.error}`);
          setTimeout(() => setRecognitionStatus(''), 3000);
        };
        recognition.onresult = async (event: any) => {
          const current = event.resultIndex;
          const transcript = event.results[current][0].transcript;
          const isFinal = event.results[current].isFinal;

          if (isFinal) {
            console.log("Final transcript:", transcript);
            setMessage(transcript);
            setTranscripts(prev => [...prev, transcript]);
            
            // Create a local copy of the transcript before the async operation
            const finalTranscript = transcript;
            
            // Immediately set loading state and add user message
            setIsLoading(true);
            const userMessage: ChatMessage = { user: true, text: finalTranscript };
            setChatLog(prevLog => [...prevLog, userMessage]);
            
            try {
              const data = await callChatApi(finalTranscript);
              
              const aiMessage: ChatMessage = {
                user: false,
                text: data.response,
                emotion: data.emotion
              };
        
              setChatLog(prevLog => [...prevLog, aiMessage]);
            } catch (error) {
              console.error('Error processing speech:', error);
              setChatLog(prevLog => [...prevLog, {
                user: false,
                text: "Sorry, I had trouble processing your message."
              }]);
            } finally {
              setIsLoading(false);
            }
          }  else {
            // Update the message input with interim results
            setMessage(transcript);
          }
        };
      }
    }
  }, []);

  const EmptyStateMessage = () => (
    <div className="h-full flex flex-col items-center justify-center text-center p-6">
      <div className="mb-4">
        <svg 
          className="w-16 h-16 text-blue-500 mx-auto mb-4" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" 
          />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-gray-800 mb-2">
        Welcome to AI Health Assistant! 👋
      </h3>
      <p className="text-gray-600 mb-4 max-w-md">
        I'm here to help you with your health concerns. You can either type your message 
        or use the microphone to speak with me.
      </p>
      <div className="flex flex-wrap gap-3 justify-center text-sm text-gray-600">
        <div className="bg-gray-100 p-2 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer">
          "How are you feeling today?"
        </div>
        <div className="bg-gray-100 p-2 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer">
          "What are your symptoms?"
        </div>
        <div className="bg-gray-100 p-2 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer">  
        "Need medical advice?"
        </div>
      </div>
    </div>
  );

  // Function to call the chat API
  const callChatApi = async (messageText: string) => {
    const response = await fetch('http://localhost:8000/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: messageText }),
    });

    if (!response.ok) {
      throw new Error('Failed to get response from chat API');
    }

    return await response.json() as ChatApiResponse;
  };

  // Handle text messages
  const handleSend = async () => {
    if (!message.trim()) return;

    setIsLoading(true);
    const userMessage: ChatMessage = { user: true, text: message };
    
    try {
      setChatLog(prevLog => [...prevLog, userMessage]);
      
      const data = await callChatApi(message);
      
      const aiMessage: ChatMessage = {
        user: false,
        text: data.response,
        emotion: data.emotion
      };

      setChatLog(prevLog => [...prevLog, aiMessage]);
      
    } catch (error) {
      console.error('Error calling chat API:', error);
      setChatLog(prevLog => [...prevLog, {
        user: false,
        text: "Sorry, I'm having trouble connecting right now. Please try again later."
      }]);
    } finally {
      setIsLoading(false);
      setMessage("");
    }
  };

  const startRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
      }
    } else {
      setRecognitionStatus('Speech recognition not supported in your browser');
      setTimeout(() => setRecognitionStatus(''), 3000);
    }
  };

  // Modify stopRecording to use speech recognition
  const stopRecording = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const renderMessage = (chat: ChatMessage, index: number) => (
    <div 
      key={index} 
      className={`mb-2 p-3 rounded-lg shadow-md ${
        chat.user 
          ? "ml-auto bg-blue-50 max-w-[80%]" 
          : `mr-auto max-w-[80%] ${chat.emotion ? getEmotionStyle(chat.emotion) : 'bg-white'}`
      }`}
    >
      <p className={chat.user ? "text-right text-blue-600" : "text-left text-gray-800"}>
        <strong>{chat.user ? "You" : "AI"}:</strong> {chat.text}
      </p>
      {!chat.user && chat.emotion && (
        <div className="mt-1 text-xs text-gray-500 italic flex items-center gap-1">
          <span>Mood:</span>
          <span className="capitalize">{chat.emotion}</span>
          <span>{getEmotionEmoji(chat.emotion)}</span>
        </div>
      )}
      {chat.audioUrl && (
        <audio controls className="mt-2 w-full">
          <source src={chat.audioUrl} type="audio/wav" />
          Your browser does not support the audio element.
        </audio>
      )}
    </div>
  );

  // Helper function for emotion-based styling
  const getEmotionStyle = (emotion?: string): string => {
    const emotionStyles: Record<string, string> = {
      joy: 'bg-yellow-50 border-l-4 border-yellow-400',
      sadness: 'bg-blue-50 border-l-4 border-blue-400',
      anger: 'bg-red-50 border-l-4 border-red-400',
      fear: 'bg-purple-50 border-l-4 border-purple-400'
    };
    return emotion ? emotionStyles[emotion] || 'bg-white' : 'bg-white';
  };

  // Helper function for emotion emoji
  const getEmotionEmoji = (emotion: string): string => {
    const emojiMap: Record<string, string> = {
      joy: '😊',
      sadness: '😢',
      anger: '😠',
      fear: '😨'
    };
    return emojiMap[emotion] || '';
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center">Tranquil - Let's Unwind</h1>
      <p className="mb-4">We are here for you assuring your mental well being with our AI assistant. Whether you are feeling anxious, stressed or sad, we are here to help you.</p>

      <div className="border p-4 rounded mb-4 h-64 overflow-y-auto bg-gray-100">
        {chatLog.length === 0 ? (
          <EmptyStateMessage />
        ) : (
          <>
            {chatLog.map((chat, index) => renderMessage(chat, index))}
            {isLoading && (
              <div className="flex items-center space-x-2 p-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className="text-sm text-gray-500">AI is thinking...</span>
              </div>
            )}
          </>
        )}
      </div>

   <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input 
            type="text" 
            className="border p-2 flex-1 rounded" 
            value={message} 
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            disabled={isLoading || isListening}
          />
          <Button 
            onClick={handleSend} 
            disabled={isLoading || isListening || !message.trim()}
            className={`${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'Sending...' : 'Send'}
          </Button>
 
        <Button 
          onClick={isListening ? stopRecording : startRecording}
          disabled={isLoading}
          className={`relative flex items-center gap-2 ${isListening ? 'bg-red-500 hover:bg-red-600' : ''} ${
           isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          {isListening ? 'Stop Listening' : 'Start Listening'}
          {isListening && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          )}
        </Button>
        </div>
        
        {/* Add recognition status indicator */}
        {recognitionStatus && (
        <div className="text-sm text-gray-600 flex items-center gap-2">
        {isListening && (
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" 
                 style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" 
                 style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" 
                 style={{ animationDelay: '300ms' }}></div>
          </div>
        )}
        <span>{recognitionStatus}</span>
      </div>
    )}
  </div>
    </div>
  );
}