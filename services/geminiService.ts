
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { RenovationSuggestion, ProductSuggestion, Project, RenovationPlan, ShoppingResult } from "../types";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export async function generateSuggestions(imageBase64: string, zipCode?: string): Promise<Omit<RenovationSuggestion, 'id'>[]> {
  // Using Gemini 3 Pro Preview for complex reasoning and local market simulation
  const modelName = "gemini-3-pro-preview"; 
  
  const response = await ai.models.generateContent({
    model: modelName,
    contents: {
      parts: [
        { inlineData: { data: imageBase64, mimeType: 'image/jpeg' } },
        {
          text: `You are a high-end real estate appraiser and interior designer. 
          Analyze the attached image of a home located in Zip Code: ${zipCode || "Unknown (assume national average)"}.

          Identify 3-5 specific renovation projects. 
          CRITICAL: Do NOT use generic data. You must ESTIMATE the cost and ROI based on:
          1. The specific condition seen in the photo (e.g., if it's already nice, ROI is lower).
          2. The location (Zip Code: ${zipCode}). Expensive areas have higher labor costs but potentially higher ROI for luxury finishes.
          3. Current market trends.

          For each suggestion, provide:
          - name: A short title (e.g. "Modernize Vanity").
          - description: Specific advice including colors/materials (e.g. "Replace with a floating teak vanity...").
          - avgCost: Your best estimated cost in USD for this specific zip code.
          - roi: The estimated Return on Investment percentage (e.g. 120 for 20% profit).
          - category: One of 'Curb Appeal', 'Kitchen', 'Bathroom', 'Interior', 'Outdoor', 'General'.
          - rationale: A one sentence explanation of WHY this ROI is accurate for this specific home/location.

          Return JSON.`
        },
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          suggestions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                avgCost: { type: Type.NUMBER },
                roi: { type: Type.NUMBER },
                category: { type: Type.STRING },
                rationale: { type: Type.STRING }
              },
              required: ["name", "description", "avgCost", "roi", "category", "rationale"]
            }
          }
        },
        required: ["suggestions"],
      },
    },
  });

  const parsedResponse = JSON.parse(response.text);
  return parsedResponse.suggestions;
}

export async function generateSummary(imageBase64: string, zipCode?: string): Promise<string> {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: {
            parts: [
                { inlineData: { data: imageBase64, mimeType: 'image/jpeg' } },
                { text: `Analyze this image of a home in Zip Code ${zipCode || 'N/A'}. Provide a concise, 2-3 sentence strategic summary. Mention the architectural style and the single most profitable move they could make given the location context.` }
            ]
        },
    });
    return response.text;
}

// Feature 2: Real-World Product Sourcing using Google Search Grounding
export async function findRealProducts(query: string, zipCode?: string): Promise<ShoppingResult> {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Find 3 specific, purchasable product recommendations for this renovation task: "${query}". 
        Context: User is in Zip Code: ${zipCode || "US National"}.
        
        CRITICAL OUTPUT FORMAT:
        Provide a list. For each item, use EXACTLY this pattern (do not use markdown tables, just text lines):
        
        Product: [Product Name]
        Price: [Price with currency symbol]
        Store: [Retailer Name]
        
        Example:
        Product: Kohler Highline Toilet
        Price: $250
        Store: Home Depot
        
        Be concise. No intro text.`,
        config: {
            tools: [{ googleSearch: {} }],
            // Note: When using googleSearch, we cannot use responseMimeType JSON.
            // We must extract URLs from grounding metadata.
        },
    });

    // Extract grounding chunks (URLs)
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
        .map(chunk => chunk.web)
        .filter(web => web !== undefined && web !== null)
        .map(web => ({ title: web.title || 'Source', uri: web.uri || '#' }));

    return {
        text: response.text,
        sources: sources
    };
}

// Feature 3: Agentic Project Sequencing using Gemini 3 Pro
export async function generateRenovationPlan(projects: Project[]): Promise<RenovationPlan> {
    const projectNames = projects.map(p => `${p.name} (${p.category})`).join(", ");
    
    const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview", // Pro model required for reasoning about dependencies
        contents: `You are a master construction project manager. 
        I have a list of renovation projects: [${projectNames}].
        
        Create a logical step-by-step execution plan. 
        Rules:
        1. Group them into logical phases (e.g. "Prep Work", "Exterior", "Finishing").
        2. Order them correctly (e.g. Flooring comes after Painting usually, but Demo comes first).
        3. Estimate duration.
        
        Return JSON.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    phases: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                phaseName: { type: Type.STRING },
                                tasks: { type: Type.ARRAY, items: { type: Type.STRING } },
                                duration: { type: Type.STRING },
                                description: { type: Type.STRING }
                            },
                            required: ["phaseName", "tasks", "duration", "description"]
                        }
                    },
                    totalDuration: { type: Type.STRING },
                    advice: { type: Type.STRING }
                },
                required: ["phases", "totalDuration", "advice"]
            }
        }
    });

    return JSON.parse(response.text);
}

export async function processFinancialDocument(imageFile: File): Promise<{ matchedProjectName: string | null, cost: number, summary: string }> {
    const base64 = await fileToBase64(imageFile);
    
    const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview", 
        contents: {
            parts: [
                { inlineData: { data: base64, mimeType: imageFile.type } },
                { text: `Analyze this image (receipt or contractor bid). 
                  1. Extract the TOTAL cost.
                  2. Summarize what was purchased/quoted in 1 short sentence.
                  3. Suggest a generic category name for this work (e.g., "Plumbing", "Paint").
                  
                  Return JSON.` }
            ]
        },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    totalCost: { type: Type.NUMBER },
                    summary: { type: Type.STRING },
                    categorySuggestion: { type: Type.STRING }
                },
                required: ["totalCost", "summary", "categorySuggestion"]
            }
        }
    });

    const result = JSON.parse(response.text);
    return {
        matchedProjectName: result.categorySuggestion,
        cost: result.totalCost,
        summary: result.summary
    };
}

export async function extractStyleFromVideo(videoFile: File): Promise<string> {
    const frameBase64 = await extractFrameFromVideo(videoFile);
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: {
            parts: [
                { inlineData: { data: frameBase64, mimeType: "image/jpeg" } },
                { text: `Analyze the interior design style in this video frame. Extract the "Vibe". Return a comma-separated string of 5 keywords describing colors, materials, and atmosphere.` }
            ]
        }
    });
    return response.text;
}

export async function generateProductSuggestions(projectName: string): Promise<Omit<ProductSuggestion, 'project'>[]> {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: {
            parts: [{
                text: `For a home renovation project called "${projectName}", suggest 3-5 specific products. Return JSON.`
            }]
        },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    products: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                description: { type: Type.STRING }
                            },
                            required: ["name", "description"]
                        }
                    }
                },
                required: ["products"]
            }
        }
    });
    const parsedResponse = JSON.parse(response.text);
    return parsedResponse.products;
}

export async function generateInspirationFeed(imagesBase64: string[], extraContext?: string): Promise<{ themes: string[], styleSummary: string, initialFeed: { type: 'image' | 'video', prompt: string }[] }> {
  const imageParts = imagesBase64.map(data => ({
    inlineData: { data, mimeType: 'image/jpeg' },
  }));

  const contextPrompt = extraContext 
    ? `Also, incorporate this specific style direction from a user uploaded video: "${extraContext}".` 
    : "";

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: {
      parts: [
        ...imageParts,
        { text: `Analyze these images. ${contextPrompt} Generate a JSON object with themes, styleSummary, and initialFeed (8 items, mix of image/video prompts).` }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          themes: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          styleSummary: { type: Type.STRING },
          initialFeed: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING },
                prompt: { type: Type.STRING }
              },
              required: ["type", "prompt"]
            }
          }
        },
        required: ["themes", "styleSummary", "initialFeed"],
      },
    },
  });
  return JSON.parse(response.text);
}

export async function generateSingleImage(prompt: string): Promise<string> {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });
    const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
    if (imagePart && imagePart.inlineData) {
        return `data:image/png;base64,${imagePart.inlineData.data}`;
    } else {
        throw new Error("Inspirational image could not be generated.");
    }
}

export async function generateEditedImage(imageBase64: string, mimeType: string, prompt: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: imageBase64, mimeType: mimeType } },
        { text: `Photorealistic edit. Maintain exact lighting and camera angle. ${prompt}` },
      ],
    },
    config: {
      responseModalities: [Modality.IMAGE],
    },
  });
  const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
  if (imagePart && imagePart.inlineData) {
    return `data:image/png;base64,${imagePart.inlineData.data}`;
  } else {
    throw new Error("Edited image could not be generated.");
  }
}

export async function generateInspirationVideo(prompt: string): Promise<string> {
  const videoAI = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  try {
    let operation = await videoAI.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '9:16' }
    });
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await videoAI.operations.getVideosOperation({ operation: operation });
    }
    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Video generation completed, but no download link was provided.");
    
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    if (!response.ok) throw new Error(`Failed to fetch video file: ${response.statusText}`);
    const videoBlob = await response.blob();
    return URL.createObjectURL(videoBlob);
  } catch (err) {
      if (err instanceof Error && err.message.includes("Requested entity was not found.")) {
          throw new Error("API key is not valid. Please select a valid API key.");
      }
      console.error("Error generating video:", err);
      throw new Error("Failed to generate video inspiration.");
  }
}

function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = (error) => reject(error);
    });
}

function extractFrameFromVideo(videoFile: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.src = URL.createObjectURL(videoFile);
        video.muted = true;
        video.playsInline = true;
        video.onloadedmetadata = () => { video.currentTime = video.duration / 2; };
        video.onseeked = () => {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg');
                resolve(dataUrl.split(',')[1]);
            } else {
                reject(new Error("Could not create canvas context"));
            }
            URL.revokeObjectURL(video.src);
        };
        video.onerror = (e) => reject(e);
    });
}
