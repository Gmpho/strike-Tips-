# 📂 Project Structure

This document provides a high-level overview of the folders and files in the Horse Racing Analytics AI project. Understanding this structure is key to navigating the codebase and contributing effectively.

```
.
├── ADR/
│   └── 001-client-side-gemini-architecture.md  # Architecture Decision Records
├── components/
│   ├── AIChatCompanion.tsx     # Voice-native AI companion component
│   ├── Articles.tsx            # AI-generated news articles component
│   ├── Chatbot.tsx             # Text-based AI chat component
│   ├── Features.tsx            # Displays the three core feature cards
│   ├── Footer.tsx              # Application footer
│   ├── Header.tsx              # Main navigation header
│   ├── Hero.tsx                # Hero section for the landing page
│   ├── icons.tsx               # SVG icons used throughout the app
│   ├── PredictionDashboard.tsx # Main dashboard for live race data
│   ├── Pricing.tsx             # Pricing page component
│   ├── Story.tsx               # "Our Story" page component
│   └── ThemeToggle.tsx         # Light/dark mode toggle button
├── context/
│   ├── AuthContext.tsx         # Manages user authentication state
│   └── ThemeContext.tsx        # Manages light/dark theme state
├── lib/
│   ├── audio.ts                # Helpers for Text-to-Speech audio playback
│   └── gemini.ts               # Core logic for all Gemini API interactions
├── App.tsx                     # Main application component, handles routing
├── index.html                  # The single HTML page for the SPA
├── index.tsx                   # The entry point for the React application
├── metadata.json               # Application metadata and permissions
├── README.md                   # The main project README file
├── CONTRIBUTING.md             # Guidelines for contributing to the project
├── CODE_OF_CONDUCT.md          # Code of conduct for contributors
└── LICENSE                     # Project's MIT license
```

## Top-Level Files

-   `index.html`: The main HTML file that serves as the entry point for the web application. It includes the root div where the React app is mounted and imports necessary scripts.
-   `index.tsx`: The main TypeScript file that renders the root `App` component into the DOM.
-   `App.tsx`: The core component of the application. It manages the current view (page), orchestrates the main layout (Header, content, Footer), and houses the primary state for navigation.
-   `metadata.json`: Provides metadata about the application and declares necessary browser permissions (e.g., microphone).
-   `README.md`: The primary documentation for the project, providing an overview, feature list, and setup instructions.
-   `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `LICENSE`: Project governance and legal documents.

## `components/`

This directory contains all the React components that make up the user interface. Components are designed to be modular and reusable where possible.

-   **Page-Level Components**: `PredictionDashboard`, `AIChatCompanion`, `Articles`, `Chatbot`, `Story`, `Pricing`. These represent the main "views" of the application.
-   **Layout Components**: `Header`, `Footer`, `Hero`. These define the primary structure and branding of the application.
-   **UI Components**: `icons.tsx`, `ThemeToggle`. These are smaller, reusable UI elements.

## `context/`

This directory holds React Context providers for managing global state.

-   `AuthContext.tsx`: Handles the user's authentication status (signed in/out). This is a simple simulation and would be replaced with a more robust solution in a production environment.
-   `ThemeContext.tsx`: Manages the application's theme (light or dark mode) and persists the user's choice in local storage.

## `lib/`

This directory contains the core business logic and external service integrations, keeping them separate from the UI components.

-   `gemini.ts`: This is the most critical library file. It contains all functions responsible for communicating with the various Google Gemini APIs (`generateContent`, Search Grounding, etc.). It also defines the TypeScript types for the data structures used throughout the app (e.g., `Race`, `Horse`, `Article`).
-   `audio.ts`: Contains utility functions specifically for the Text-to-Speech (TTS) feature used in the dashboard, including audio decoding and playback management.

## `ADR/`

This directory contains Architecture Decision Records (ADRs). Each ADR is a short document that captures a significant architectural decision, including the context of the decision and its consequences. This practice ensures that the rationale behind the project's architecture is well-documented and understood over time.