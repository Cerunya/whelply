'use client'

import { useState, useRef, useEffect } from 'react'

type Message = {
  id: string
  senderRole: string
  content: string
  createdAt: string
  readAt: string | null
}

export default function ConversationView({
  conversationId,
  initialMessages,
  myRole,
  otherName,
}: {
  conversationId: string
  initialMessages: Message[]
  myRole: string
  otherName: string
}) {
  const [messages, setMessages] = useState(initialMessages)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    if (!content.trim() || loading) return
    setLoading(true)
    const res = await fetch(`/api/messages/${conversationId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })
    if (res.ok) {
      const msg = await res.json()
      setMessages((prev) => [...prev, msg])
      setContent('')
    }
    setLoading(false)
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="flex flex-col flex-1 max-w-2xl mx-auto w-full px-4 py-6">
      {/* Nachrichten */}
      <div className="flex-1 space-y-3 mb-6 overflow-y-auto">
        {messages.map((msg) => {
          const isMe = msg.senderRole === myRole
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${
                isMe
                  ? 'bg-forest text-white rounded-br-sm'
                  : 'bg-white border border-cream-deep text-stone-800 rounded-bl-sm'
              }`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
                <p className={`text-[10px] mt-1 ${isMe ? 'text-white/60' : 'text-stone-400'}`}>
                  {new Date(msg.createdAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                  {isMe && msg.readAt && ' · Gelesen'}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Eingabe */}
      <div className="bg-white rounded-2xl border border-cream-deep p-3 flex gap-2 items-end sticky bottom-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Nachricht schreiben... (Enter zum Senden)"
          rows={2}
          maxLength={2000}
          className="flex-1 resize-none text-sm focus:outline-none text-stone-800 placeholder-stone-300"
        />
        <button
          onClick={send}
          disabled={loading || !content.trim()}
          className="bg-forest text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-forest-light transition-colors disabled:opacity-40 flex-shrink-0"
        >
          Senden
        </button>
      </div>
    </div>
  )
}
