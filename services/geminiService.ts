import { GoogleGenAI, Type, Modality } from "@google/genai";
import { RenovationSuggestion, ProductSuggestion } from "../types";
import { VALID_CATEGORIES, ROI_DATA } from '../constants';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export async function generateSuggestions(imageBase64: string): Promise<Omit<RenovationSuggestion, 'id'>[]> {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: {
      parts: [
        { inlineData: { data: imageBase64, mimeType: 'image/jpeg' } },
        {
          // FIX: Updated the prompt to be more specific and align with the application's data structure.
          // The model is now instructed to select a project 'name' from an exact list, which is then used
          // to look up ROI data. This makes the data matching more reliable.
          text: `Analyze the attached image of a home. Identify 3-5 specific, high-impact, smaller-scale renovation projects that would likely increase its value. Focus on upgrades rather than full remodels. For each suggestion, provide a name and a brief description. The 'name' must be one of the *exact* project names from this list: ${VALID_CATEGORIES.join(', ')}. Do not invent new project names.

          Return the data as a JSON object with a single key "suggestions" which is an array of objects. Each object in the array should have two keys: "name" and "description".
          
          Example format:
          {
            "suggestions": [
              { "name": "Install New Kitchen Faucet", "description": "Replace the outdated faucet with a modern, high-arc model to improve functionality and aesthetics." },
              { "name": "Paint Front Door", "description": "Apply a fresh coat of a bold, welcoming color to the front door to instantly boost curb appeal." }
            ]
          }`
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
              },
              required: ["name", "description"]
            }
          }
        },
        required: ["suggestions"],
      },
    },
  });

  const parsedResponse = JSON.parse(response.text);

  // Match API response with our constant ROI data
  return parsedResponse.suggestions.map((suggestion: { name: string, description: string }) => {
    const roiInfo = ROI_DATA[suggestion.name];
    return {
      ...suggestion,
      avgCost: roiInfo ? roiInfo.avgCost : 0,
      roi: roiInfo ? roiInfo.roi : 0,
      category: roiInfo ? roiInfo.category : 'General',
    };
  }).filter((s: Omit<RenovationSuggestion, 'id'>) => s.avgCost > 0); // Filter out any suggestions that didn't match
}

export async function generateSummary(imageBase64: string): Promise<string> {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: {
            parts: [
                { inlineData: { data: imageBase64, mimeType: 'image/jpeg' } },
                { text: `Analyze this image of a home and provide a concise, one-paragraph summary (2-3 sentences) of its biggest ROI opportunities. Start with a clear statement, like "Your home's biggest ROI opportunity is...". Focus on the strategic value, such as improving curb appeal or modernizing key fixtures. Be encouraging and insightful.` }
            ]
        },
    });
    return response.text;
}


export async function generateProductSuggestions(projectName: string): Promise<Omit<ProductSuggestion, 'project'>[]> {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: {
            parts: [{
                text: `For a home renovation project called "${projectName}", suggest 3-5 specific products or materials that would be needed.
                
                Return a JSON object with a single key "products", which is an array of objects. Each object should have two keys: "name" (e.g., "Matte Black Pull-Down Faucet") and "description" (a brief, compelling sentence about the product).

                Example format:
                {
                    "products": [
                        { "name": "Quartz Countertop Slab", "description": "A durable and stylish countertop available in various modern finishes." },
                        { "name": "Subway Tile Backsplash", "description": "Classic, easy-to-clean tiles that brighten up any kitchen space." }
                    ]
                }`
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


export async function generateInspirationFeed(imagesBase64: string[]): Promise<{ themes: string[], styleSummary: string, initialFeed: { type: 'image' | 'video', prompt: string }[] }> {
  const imageParts = imagesBase64.map(data => ({
    inlineData: { data, mimeType: 'image/jpeg' },
  }));

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: {
      parts: [
        ...imageParts,
        { text: `Analyze these images of a home. Based on the style, generate a JSON object with three keys: "themes" (an array of 3-5 short strings describing key design elements like 'Warm Minimalism', 'Natural Textures'), "styleSummary" (a concise, 1-2 sentence summary explaining the identified style, like "The AI sees 'Natural Textures' and 'Warm Minimalism' in your home. This feed is tailored to those themes."), and "initialFeed" (an array of 8 inspirational content ideas). Each item in "initialFeed" should be an object with two keys: "type" (either 'image' or 'video') and "prompt" (a detailed, descriptive prompt for an image or video generation AI). Make 2 of the 8 items of type 'video'. For video prompts, frame them as "a short, 5-second walkthrough video". The prompts should be diverse and reflect a cohesive design direction.` }
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
        {
          inlineData: {
            data: imageBase64,
            mimeType: mimeType,
          },
        },
        {
          text: prompt,
        },
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
  // IMPORTANT: A new GenAI instance must be created before each call that uses a user-selected API key.
  const videoAI = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  try {
    let operation = await videoAI.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '9:16'
      }
    });

    while (!operation.done) {
      // Poll every 10 seconds
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await videoAI.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;

    if (!downloadLink) {
        throw new Error("Video generation completed, but no download link was provided.");
    }
    
    // The response.body contains the MP4 bytes. You must append an API key when fetching from the download link.
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch video file: ${response.statusText}`);
    }
    const videoBlob = await response.blob();
    return URL.createObjectURL(videoBlob);
  } catch (err) {
      if (err instanceof Error && err.message.includes("Requested entity was not found.")) {
          // This specific error indicates an issue with the API key, so we re-throw it to be handled in the UI.
          throw new Error("API key is not valid. Please select a valid API key.");
      }
      console.error("Error generating video:", err);
      throw new Error("Failed to generate video inspiration.");
  }
}
