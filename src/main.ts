import './style.css'
import StreamingAvatar, { AvatarQuality, StreamingEvents } from '@heygen/streaming-avatar'

// Get API key from environment variables
const apiKey = import.meta.env.VITE_HEYGEN_API_KEY

// DOM elements
const videoElement = document.getElementById('avatarVideo') as HTMLVideoElement
const chatNowBtn = document.getElementById('startBtn') as HTMLButtonElement
const floatingLanguageSelect = document.getElementById('floatingLanguageSelect') as HTMLSelectElement
const heroImageOverlay = document.querySelector('.hero-image-overlay') as HTMLDivElement
const loadingOverlay = document.getElementById('loadingOverlay') as HTMLDivElement

// Global variables
let avatar: StreamingAvatar | null = null
let isConnected = false

// Function to get access token
async function fetchAccessToken(): Promise<string> {
  try {
    console.log('API Key being used:', apiKey ? 'Present' : 'Missing')
    console.log('API Key length:', apiKey ? apiKey.length : 0)
    console.log('API Key:', apiKey)
    
    const response = await fetch("https://api.heygen.com/v1/streaming.create_token", {
      method: "POST",
      headers: {
        "X-Api-Key": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({})
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      console.error('API Error Response:', errorData)
      throw new Error(`HTTP error! status: ${response.status} - ${errorData.message || 'Unknown error'}`)
    }
    
    const data = await response.json()
    console.log('API Response:', data)
    console.log('Data structure:', JSON.stringify(data, null, 2))
    return data.data.token
  } catch (error) {
    console.error('Error fetching access token:', error)
    throw error
  }
}

// Function to add message to console
function addChatMessage(message: string, type: 'avatar' | 'user' | 'system') {
  // Log to console for debugging
  console.log(`[${type.toUpperCase()}] ${message}`)
}

// Function to show hero image
function showHeroImage() {
  if (heroImageOverlay) {
    heroImageOverlay.style.display = 'flex'
  }
}

// Function to hide hero image
function hideHeroImage() {
  if (heroImageOverlay) {
    heroImageOverlay.style.display = 'none'
  }
}

// Function to show loading overlay
function showLoading() {
  if (loadingOverlay) {
    loadingOverlay.classList.add('show')
  }
  // Disable controls during loading
  disableControls()
}

// Function to hide loading overlay
function hideLoading() {
  if (loadingOverlay) {
    loadingOverlay.classList.remove('show')
  }
  // Re-enable controls after loading
  enableControls()
}

// Function to disable controls
function disableControls() {
  if (chatNowBtn) {
    chatNowBtn.disabled = true
  }
  if (floatingLanguageSelect) {
    floatingLanguageSelect.disabled = true
  }
}

// Function to enable controls
function enableControls() {
  if (chatNowBtn) {
    chatNowBtn.disabled = false
  }
  if (floatingLanguageSelect) {
    floatingLanguageSelect.disabled = false
  }
}



// Function to get quality setting
function getQualitySetting(): AvatarQuality {
  // Default to medium quality since quality select is removed
  return AvatarQuality.Medium
}

// Function to request microphone permission
async function requestMicrophonePermission() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    console.log('Microphone permission granted')
    addChatMessage('Microphone permission granted', 'system')
    // Stop the stream as we just needed permission
    stream.getTracks().forEach(track => track.stop())
    return true
  } catch (error) {
    console.error('Microphone permission denied:', error)
    addChatMessage('Microphone permission denied. Please allow microphone access.', 'system')
    return false
  }
}

// Function to start avatar
async function startAvatar() {
  if (!apiKey) {
    addChatMessage('Error: API key not found. Please check your .env file.', 'system')
    return
  }

  try {
    // Show loading overlay when user clicks chat now
    showLoading()
    
    addChatMessage('🎤 Requesting microphone permission...', 'system')
    
    const micPermission = await requestMicrophonePermission()
    if (!micPermission) {
      addChatMessage('Error: Microphone permission required', 'system')
      hideLoading()
      return
    }
    
    addChatMessage('🔑 Initializing avatar connection...', 'system')
    
    const token = await fetchAccessToken()
    
    addChatMessage('🤖 Creating avatar session...', 'system')
    
    avatar = new StreamingAvatar({ token })
    
    // Set up event listeners
    setupEventListeners()
    
        const selectedLanguage = floatingLanguageSelect.value || 'en'
    console.log('Selected language:', selectedLanguage)
    addChatMessage(`Starting avatar with language: ${selectedLanguage}`, 'system')
    
    // Use the selected language code directly
    const languageCode = selectedLanguage
    console.log('Using language code:', languageCode)
    addChatMessage(`Using language code: ${languageCode}`, 'system')
    
        // Create the avatar configuration
        const avatarConfig: any = {
          quality: getQualitySetting(),
          avatarName: 'Thaddeus_Chair_Sitting_public',
          version: 'v2',
          knowledgeId: '579492733dfb4075ae87289979558b0f',
          language: languageCode
        }
    
    console.log('Avatar configuration:', avatarConfig)
    addChatMessage(`Avatar config: ${JSON.stringify(avatarConfig, null, 2)}`, 'system')
    
    const sessionInfo = await avatar.createStartAvatar(avatarConfig)
    
    console.log('Session Info:', sessionInfo)
    console.log('Session Info structure:', JSON.stringify(sessionInfo, null, 2))
    
    addChatMessage('🔗 Connecting to avatar stream...', 'system')
    
    // Set up video element before starting avatar
    if (avatar.mediaStream) {
      videoElement.srcObject = avatar.mediaStream
    }
    
    // Hide hero image when avatar starts
    hideHeroImage()
    
    await avatar.startVoiceChat({
      isInputAudioMuted: false
    })
    
    // Hide loading overlay when avatar is ready
    hideLoading()
    
    // Set up audio for the video element
    if (videoElement) {
      videoElement.muted = false
      videoElement.volume = 1.0
      console.log('Video element audio setup:', {
        muted: videoElement.muted,
        volume: videoElement.volume,
        srcObject: videoElement.srcObject
      })
    }
    
    // Check if we have audio tracks
    if (avatar.mediaStream) {
      const audioTracks = avatar.mediaStream.getAudioTracks()
      console.log('Audio tracks found:', audioTracks.length)
      addChatMessage(`Audio tracks found: ${audioTracks.length}`, 'system')
    }
    
        addChatMessage(`🎉 Avatar is ready and connected! Language: ${floatingLanguageSelect.value}`, 'system')
    isConnected = true
    chatNowBtn.disabled = false
    chatNowBtn.textContent = 'Stop'
    
    // Keep language selector disabled during active session
    if (floatingLanguageSelect) {
      floatingLanguageSelect.disabled = true
    }
    
    
    // Add visual feedback
    // Visual feedback handled by button states
    
    // Floating controls are always visible
    
  } catch (error) {
    console.error('Error starting avatar:', error)
    
    // Try to get more detailed error information
    let errorMessage = 'Unknown error'
    if (error instanceof Error) {
      errorMessage = error.message
      
      // Check if it's an API error with more details
      if (error.message.includes('400')) {
        errorMessage = 'API Error 400: Invalid request parameters. This might be due to unsupported language code or invalid configuration.'
        addChatMessage('Error: The selected language might not be supported by HeyGen API', 'system')
        addChatMessage('Try using English (en-US) first to test the connection', 'system')
      }
    }
    
    hideLoading()
    addChatMessage(`Connection error: ${errorMessage}`, 'system')
  }
}

// Function to stop avatar
async function stopAvatar() {
  if (avatar && isConnected) {
    try {
      addChatMessage('Stopping avatar session...', 'system')
      
      await avatar.stopAvatar()
      avatar = null
      isConnected = false
      
      addChatMessage('Avatar session ended', 'system')
      
      chatNowBtn.disabled = false
      chatNowBtn.textContent = 'Chat now'
      
      // Re-enable language selector when avatar stops
      if (floatingLanguageSelect) {
        floatingLanguageSelect.disabled = false
      }
      
      // Clear video element
      videoElement.srcObject = null
      
      // Show hero image when avatar stops
      showHeroImage()
      
    } catch (error) {
      addChatMessage(`Error stopping avatar: ${error instanceof Error ? error.message : 'Unknown error'}`, 'system')
      console.error('Error stopping avatar:', error)
    }
  }
}


// Function to setup event listeners
function setupEventListeners() {
  if (!avatar) return
  
  // Avatar talking events
  avatar.on(StreamingEvents.AVATAR_TALKING_MESSAGE, (data: any) => {
    console.log('Avatar message:', data)
    addChatMessage(`Avatar: ${data.message || data}`, 'avatar')
  })
  
  // User talking events
  avatar.on(StreamingEvents.USER_TALKING_MESSAGE, (data: any) => {
    console.log('User message:', data)
    addChatMessage(`User: ${data.message || data}`, 'user')
  })
  
  // Avatar talking start/stop events
  avatar.on(StreamingEvents.AVATAR_START_TALKING, () => {
    console.log('Avatar started talking')
    addChatMessage('Avatar started talking...', 'system')
  })
  
  avatar.on(StreamingEvents.AVATAR_STOP_TALKING, () => {
    console.log('Avatar stopped talking')
    addChatMessage('Avatar stopped talking', 'system')
  })
  
  // User talking start/stop events
  avatar.on(StreamingEvents.USER_START, () => {
    console.log('User started talking')
    addChatMessage('User started talking...', 'system')
  })
  
  avatar.on(StreamingEvents.USER_STOP, () => {
    console.log('User stopped talking')
    addChatMessage('User stopped talking', 'system')
  })
  
  // Stream events
  avatar.on(StreamingEvents.STREAM_READY, () => {
    console.log('Stream ready')
    addChatMessage('Avatar stream is ready', 'system')
  })
  
  avatar.on(StreamingEvents.STREAM_DISCONNECTED, () => {
    console.log('Stream disconnected')
    addChatMessage('Avatar stream disconnected', 'system')
  })
  
  // Connection quality events
  avatar.on(StreamingEvents.CONNECTION_QUALITY_CHANGED, (data: any) => {
    console.log('Connection quality changed:', data)
    addChatMessage(`Connection quality: ${data.quality || 'unknown'}`, 'system')
  })
}

// Function to change language
async function changeLanguage() {
  const newLanguage = floatingLanguageSelect.value
  addChatMessage(`Language changed to: ${newLanguage}`, 'system')
  
  // Sync floating language selector
  floatingLanguageSelect.value = newLanguage
  
  // Check if the language is supported
  const supportedLanguages = ['en-US', 'en-GB', 'en-AU', 'en-CA', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'sv', 'no', 'da', 'fi', 'pl', 'ru', 'ja', 'ko', 'zh', 'hi', 'ar', 'tr', 'th', 'vi', 'id', 'ms', 'tl']
  
  if (!supportedLanguages.includes(newLanguage)) {
    addChatMessage(`Warning: Language ${newLanguage} might not be fully supported. Some features may not work correctly.`, 'system')
  }
  
  // If avatar is connected, restart it with new language
  if (avatar && isConnected) {
    addChatMessage('Restarting avatar with new language...', 'system')
    try {
      await stopAvatar()
      // Small delay to ensure clean shutdown
      setTimeout(() => {
        startAvatar()
      }, 1000)
    } catch (error) {
      console.error('Error restarting avatar:', error)
      addChatMessage(`Error restarting avatar: ${error instanceof Error ? error.message : 'Unknown error'}`, 'system')
    }
  } else {
    addChatMessage('Language will be applied when you start the avatar.', 'system')
  }
}

// Function to change language from floating selector
async function changeFloatingLanguage() {
  // const newLanguage = floatingLanguageSelect.value
  // languageSelect is removed, only use floatingLanguageSelect
  await changeLanguage()
}



// Event listeners for UI controls
chatNowBtn.addEventListener('click', () => {
  if (isConnected) {
    stopAvatar()
  } else {
    startAvatar()
  }
})
floatingLanguageSelect.addEventListener('change', changeFloatingLanguage)

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
  addChatMessage('🚀 TROIKA TECH Avatar Demo initialized. Click "Chat now" to begin.', 'system')
  
  
  // Check if API key is available
  if (!apiKey) {
    addChatMessage('⚠️ Warning: API key not found. Please check your .env file.', 'system')
  }
})

// Handle page unload
window.addEventListener('beforeunload', () => {
  if (avatar && isConnected) {
    avatar.stopAvatar()
  }
})