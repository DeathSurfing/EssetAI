# esset.ai | AI Website Builder

Transform Google Maps business links into production-ready website prompts and designs with AI. Built with Next.js 16, React 19, and modern web technologies.

![esset.ai](https://img.shields.io/badge/esset.ai-Next.js%2016-blue?style=flat-square)
![React](https://img.shields.io/badge/React-19.2.3-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.0-06B6D4?style=flat-square&logo=tailwindcss)

## ✨ Features

- **AI-Powered Generation**: Transform Google Maps business URLs into comprehensive website design prompts
- **Smart Business Context Extraction**: Automatically extracts business details, location, and industry context
- **Section-Based Output**: Generates structured prompts with 8 key sections:
  - Project Context
  - Business Overview
  - Target Audience
  - Design Direction
  - Site Structure
  - Content Guidelines
  - Primary Call-to-Action
  - Location Context
- **Interactive Prompt Editor**: Regenerate, edit, and refine individual sections with AI assistance
- **Prompt History**: Save, search, and revisit previous website prompts
- **Quality Scoring**: Real-time prompt quality assessment and improvement suggestions
- **Location Visualization**: Embeds interactive Google Maps locations
- **Dark/Light Mode**: Full theme support with seamless transitions
- **Animations**: Smooth GSAP-powered transitions and micro-interactions
- **Streaming Output**: Real-time prompt generation with streaming text display
- **Mobile Responsive**: Optimized experience across all devices

## 🚀 Quick Start

### Prerequisites

- Node.js 18.17 or later
- Bun package manager (recommended) or npm
- OpenAI API key or OpenRouter API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/esset-ai.git
cd esset-ai
```

2. Install dependencies:
```bash
bun install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

4. Add your API keys to `.env.local`:
```env
OPENROUTER_API_KEY=your_openrouter_api_key
```

5. Run the development server:
```bash
bun dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📁 Project Structure

```
esset-ai/
├── app/                        # Next.js App Router
│   ├── api/                    # API Routes
│   │   ├── generate/           # AI generation endpoint
│   │   └── regenerate-section/ # Section regeneration endpoint
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Root layout with fonts & theme
│   └── page.tsx                # Main application page
├── components/                 # React Components
│   ├── ai-elements/           # AI interaction components
│   ├── section/               # Section management components
│   ├── ui/                    # Reusable UI components
│   ├── InputView.tsx          # URL input interface
│   ├── OutputView.tsx         # Prompt output display
│   ├── Sidebar.tsx            # History sidebar
│   ├── GenerateAnimation.tsx  # Generation animations
│   └── ...
├── hooks/                      # Custom React Hooks
│   ├── usePromptGeneration.ts # Prompt generation logic
│   ├── useSectionManagement.ts # Section CRUD operations
│   └── usePromptHistory.ts    # History management
├── lib/                        # Utility Functions
│   ├── location-parser.ts     # Google Maps URL parsing
│   ├── nominatim.ts           # Geocoding service
│   ├── prompt-parser.ts       # Prompt parsing utilities
│   ├── prompt-quality.ts      # Quality scoring algorithm
│   ├── url-expander.ts        # URL expansion/validation
│   └── ...
└── public/                     # Static assets
```

## 🏗️ Architecture

### Core Technologies

- **Framework**: Next.js 16.1.6 with App Router
- **Runtime**: React 19.2.3
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS 4.x
- **UI Components**: Radix UI primitives
- **Animations**: GSAP 3.x + Framer Motion
- **Icons**: Lucide React + Hugeicons
- **Streaming**: Custom streaming implementation

### Data Flow

1. **Input**: User enters a Google Maps URL
2. **Parsing**: URL is expanded and parsed to extract business details
3. **Geocoding**: Location coordinates are resolved via Nominatim
4. **AI Generation**: OpenAI/OpenRouter generates structured website prompts
5. **Streaming**: Results stream to the UI in real-time
6. **Persistence**: Prompts are saved to browser localStorage

### API Endpoints

- `POST /api/generate` - Generate complete website prompt from Google Maps URL
- `POST /api/regenerate-section` - Regenerate a specific section with custom instructions

## 🎨 Design System

### Typography

- **Display**: Playfair Display - Editorial headings
- **Body**: Inter - Clean, geometric sans-serif
- **Mono**: JetBrains Mono - Code and prompts

### Color Palette

- Background: Dynamic (light/dark mode)
- Accent: Custom CSS variables for theming
- Semantic colors via Tailwind CSS

### Components

Built on Radix UI primitives with custom styling:
- Buttons
- Cards
- Inputs
- Dialogs
- Selects
- Toast notifications

## 🔧 Development

### Available Scripts

```bash
bun dev          # Start development server
bun build        # Build for production
bun start        # Start production server
bun lint         # Run ESLint
```

### Code Style

- **ESLint**: Next.js recommended configuration
- **TypeScript**: Strict mode enabled
- **Tailwind**: Custom design tokens via CSS variables

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENROUTER_API_KEY` | Alternative AI provider key | Yes* |

*At least one AI provider key is required

## 📝 Usage Guide

### Generating a Website Prompt

1. **Enter URL**: Paste a Google Maps business URL into the input field
2. **Generate**: Click the generate button to start AI processing
3. **Watch Animation**: Enjoy the generation animation while AI works
4. **Review Output**: View the structured prompt with 8 sections
5. **Edit Sections**: Click any section to regenerate, edit, or undo
6. **Save**: Prompts are automatically saved to history

### Managing History

- **View History**: Open the sidebar to see all generated prompts
- **Search**: Use the search bar to filter prompts by business name
- **Revisit**: Click any prompt to reload it
- **Delete**: Remove prompts you no longer need

### Customizing Sections

1. Click any section header
2. Choose action:
   - **Regenerate**: Provide custom instructions for AI
   - **Edit**: Manually modify the content
   - **Undo**: Revert to previous version

## 🚀 Deployment

### Vercel (Recommended)

The easiest way to deploy esset.ai:

```bash
bun install -g vercel
vercel
```

Or connect your GitHub repository to [Vercel](https://vercel.com).

### Self-Hosting

1. Build the application:
```bash
bun build
```

2. Start the production server:
```bash
bun start
```

3. Configure environment variables on your hosting platform

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org) - The React Framework
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS framework
- [Radix UI](https://radix-ui.com) - Headless UI components
- [GSAP](https://greensock.com/gsap) - Professional animation library
- [Nominatim](https://nominatim.org) - OpenStreetMap geocoding service

---

Built with ❤️ by the esset.ai team
