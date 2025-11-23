<div align="center">
<img width="800" height="575" alt="GHBanner" src="\screen1.PNG" />
</div>

# MangaColorize AI 🎨✨

A sophisticated web application powered by Google Gemini 2.5 Flash that instantly transforms black-and-white manga pages into high-quality, fully colored anime-style illustrations while intelligently preserving text bubbles and dialogue clarity.

## Run and deploy your AI Studio app

This contains everything you need to run your app locally.

Test the app with this link : https://ai.studio/apps/drive/1661XBdxu-vT6HHlRdBrfxrc9P87qLfz_?fullscreenApplet=true


## 🚀 Key Features

AI-Powered Colorization

    Smart Segmentation: Utilizing Gemini's multimodal capabilities to distinguish between character line art, background environments, and speech bubbles.

    Full Coverage: Strictly enforced logic to eliminate all white space (except dialogue) and ensure vibrant, opaque coloring.

    Context Awareness: Optional "Manga Title" input allows the AI to recall and apply canon-accurate colors for specific characters and locations.

Flexible Styling Engine

    Preset Styles: Choose from distinct artistic directions:

        Vibrant Anime (Cel-shaded, high saturation)

        Soft Pastel (Shoujo-style watercolor)

        Lush Painterly (Digital painting, soft blending)

        Dark & Gritty (Seinen/Fantasy atmosphere)

        Retro 90s (Vintage technicolor aesthetic)

    Custom Prompts: Advanced users can input custom text instructions to direct the color palette and mood.

Batch Processing Workflow

    Bulk Upload: Drag and drop entire folders or multiple files at once.

    Queue Management: Real-time progress bar, percentage status, and processed/remaining counters.

    Control: Pause/Stop functionality for large batches.

    View Modes: Toggle between a visual Grid View or a detailed List View for managing large queues.

Interactive UI & UX

    Comparison Tools:

        Slider View: Interactive "Before vs After" slider for single image processing.

        Hold-to-Compare: Tactile button to instantly peek at the original B&W source during batch review.

    Download Options: Export individual images or Download All as ZIP for batch results.

    Error Handling: Individual retry mechanisms for failed generations without restarting the entire batch.

    Collapsible Config: Clean interface with expandable options to focus on the artwork.

🛠 Tech Stack

    Frontend: React 19, TypeScript, Vite

    AI Model: Google Gemini API (gemini-2.5-flash-image)

    Styling: Tailwind CSS

    Utilities: JSZip (Compression), FontAwesome (Icons)



## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Screen
<div align="center">
<img width="1200" height="675" alt="GHBanner" src="\screen2.PNG" />
</div>
