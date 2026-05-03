'use client';
import { useState, useCallback } from 'react';

/**
 * useAI Hook — Manages AI chat state and communication
 */
export function useAI() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (message, context = {}) => {
    const token = localStorage.getItem('studyos_token');
    if (!token) return;

    const userMsg = { role: 'user', content: message, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message,
          context,
          history: messages.slice(-10), // Send last 10 messages for context
        }),
      });

      const data = await res.json();
      const aiMsg = { role: 'assistant', content: data.response || 'No response.', timestamp: Date.now() };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      const errMsg = { role: 'assistant', content: 'Sorry, something went wrong.', timestamp: Date.now() };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const clearChat = useCallback(() => setMessages([]), []);

  return { messages, isLoading, sendMessage, clearChat };
}
