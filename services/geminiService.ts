import { GoogleGenAI } from "@google/genai";
import { ColorizationStyle } from "../types";

// Initialize the client
// API Key must be provided via environment variable process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const STYLE_PROMPTS: Record<string, string> = {
  vibrant: "Expertly colorized manga page, full color, anime style cel shading, vibrant and distinct colors for every element, maintain original line art and composition exactly, no grayscale remaining, no black and white parts, high resolution, 4k.",
  pastel: "Style: Shoujo Watercolor Illustration. Soft, dreamy aesthetic with full color washes. Use pinks, purples, and soft blues to fill the entire canvas. Ensure no paper white remains exposed.",
  gritty: "Style: Seinen/Dark Fantasy. Realistic textures, heavy atmosphere, dramatic lighting. Deep earth tones and shadows. Eliminate all pure white space outside of text bubbles.",
  retro: "Style: Vintage 90s Cel-Animation. Technicolor palette, flat colors, hard shadows. Classic anime look with full color density. Paint over all sketch lines.",
  painterly: "Style: Lush Digital Painting. Soft, blended brushstrokes, no hard cel-shading. Rich, deep colors with high dynamic range. Atmospheric lighting, volumetric fog, and detailed texture rendering. Make it look like a high-end digital illustration or cover art."
};

/**
 * Colorizes a manga page using Gemini Flash Image model.
 * @param base64Image The raw base64 string of the image (without data prefix).
 * @param mimeType The mime type of the image (e.g., 'image/png').
 * @param style The selected colorization style.
 * @param mangaTitle Optional title of the manga for context.
 * @param customPrompt Optional custom instructions if style is 'custom'.
 * @param isRefinement If true, treats the input as a partially colored image to fix.
 * @param refinementInstruction Optional specific instruction for fixing the image.
 * @returns The base64 data of the generated image.
 */
export const colorizeMangaPage = async (
  base64Image: string, 
  mimeType: string, 
  style: ColorizationStyle = 'vibrant',
  mangaTitle?: string,
  customPrompt?: string,
  isRefinement: boolean = false,
  refinementInstruction?: string
): Promise<string> => {
  try {
    const modelId = 'gemini-2.5-flash-image'; 

    let styleInstruction = "";
    
    if (style === 'custom' && customPrompt) {
      styleInstruction = `Style: Custom User Request. Instructions: ${customPrompt}`;
    } else if (style === 'custom' && !customPrompt) {
      // Fallback if user selects custom but sends empty string
      styleInstruction = STYLE_PROMPTS['vibrant'];
    } else {
      styleInstruction = STYLE_PROMPTS[style] || STYLE_PROMPTS['vibrant'];
    }

    const contextInstruction = mangaTitle 
      ? `Context: The manga series is "${mangaTitle}". YOU MUST use the official canon colors for these characters (hair, eyes, outfit) and locations.` 
      : '';

    // Core persona and strict mandates moved to system instruction for better adherence
    const systemInstruction = `You are a professional colorist and image editor for a manga publishing house. 
    Your task is to convert black and white manga pages into fully colored anime-style illustrations, or refine existing colorizations.

    CRITICAL RULES - FOLLOW STRICTLY:
    1. **COLOR EVERY PIXEL**: The output must be a fully painted image. Do not leave any part of the drawing (backgrounds, corners, clothes, speed lines) in black and white.
    2. **FILL WHITE SPACE**: If a panel has a white background, you MUST fill it. Use environmental colors (blue sky, walls, trees) or abstract atmospheric colors (colored speed lines, mood lighting). NEVER leave a background plain white.
    3. **TEXT BUBBLES**: Identify speech bubbles. Keep the bubble background WHITE and the text BLACK. Do not color inside the speech bubbles. This is the ONLY allowed white space.
    4. **REMOVE HATCHING**: Interpret cross-hatching, screentones, and shading lines as color gradients/shadows, not as gray textures.
    5. **HIGH DENSITY**: The final image should look like a completed anime frame. Dense, rich colors everywhere.`;

    let textPrompt = "";

    if (isRefinement) {
        if (refinementInstruction) {
             // Custom Fix Mode
             textPrompt = `EDITING REQUEST.
             The provided image is a colored manga page.
             
             USER INSTRUCTION: "${refinementInstruction}"
             
             YOUR TASK:
             1. Apply the user's specific change to the image.
             2. PRESERVE the rest of the image colors and style. Do not radically change parts the user did not ask about.
             3. Ensure the result is still fully colored with no black and white artifacts.
             4. ${contextInstruction}`;
        } else {
            // Auto-Fix Mode (Fix B&W)
            textPrompt = `FIX INCOMPLETE COLORIZATION. 
            The provided image is a work-in-progress that still has uncolored black and white areas.
            
            YOUR TASK:
            1. Identify any remaining grayscale, black and white, or sketch-like areas in this image.
            2. Colorize ONLY those missing parts to match the existing style.
            3. Do NOT change the colors of the parts that are already colored. Keep consistency.
            4. Apply the following style settings: ${styleInstruction}
            5. ${contextInstruction}
            
            Output a fully finished, opaque image with no remaining black and white zones (except text bubbles).`;
        }
    } else {
        // Initial Generation Mode
        textPrompt = `Colorize this page. 
            
        ${contextInstruction}
        ${styleInstruction}
        
        Verify that every single panel is fully painted. 
        Do not tint the image; paint it opaque.
        Do not leave the edges or backgrounds white.`;
    }

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          {
            text: textPrompt
          },
        ],
      },
      config: {
        systemInstruction: systemInstruction
      }
    });

    // Parse the response to find the image part
    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error("No candidates returned from Gemini.");
    }

    const parts = candidates[0].content.parts;
    let generatedImageBase64: string | null = null;

    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        generatedImageBase64 = part.inlineData.data;
        break;
      }
    }

    if (!generatedImageBase64) {
        // Fallback check if it returned text saying it couldn't do it
        const textPart = parts.find(p => p.text);
        if (textPart) {
            console.error("Model returned text instead of image:", textPart.text);
            throw new Error("The model declined to generate an image. It might be due to safety filters or the prompt.");
        }
        throw new Error("No image data found in the response.");
    }

    return generatedImageBase64;

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Failed to colorize image.");
  }
};