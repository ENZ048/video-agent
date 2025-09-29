# Streaming Avatar Demo

A modern web application demonstrating the HeyGen Streaming Avatar SDK integration with Vite and TypeScript.

## Features

- 🎥 Real-time streaming avatar video
- 🎤 Voice interaction with conversation logging
- ⚙️ Configurable avatar settings (quality, language)
- 📱 Responsive design with modern UI
- 🔧 TypeScript support with full type safety
- 🎨 Beautiful gradient UI with glassmorphism effects

## Prerequisites

- Node.js (version 16 or higher)
- npm or yarn
- HeyGen API key

## Installation

1. Clone or download this project
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your environment variables:
   - Copy the `.env` file and add your HeyGen API key:
   ```bash
   VITE_HEYGEN_API_KEY=your_api_key_here
   ```

## Usage

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open your browser and navigate to the provided local URL (usually `http://localhost:5173`)

3. Click "Start Avatar" to initialize the streaming avatar

4. Use the controls to:
   - Start/stop the avatar session
   - Mute/unmute audio
   - Change avatar quality and language settings
   - View real-time conversation logs

## Configuration

### Avatar Settings

- **Quality**: Choose between Low, Medium, and High quality settings
- **Language**: Select from multiple supported languages (English, Spanish, French, German, etc.)
- **Avatar**: Currently supports default avatar (can be extended with specific avatar IDs)

### Environment Variables

- `VITE_HEYGEN_API_KEY`: Your HeyGen API key (required)

## Project Structure

```
streaming-avatar-demo/
├── src/
│   ├── main.ts          # Main application logic
│   ├── style.css        # Styling and responsive design
│   └── vite-env.d.ts    # TypeScript environment definitions
├── index.html           # HTML template
├── .env                 # Environment variables
├── package.json         # Dependencies and scripts
└── tsconfig.json        # TypeScript configuration
```

## Key Features Implementation

### SDK Integration
- Uses `@heygen/streaming-avatar` for avatar functionality
- Implements proper error handling and connection management
- Supports all major streaming events and callbacks

### Event Handling
- Real-time conversation logging
- Avatar and user talking detection
- Connection status monitoring
- Error handling and user feedback

### UI/UX
- Modern, responsive design
- Real-time status updates
- Interactive controls
- Conversation history display

## Security Notes

⚠️ **Important**: The current implementation fetches access tokens directly from the frontend. For production use, it's recommended to:

1. Move the `fetchAccessToken` function to a backend service
2. Implement proper authentication and authorization
3. Use secure token management practices

## Troubleshooting

### Common Issues

1. **API Key Error**: Ensure your `.env` file contains a valid HeyGen API key
2. **Connection Issues**: Check your internet connection and API key validity
3. **Video Not Loading**: Ensure your browser supports the required video codecs
4. **Audio Issues**: Check browser permissions for microphone access

### Browser Compatibility

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## License

This project is for demonstration purposes. Please ensure you comply with HeyGen's terms of service when using their API.

## Support

For issues related to:
- This demo application: Check the troubleshooting section above
- HeyGen API: Refer to the official HeyGen documentation
- Vite/TypeScript: Check the respective documentation
