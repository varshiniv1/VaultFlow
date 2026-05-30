'use client'

import { useState, useRef, useEffect, FormEvent } from 'react'
import { chatWithAI } from '@/lib/api'
import type { ChatMessage } from '@/types'
import { Send, Bot, Loader2, MessageSquare, Sparkles, RefreshCw } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

const SUGGESTIONS = [
  'What are my account balances?',
  'Show my recent transactions',
  'How much have I spent this month?',
  'Explain the fraud detection system',
]

export default function ChatPage() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const bottomRef               = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return

    const userMsg: ChatMessage = { role: 'user', content: text }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setInput('')
    setLoading(true)

    try {
      // Send the full conversation history so Groq has context
      const history = updatedMessages.map(m => ({ role: m.role, content: m.content }))
      // Remove the last message (the current one) from history — it's sent as `message`
      const { reply } = await chatWithAI(text, history.slice(0, -1))
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch (err: unknown) {
      const msg = (err as { status?: number })?.status === 503
        ? '⚠️ AI assistant is unavailable. Ensure GROQ_API_KEY is set in start-backend.bat.'
        : '⚠️ Something went wrong. Please try again.'
      setMessages(prev => [...prev, { role: 'assistant', content: msg }])
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    sendMessage(input)
  }

  function clearChat() {
    setMessages([])
  }

  const name = user?.split('@')[0] ?? 'you'

  return (
    <div className="flex h-full flex-col bg-slate-50 dark:bg-slate-950">

      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#012169]">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 dark:text-white">AI Financial Assistant</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Powered by Groq · llama-3.3-70b · Sees your live account data
            </p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            {messages.length > 0 && (
              <button onClick={clearChat}
                className="flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                <RefreshCw className="h-3 w-3" /> New chat
              </button>
            )}
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Online
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">

        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-6 text-center pb-10">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#012169]/10 dark:bg-blue-900/30">
              <MessageSquare className="h-8 w-8 text-[#012169] dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                Hello, {name}! How can I help you today?
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                I have access to your real account balances and transaction history. Ask me anything.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 max-w-lg">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => sendMessage(s)}
                  className="rounded-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 shadow-sm transition hover:border-[#012169] hover:text-[#012169] dark:hover:border-blue-400 dark:hover:text-blue-400">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex items-end gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>

            {/* Avatar */}
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
              msg.role === 'user'
                ? 'bg-gradient-to-br from-violet-500 to-blue-600 text-white'
                : 'bg-[#012169] text-white'
            }`}>
              {msg.role === 'user'
                ? (user?.split('@')[0].slice(0, 2).toUpperCase() ?? 'U')
                : <Bot className="h-4 w-4" />}
            </div>

            {/* Bubble */}
            <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
              msg.role === 'user'
                ? 'rounded-br-sm bg-[#012169] text-white'
                : 'rounded-bl-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-end gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#012169]">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="rounded-2xl rounded-bl-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 shadow-sm">
              <div className="flex gap-1 items-center">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 p-4">
        <form onSubmit={handleSubmit} className="flex items-center gap-3 max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your accounts, transactions, or anything banking…"
            className="flex-1 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#012169] transition"
          />
          <button type="submit" disabled={!input.trim() || loading}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#012169] hover:bg-[#01195e] text-white shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </form>
      </div>
    </div>
  )
}
