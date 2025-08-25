# Sager Drone Tracking System

A real-time drone tracking system built with React, MapLibre GL, and WebSocket integration. This application visualizes drone positions on an interactive map, showing flight paths, authorization status, and real-time telemetry data.

## 🚁 Features

- **Real-time Tracking**: Live drone position updates via WebSocket
- **Interactive Map**: MapLibre GL-based map with drone visualization
- **Authorization System**: Color-coded drones based on registration (Green = Authorized, Red = Unauthorized)
- **Flight Paths**: Visual representation of drone trajectories
- **Drone Selection**: Click on drones in the list or map to focus and track
- **Hover Information**: Altitude and flight time displayed on hover
- **Responsive Design**: Optimized for desktop and mobile devices
- **Performance Optimized**: Handles thousands of drones efficiently

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── layout/         # Layout components (Header, Layout)
│   ├── map/           # Map-related components
│   ├── sidebar/       # Sidebar and drone list components
│   └── ui/            # Reusable UI components
├── lib/               # External libraries and configurations
├── store/             # Zustand state management
├── hooks/             # Custom React hooks
├── utils/             # Utility functions
└── styles/            # Global styles
```

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ and npm/yarn
- MapTiler API key (free tier available)
- Running backend server (provided separately)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd sager-drone-tracking
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment setup**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your MapTiler API key:

   ```env
   VITE_MAP_KEY=your_maptiler_api_key_here
   VITE_SOCKET_URL=http://localhost:9013
   ```

4. **Start the development server**

   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Start the backend** (in a separate terminal)
   ```bash
   cd backend
   npm start
   ```

The application will be available at `http://localhost:3000`

## 🏗️ Architecture

### State Management

- **Zustand**: Lightweight state management for drone data
- **Real-time Updates**: WebSocket integration with automatic UI updates
- **Performance**: Optimized rendering with frame-limited updates

### Key Components

- **DroneMap**: MapLibre GL integration with drone visualization
- **Sidebar**: Drone list with filtering and selection
- **DroneCard**: Individual drone information display
- **RedCounter**: Real-time counter for unauthorized drones

### Data Flow

1. **Backend** sends drone data via WebSocket
2. **Socket Hook** receives and processes data
3. **Store** updates drone state
4. **Components** reactively update UI
5. **Map** renders updated positions and paths

## 🎨 UI/UX Features

### Visual Design

- Dark theme optimized for monitoring environments
- Color-coded drone status (Green/Red authorization system)
- Professional aviation-inspired interface
- Responsive layout with proper information hierarchy

### Interactions

- **Map Controls**: Zoom, pan, and hover interactions
- **Drone Selection**: Synchronized between map and list
- **Real-time Updates**: Smooth animations and transitions
- **Flight Information**: Hover popups with telemetry data

## 📊 Performance Optimizations

- **Frame-limited Updates**: Prevents excessive re-renders
- **Efficient Data Structures**: Optimized drone storage and lookup
- **Trail Management**: Automatic cleanup of old position data
- **Memory Management**: Prevents memory leaks in long-running sessions

## 🔧 Configuration

### Environment Variables

- `VITE_MAP_KEY`: MapTiler API key for map tiles
- `VITE_SOCKET_URL`: Backend WebSocket server URL
- `VITE_DEBUG`: Enable debug logging

### Map Configuration

Edit `src/lib/constants.js` to customize:

- Map center coordinates
- Zoom levels
- Trail length limits
- Color schemes

## 🧪 Development

### Code Style

- ESLint configuration for code quality
- Component-based architecture
- Custom hooks for logic separation
- Utility functions for common operations

### Building for Production

```bash
npm run build
# or
yarn build
```

### Preview Production Build

```bash
npm run preview
# or
yarn preview
```

## 🚀 Deployment

The application can be deployed to any static hosting service:

- **Vercel**: `vercel --prod`
- **Netlify**: Drag and drop the `dist` folder
- **GitHub Pages**: Use GitHub Actions workflow
- **AWS S3**: Upload `dist` folder to S3 bucket

## 📝 API Integration

### WebSocket Events

```javascript
// Incoming drone data format
{
  "type": "FeatureCollection",
  "features": [{
    "type": "Feature",
    "properties": {
      "serial": "ABCD123456",
      "registration": "SD-B12",
      "Name": "DJI Mavic 3 Pro",
      "altitude": 85,
      "pilot": "John Doe",
      "organization": "Sager Drone",
      "yaw": 135
    },
    "geometry": {
      "coordinates": [35.9313, 31.9488],
      "type": "Point"
    }
  }]
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- Create an issue on GitHub
- Contact the development team
- Check the documentation

## 🙏 Acknowledgments

- MapTiler for map tiles and services
- React and Vite communities
- Open source contributors
