# MangaColorize AI 🎨✨

![MangaColorize Banner](https://via.placeholder.com/1200x400/0f172a/00eaff?text=MangaColorize+AI)

**MangaColorize AI** is a sophisticated web application powered by **Google Gemini 2.5 Flash** that instantly transforms black-and-white manga pages into high-quality, fully colored anime-style illustrations while intelligently preserving text bubbles and dialogue clarity.

🔗 **[TRY IT LIVE ON GOOGLE AI STUDIO](https://aistudio.google.com/apps/drive/1661XBdxu-vT6HHlRdBrfxrc9P87qLfz_?fullscreenApplet=true&showPreview=true&showAssistant=true)**

---

## 🚀 Key Features

### 🧠 AI-Powered Colorization
*   **Smart Segmentation:** Utilizes Gemini's multimodal capabilities to distinguish between character line art, background environments, and speech bubbles.
*   **Full Coverage:** Strictly enforced logic to eliminate all white space (except dialogue) and ensure vibrant, opaque coloring.
*   **Context Awareness:** Optional "Manga Title" input allows the AI to recall and apply canon-accurate colors for specific characters and locations (e.g., "One Piece", "Naruto").

### 🎨 Flexible Styling Engine
Choose from distinct artistic directions or create your own:
*   **Vibrant Anime:** Cel-shaded, high saturation, classic anime look.
*   **Soft Pastel:** Shoujo-style watercolor aesthetic.
*   **Lush Painterly:** Digital painting style with soft blending and rich textures.
*   **Dark & Gritty:** Seinen/Fantasy atmosphere with dramatic lighting.
*   **Retro 90s:** Vintage technicolor aesthetic.
*   **Custom Prompts:** Input specific text instructions to direct the color palette and mood.

### 🛠️ Advanced Editing & Refinement
*   **Auto Improve:** One-click fix for images where the AI missed spots or left areas black and white.
*   **Custom Fix:** Send specific text instructions to tweak the result (e.g., "Make the jacket blue").
*   **Visual Red Mask:** Draw directly on the generated image to highlight specific areas for the AI to fix or recolor.

### 📦 Batch Processing Workflow
*   **Bulk Upload:** Drag and drop entire folders or multiple files.
*   **Queue Management:** Real-time progress bar with pause/stop functionality.
*   **View Modes:**
    *   **Grid View:** Visual overview of all results.
    *   **List View:** Detailed status with collapsible preview panels.
*   **Download All:** Export all processed images as a single **ZIP file**.

### ⚡ Interactive UI
*   **Compare Slider:** Interactive "Before vs After" slider for single image processing.
*   **Hold-to-Compare:** Instantly peek at the original B&W source during batch review.
*   **Responsive Design:** Fully functional on desktop and touch devices.

---

## 💻 Tech Stack

*   **Frontend:** React 19, TypeScript, Vite
*   **Styling:** Tailwind CSS
*   **AI Model:** Google Gemini API (`gemini-2.5-flash-image`)
*   **Utilities:** JSZip (Compression), FontAwesome (Icons)

---

## 🔧 Installation & Local Development

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/manga-colorize-ai.git
    cd manga-colorize-ai
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Set up API Key**
    *   Get your API key from [Google AI Studio](https://aistudiocdn.com/apikey).
    *   Set it in your environment variables (e.g., `.env` file):
        ```env
        API_KEY=your_google_gemini_api_key
        ```

4.  **Run the development server**
    ```bash
    npm run dev
    ```

---

## 📖 How to Use

1.  **Upload:** Drag and drop a manga page (or multiple files) into the dropzone.
2.  **Configure:**
    *   (Optional) Enter the **Manga Title** for better color accuracy.
    *   Select an **Art Style** (Vibrant, Pastel, etc.).
3.  **Colorize:** Click the button to start processing.
4.  **Refine (If needed):**
    *   Use **Auto Improve** if parts are still black and white.
    *   Use **Custom Fix** -> **Draw Mask** to circle an area and tell the AI to change it.
5.  **Download:** Save individual images or download the entire batch as a ZIP.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open-source and available under the MIT License.
