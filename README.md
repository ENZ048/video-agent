# HeyGen Video Agent - React App

A modern React application for interacting with HeyGen's AI avatar using their streaming SDK.

## Features

- 🤖 **AI Avatar Integration**: Real-time video streaming with HeyGen's AI avatar
- 💬 **Chat Transcript**: Side-by-side chat interface with message bubbles
- 🎤 **Microphone Control**: Mute/unmute functionality with visual feedback
- 🎨 **Modern UI**: Clean, responsive design with smooth animations
- ⚡ **React Icons**: Professional icon library integration
- 📱 **Responsive**: Works on desktop and mobile devices

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **React Icons** for consistent iconography
- **HeyGen Streaming Avatar SDK** for AI avatar functionality
- **CSS3** with modern features (Flexbox, Grid, Animations)

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn
- HeyGen API key

### Installation

1. **Clone and navigate to the React app:**
   ```bash
   cd video-agent-react
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the root directory:
   ```env
   VITE_HEYGEN_API_KEY=your_api_key_here
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to `http://localhost:3000`

## Project Structure

```
video-agent-react/
├── src/
│   ├── App.tsx          # Main React component
│   ├── App.css          # Styles (converted from vanilla CSS)
│   ├── main.tsx         # React entry point
│   └── index.css        # Base styles
├── public/              # Static assets
├── .env                 # Environment variables
├── vite.config.ts       # Vite configuration
└── package.json         # Dependencies and scripts
```

## Key Components

### App.tsx
The main React component that handles:
- Avatar initialization and management
- Chat transcript state
- Microphone control
- Message sending and receiving
- UI state management

### Features

#### 1. Avatar Integration
- Uses HeyGen's StreamingAvatar SDK
- Real-time video streaming
- Voice chat capabilities
- Event-driven communication

#### 2. Chat Interface
- Message bubbles with different styles for avatar/user/system
- Real-time message updates
- Auto-scrolling chat log
- Message input with Enter key support

#### 3. Controls
- **Transcript Toggle**: Show/hide chat panel
- **Microphone Mute**: Toggle audio input
- **Send Message**: Send text messages to avatar

#### 4. Responsive Design
- 70% video width when transcript is hidden
- 70% video + 25% transcript when visible
- Mobile-friendly layout
- Smooth animations and transitions

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_HEYGEN_API_KEY` | Your HeyGen API key | Yes |

## API Integration

The app integrates with HeyGen's API for:
- Token generation
- Avatar session creation
- Voice chat functionality
- Real-time streaming

## Styling

The app uses modern CSS features:
- CSS Custom Properties (variables)
- Flexbox for layout
- CSS Grid for complex layouts
- Smooth transitions and animations
- Responsive design patterns

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Development

### Adding New Features

1. **New Components**: Create in `src/components/`
2. **Styling**: Add to `App.css` or create component-specific CSS
3. **State Management**: Use React hooks (useState, useEffect)
4. **API Integration**: Add to the appropriate service functions

### Code Style

- TypeScript for type safety
- Functional components with hooks
- Consistent naming conventions
- Proper error handling
- Clean, readable code

## Troubleshooting

### Common Issues

1. **API Key Not Working**
   - Check your `.env` file
   - Ensure the key is valid and has proper permissions

2. **Avatar Not Loading**
   - Check browser console for errors
   - Verify network connection
   - Check API key validity

3. **Microphone Issues**
   - Grant microphone permissions
   - Check browser compatibility
   - Try refreshing the page

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- Check the browser console for errors
- Review the HeyGen SDK documentation
- Open an issue in the repository
