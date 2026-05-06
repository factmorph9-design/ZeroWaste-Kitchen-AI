import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini API
const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in the environment.");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeKitchenImage = async (base64Image: string, mimeType: string, lang: string = "en") => {
  const ai = getAI();
  const prompt = `Analyze this kitchen/grocery image for food identification. 
    1. List all food items found. 
    2. Ensure the list is UNIQUE (no duplicate names for the same photo).
    3. Translate the name and category to the language: ${lang}.
    4. Estimate a reasonable expiry date starting FROM TODAY. For example: milk (7 days), eggs (14 days), bread (5 days), apples (21 days).
    5. IMPORTANT: Every expiryDate MUST be a future date in ISO string format.
    Return the response ONLY as a JSON array of objects with 'name', 'category', and 'expiryDate'.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          { text: prompt },
          { inlineData: { data: base64Image, mimeType } }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            category: { type: Type.STRING },
            expiryDate: { type: Type.STRING },
          },
          required: ["name", "category", "expiryDate"]
        }
      }
    }
  });

  return JSON.parse(response.text || "[]");
};

export const suggestRecipe = async (inventory: any[], lang: string = "en", servings: number = 2) => {
  const ai = getAI();
  const itemsText = inventory
    .map(item => `${item.name} (expires: ${item.expiryDate})`)
    .join(", ");
    
  const prompt = `I have the following ingredients in my kitchen: ${itemsText}. 
    Based on items expiring soon, suggest ONE creative 10-minute recipe that reduces waste.
    The recipe should be for exactly ${servings} person(s).
    Focus on using the items closest to expiry.
    Write the response in the language: ${lang}.
    Return the response as a JSON object with 'title', 'ingredients' (array), and 'instructions' (array).`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
          instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["title", "ingredients", "instructions"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
};

export const suggestRecipeForSpecificItem = async (item: string, otherItems: string[], lang: string = "en", servings: number = 2) => {
  const ai = getAI();
  const prompt = `Suggest a simple 5-10 minute recipe where "${item}" is the ABSOLUTE main ingredient. 
    The recipe should be for exactly ${servings} person(s).
    Focus EXCLUSIVELY on "${item}". If other ingredients are needed, only use basic pantry staples or a few items from this list: ${otherItems.slice(0, 3).join(", ")}.
    Write the response in the language: ${lang}.
    Return the response as a JSON object with 'title', 'ingredients' (array), and 'instructions' (array).`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
          instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["title", "ingredients", "instructions"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
};

export const getStorageTip = async (itemName: string, lang: string = "en") => {
  const ai = getAI();
  const prompt = `Give me one short, professional tip (max 20 words) on the absolute BEST way to store "${itemName}" to make it last longer. 
    Language: ${lang}. 
    Focus on temperature, placement, or moisture control.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  return response.text || "";
};

export const generateMealPlan = async (inventory: any[], lang: string = "en") => {
  const ai = getAI();
  const itemsText = inventory.map(i => i.name).join(", ");
  const prompt = `Create a 3-day meal plan (Breakfast, Lunch, Dinner) using mainly these items: ${itemsText}. 
    Focus on zero waste. Language: ${lang}.
    Return JSON array of 3 daily objects: { "day": number, "meals": { "breakfast": string, "lunch": string, "dinner": string } }.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            day: { type: Type.NUMBER },
            meals: {
              type: Type.OBJECT,
              properties: {
                breakfast: { type: Type.STRING },
                lunch: { type: Type.STRING },
                dinner: { type: Type.STRING },
              },
              required: ["breakfast", "lunch", "dinner"]
            }
          },
          required: ["day", "meals"]
        }
      }
    }
  });

  return JSON.parse(response.text || "[]");
};

export const kitchenChat = async (message: string, history: any[], lang: string = "en") => {
  const ai = getAI();
  
  const systemInstruction = `You are a professional kitchen assistant and waste-reduction expert. 
    You ONLY answer questions related to recipes, cooking tips, food storage, and kitchen management.
    If the user asks about anything else, politely refuse and remind them that you are a kitchen assistant.
    Respond in the language: ${lang}. Keep answers concise and helpful.`;

  const contents = [...history, { role: "user", parts: [{ text: message }] }];

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: contents,
    config: {
      systemInstruction: systemInstruction,
    }
  });

  return response.text || "I'm sorry, I couldn't generate a response.";
};
