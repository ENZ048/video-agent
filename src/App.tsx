import React, { useState, useEffect, useRef } from 'react'
import { 
  HiChatBubbleLeftRight, 
  HiMicrophone, 
  HiOutlineMicrophone,
  HiChatBubbleLeft,
  HiPaperAirplane
} from 'react-icons/hi2'
import StreamingAvatar, { AvatarQuality, StreamingEvents, TaskType, TaskMode } from '@heygen/streaming-avatar'
import './App.css'

// Types
interface ChatMessage {
  timestamp: Date
  type: 'avatar' | 'user' | 'system'
  message: string
}

function App() {
  // State
  const [isConnected, setIsConnected] = useState(false)
  const [chatTranscript, setChatTranscript] = useState<ChatMessage[]>([])
  const [isTranscriptVisible, setIsTranscriptVisible] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showHeroImage, setShowHeroImage] = useState(true)
  const [selectedLanguage, setSelectedLanguage] = useState('en')
  const [viewMode, setViewMode] = useState<'transcript' | 'textchat'>('transcript')
  const [textMessage, setTextMessage] = useState('')
  const [isSendingMessage, setIsSendingMessage] = useState(false)

  // --- BOT BUFFER (only show when complete)
  const [_avatarBuffer, setAvatarBuffer] = useState('')

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const avatarRef = useRef<StreamingAvatar | null>(null)
  const userMediaStreamRef = useRef<MediaStream | null>(null)
  const chatLogRef = useRef<HTMLDivElement>(null)

  // Duplicate-protection guards for each avatar utterance
  const avatarUtteranceOpen = useRef(false)
  const avatarHasFlushed = useRef(false)
  const listenersSetup = useRef(false)

  // API Key (⚠️ move server-side in production)
  // const apiKey = import.meta.env.VITE_HEYGEN_API_KEY
  const apiKey = "YmNiZTAxOGYwMjZlNDdkNzhlNDI3OWU5MWYzZDg5ZDItMTcyMzAyMDkyNg=="

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (avatarRef.current && isConnected) {
        avatarRef.current.stopAvatar().catch(() => {})
      }
    }
  }, [isConnected])

  // Initialize microphone (optional; for voice chat UX)
  useEffect(() => {
    initializeMicrophone()
  }, [])

  // Auto scroll transcript
  useEffect(() => {
    if (chatLogRef.current) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight
    }
  }, [chatTranscript])

  // Chroma key processing to remove green screen
  useEffect(() => {
    if (!videoRef.current || !canvasRef.current || !isConnected) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    let animationId: number
    let isProcessing = false

    const processFrame = () => {
      if (!isProcessing) return
      
      if (video.readyState === video.HAVE_ENOUGH_DATA && video.videoWidth > 0) {
        // Set canvas size to match video
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
        }

        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        
        // Get image data for chroma key processing
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data

        // Chroma key: remove green pixels
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]

          // Detect green screen (adjust threshold as needed)
          // Green is dominant and significantly higher than red and blue
          if (g > 90 && g > r * 1.5 && g > b * 1.5) {
            // Make pixel transparent
            data[i + 3] = 0
          }
        }

        ctx.putImageData(imageData, 0, 0)
      }
      
      animationId = requestAnimationFrame(processFrame)
    }

    const startProcessing = () => {
      isProcessing = true
      processFrame()
    }

    // Start processing when video plays
    video.addEventListener('play', startProcessing)
    video.addEventListener('playing', startProcessing)
    
    // Start immediately if already playing
    if (!video.paused && video.readyState >= 2) {
      startProcessing()
    }

    return () => {
      isProcessing = false
      video.removeEventListener('play', startProcessing)
      video.removeEventListener('playing', startProcessing)
      if (animationId) cancelAnimationFrame(animationId)
    }
  }, [isConnected])

  const initializeMicrophone = async () => {
    try {
      userMediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true })
      addChatMessage('Microphone ready', 'system')
    } catch (error) {
      console.warn('Microphone access denied or not available:', error)
      addChatMessage('Microphone access not available', 'system')
    }
  }

  // ---- Smart joiner for streaming text (we buffer, then show once)
  const needsSpace = (prev: string, next: string) => {
    if (!prev || !next) return false
    const last = prev[prev.length - 1]
    const first = next[0]
    const noSpaceBefore = ",.!?;:%)]}›»\"'".split("")
    if (noSpaceBefore.includes(first)) return false
    const noSpaceAfter = "([{‹«\"'".split("")
    if (noSpaceAfter.includes(last)) return false
    if (first === "—" || first === "–") return last !== " " && !noSpaceAfter.includes(last)
    if (last === "—" || last === "–") return !/[,.!?;:]/.test(first)
    if (next.startsWith("'")) return false
    const prevIsAlnum = /[A-Za-z0-9]$/.test(prev)
    const nextIsAlnum = /^[A-Za-z0-9]/.test(next)
    if (prevIsAlnum && nextIsAlnum) return true
    return true
  }

  const normalizeFirstToken = (next: string) => next.replace(/^[\s,]+/, "")

  const smartAppend = (buffer: string, chunk: string) => {
    if (!chunk) return buffer
    const raw = String(chunk)
    let token = raw.replace(/\s+/g, " ")
    if (!buffer) token = normalizeFirstToken(token)
    if (token === "-" || token === "–") token = "—"
    if (/^\s+$/.test(token)) return buffer
    const addSpace = needsSpace(buffer, token)
    return buffer + (addSpace ? " " : "") + token
  }

  // ---- Transcript helpers (only user and avatar messages)
  const addChatMessage = (message: string, type: ChatMessage['type']) => {
    // Only add user and avatar messages to transcript, skip system messages
    if (type === 'user' || type === 'avatar') {
      setChatTranscript(prev => [...prev, { timestamp: new Date(), type, message }])
    }
  }

  const disconnectAvatar = async () => {
    try {
      if (avatarRef.current) {
        await avatarRef.current.stopAvatar()
        avatarRef.current = null
      }
      setIsConnected(false)
      setShowHeroImage(true)
      setAvatarBuffer('')
      avatarUtteranceOpen.current = false
      avatarHasFlushed.current = false
      listenersSetup.current = false
      addChatMessage('Disconnected from avatar', 'system')
    } catch (error) {
      console.error('Error disconnecting avatar:', error)
      addChatMessage('Error disconnecting from avatar', 'system')
    }
  }

  const initializeAvatar = async () => {
    if (!apiKey) {
      addChatMessage('API key not found', 'system')
      setIsLoading(false)
      return
    }
    if (isConnected || isLoading) return

    try {
      setIsLoading(true)
      const token = await fetchAccessToken()

      const avatar = new StreamingAvatar({ token })
      avatarRef.current = avatar
      setupEventListeners()

      const avatarConfig = {
        quality: AvatarQuality.High,
        avatarName: 'Thaddeus_ProfessionalLook_public',
        version: 'v2',
        knowledgeId: '2d6a4ab546da4b10885a3cc2658198f8',
        language: selectedLanguage
      }

      await avatarRef.current.createStartAvatar(avatarConfig)

      // Start built-in voice chat (keeps voice output on, mic unmuted)
      await avatarRef.current.startVoiceChat({ isInputAudioMuted: false })

      setIsConnected(true)
      setShowHeroImage(false)
      setIsMuted(false)
      addChatMessage('Avatar is ready to chat!', 'system')

      // Send initial greeting message
      setTimeout(async () => {
        if (avatarRef.current) {
          try {
            await avatarRef.current.speak({
              text: "Welcome to Troika Tech! 🌐 I'm SupaAgent — here to show you how AI Websites and Agents can grow your business faster. Want me to give you the short tour?",
              taskType: TaskType.REPEAT,
              taskMode: TaskMode.ASYNC
            })
          } catch (error) {
            console.error('Failed to send greeting:', error)
          }
        }
      }, 500)
    } catch (error: any) {
      console.error('Failed to initialize avatar:', error)
      addChatMessage(`Error: ${error?.message || 'Unknown error'}`, 'system')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAccessToken = async (): Promise<string> => {
    const response = await fetch('https://api.heygen.com/v1/streaming.create_token', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    const data = await response.json()
    return data.data.token
  }

  // ---- Events: buffer avatar chunks; flush once
  const setupEventListeners = () => {
    if (!avatarRef.current) return
    if (listenersSetup.current) return
    listenersSetup.current = true

    // Media is ready → attach to video
    avatarRef.current.on(StreamingEvents.STREAM_READY, (event: any) => {
      const stream = event?.detail
      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream
        videoRef.current.muted = false
        videoRef.current.volume = 1.0
        videoRef.current.play().catch(console.error)
      }
    })

    // Avatar speaking chunks → accumulate in buffer; mark utterance open
    avatarRef.current.on(StreamingEvents.AVATAR_TALKING_MESSAGE, (chunk: any) => {
      const text = extractText(chunk)
      if (!text) return

      // If this is the first chunk of a new utterance, reset guards & buffer
      if (!avatarUtteranceOpen.current) {
        avatarUtteranceOpen.current = true
        avatarHasFlushed.current = false
        setAvatarBuffer('') // reset for the new utterance
      }

      setAvatarBuffer(prev => smartAppend(prev, text))
    })

    // End signals → flush exactly once (voice has played; now show text)
    const safeFlushAvatar = () => {
      if (!avatarUtteranceOpen.current || avatarHasFlushed.current) return
      avatarHasFlushed.current = true
      avatarUtteranceOpen.current = false

      setAvatarBuffer(prev => {
        const finalText = prev.trim()
        if (finalText) addChatMessage(finalText, 'avatar')
        return ''
      })
    }

    // Listen to both; guard prevents duplicates
    avatarRef.current.on(StreamingEvents.AVATAR_STOP_TALKING, safeFlushAvatar)
    avatarRef.current.on(StreamingEvents.AVATAR_END_MESSAGE, safeFlushAvatar)

    // Optional: if SDK emits user text (not mic STT), log it too
    avatarRef.current.on(StreamingEvents.USER_TALKING_MESSAGE, (chunk: any) => {
      const text = extractText(chunk)
      if (text) addChatMessage(text, 'user')
    })
  }

  // Extract message text from various payload shapes
  const extractText = (data: any): string => {
    if (typeof data === 'string') return data.trim()
    if (data?.detail?.message) return String(data.detail.message).trim()
    if (data?.message) return String(data.message).trim()
    if (data?.text) return String(data.text).trim()
    if (data?.content) return String(data.content).trim()
    if (data?.data && typeof data.data === 'string') return data.data.trim()
    return ''
  }

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedLanguage(event.target.value)
  }

  // Text Chat: user types → bot speaks + one finalized text reply
  const sendTextMessage = async () => {
    if (!textMessage.trim() || !avatarRef.current || !isConnected) return
    
    const messageToSend = textMessage.trim()
    setTextMessage('')
    setIsSendingMessage(true)
    
    // Don't manually add user message here - let USER_TALKING_MESSAGE event handle it
    // This prevents duplicate messages in transcript
    
    try {
      // Use TaskType.TALK to send as conversational query (not just repeat)
      // Avatar will process through knowledge base and generate intelligent response
      await avatarRef.current.speak({
        text: messageToSend,
        taskType: TaskType.TALK,
        taskMode: TaskMode.ASYNC
      })
    } catch (error) {
      console.error('Failed to send text message:', error)
      addChatMessage('Error sending message', 'system')
    } finally {
      setIsSendingMessage(false)
    }
  }

  const toggleMicrophone = async () => {
    try {
      if (!isMuted) {
        setIsMuted(true)
        addChatMessage('Your microphone is muted', 'system')
        if (avatarRef.current) {
          try { await avatarRef.current.startVoiceChat({ isInputAudioMuted: true }) } catch {}
        }
        if (userMediaStreamRef.current) {
          userMediaStreamRef.current.getAudioTracks().forEach(t => (t.enabled = false))
        }
      } else {
        setIsMuted(false)
        addChatMessage('Your microphone is unmuted', 'system')
        if (avatarRef.current) {
          try { await avatarRef.current.startVoiceChat({ isInputAudioMuted: false }) } catch {}
        }
        if (userMediaStreamRef.current) {
          userMediaStreamRef.current.getAudioTracks().forEach(t => (t.enabled = true))
        } else {
          userMediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true })
        }
      }
    } catch (error) {
      console.error('Error toggling microphone:', error)
      addChatMessage('Error controlling microphone', 'system')
    }
  }

  return (
    <div className="app">
      {/* Header with Logo */}
      <div className="header">
        <div className="logo">
          <img src="/dashboard-logo.png" alt="TROIKA TECH Logo" className="header-logo" />
          <div className="logo-text">TROIKA TECH</div>
        </div>
      </div>
      
      <div className="container">
        {/* Main Video Card */}
        <div className={`main-card ${isTranscriptVisible ? '' : 'transcript-hidden'}`}>
          <div className="video-container">
            {/* Hidden video element for processing - positioned off-screen to ensure it loads */}
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted={false}
              style={{ 
                position: 'absolute', 
                top: '-9999px', 
                left: '-9999px',
                width: '1px',
                height: '1px'
              }}
            ></video>
            {/* Canvas for chroma key processed output */}
            <canvas ref={canvasRef}></canvas>

            {/* Hero Image Overlay */}
            {showHeroImage && (
              <div className="hero-image-overlay">
                <img src="/image.png" alt="Hero Image" className="hero-image" />
              </div>
            )}

            {/* Loading Overlay */}
            {isLoading && (
              <div className="loading-overlay show">
                <div className="loading-content">
                  <div className="loading-spinner">
                    <div className="spinner-ring"></div>
                    <div className="spinner-ring"></div>
                    <div className="spinner-ring"></div>
                  </div>
                  <div className="loading-text">Connecting Avatar...</div>
                  <div className="loading-dots">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            )}

            {/* Logo Overlay */}
            <div className="logo-overlay">
              <img src="/dashboard-logo.png" alt="Company Logo" className="company-logo" />
            </div>

            {/* Floating Controls */}
            <div className="floating-controls">
              <div className="floating-card">
                <div className="language-section">
                  <select 
                    className="language-select" 
                    value={selectedLanguage}
                    onChange={handleLanguageChange}
                    disabled={isConnected}
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="it">Italian</option>
                    <option value="pt">Portuguese</option>
                    <option value="nl">Dutch</option>
                    <option value="sv">Swedish</option>
                    <option value="no">Norwegian</option>
                    <option value="da">Danish</option>
                    <option value="fi">Finnish</option>
                    <option value="pl">Polish</option>
                    <option value="ru">Russian</option>
                    <option value="ja">Japanese</option>
                    <option value="ko">Korean</option>
                    <option value="zh">Chinese</option>
                    <option value="hi">Hindi</option>
                    <option value="ar">Arabic</option>
                    <option value="tr">Turkish</option>
                    <option value="th">Thai</option>
                    <option value="vi">Vietnamese</option>
                    <option value="id">Indonesian</option>
                    <option value="ms">Malay</option>
                    <option value="tl">Filipino</option>
                  </select>
                  <span className="dropdown-arrow">▼</span>
                </div>
                
                {isConnected && (
                  <button 
                    className={`mute-mic-btn ${isMuted ? 'muted' : ''}`}
                    onClick={toggleMicrophone}
                    title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
                  >
                    {isMuted ? <HiOutlineMicrophone size={16} /> : <HiMicrophone size={16} />}
                  </button>
                )}
                
                <button 
                  className="chat-now-btn"
                  onClick={isConnected ? disconnectAvatar : initializeAvatar}
                  disabled={isLoading}
                >
                  {isLoading ? 'Connecting...' : isConnected ? 'Disconnect' : 'Chat now'}
                </button>
              </div>
            </div>

            {/* View Mode Toggle Buttons */}
            <div className="transcript-toggle-container">
              <button 
                className={`transcript-toggle-btn ${isTranscriptVisible && viewMode === 'transcript' ? 'active' : ''}`}
                onClick={() => {
                  if (isTranscriptVisible && viewMode === 'transcript') {
                    setIsTranscriptVisible(false)
                  } else {
                    setIsTranscriptVisible(true)
                    setViewMode('transcript')
                  }
                }}
                data-tooltip="View conversation transcript"
                aria-label="Toggle Transcript View"
              >
                <HiChatBubbleLeftRight size={22} className="transcript-icon" />
              </button>
              <button 
                className={`view-mode-toggle-btn ${isTranscriptVisible && viewMode === 'textchat' ? 'active' : ''}`}
                onClick={() => {
                  if (isTranscriptVisible && viewMode === 'textchat') {
                    setIsTranscriptVisible(false)
                  } else {
                    setIsTranscriptVisible(true)
                    setViewMode('textchat')
                  }
                }}
                data-tooltip="Type messages to chat"
                aria-label="Toggle Text Chat View"
              >
                <HiChatBubbleLeft size={22} className="chat-icon" />
              </button>
            </div>

          </div>
        </div>

        {/* Chat Transcript Panel */}
        {isTranscriptVisible && viewMode === 'transcript' && (
          <div className="chat-transcript-panel show">
            <div className="chat-header">
              <h3>Chat Transcript</h3>
            </div>
            <div className="chat-log" ref={chatLogRef}>
              {chatTranscript.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">💬</div>
                  <div className="empty-state-text">Start a conversation!</div>
                  <div className="empty-state-subtext">Click "Chat now" to begin</div>
                </div>
              ) : (
                chatTranscript.map((entry, index) => (
                  <div key={index} className={`chat-message ${entry.type}`}>
                    <div className={`message-bubble ${entry.type}`}>
                      {entry.message}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Text Chat Panel */}
        {isTranscriptVisible && viewMode === 'textchat' && (
          <div className="chat-transcript-panel show">
            <div className="chat-header">
              <h3>Text Chat</h3>
            </div>
            <div className="chat-log" ref={chatLogRef}>
              {chatTranscript.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">💬</div>
                  <div className="empty-state-text">Start a conversation!</div>
                  <div className="empty-state-subtext">Type a message or use voice</div>
                </div>
              ) : (
                chatTranscript.map((entry, index) => (
                  <div key={index} className={`chat-message ${entry.type}`}>
                    <div className={`message-bubble ${entry.type}`}>
                      {entry.message}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="text-chat-input-container">
              <input
                type="text"
                className="text-chat-input"
                placeholder={isConnected ? "Type your message..." : "Connect to chat first..."}
                value={textMessage}
                onChange={(e) => setTextMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendTextMessage()
                  }
                }}
                disabled={!isConnected || isSendingMessage}
              />
              <button
                className="send-message-btn"
                onClick={sendTextMessage}
                disabled={!isConnected || !textMessage.trim() || isSendingMessage}
                title="Send Message"
              >
                <HiPaperAirplane size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App

