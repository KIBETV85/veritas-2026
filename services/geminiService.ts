import { GoogleGenAI, Type, Schema } from "@google/genai";
import { DevotionalContent } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const devotionalSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    passageReference: {
      type: Type.STRING,
      description: "The Bible reference for today's reading (e.g., Genesis 1-3).",
    },
    scriptureText: {
      type: Type.STRING,
      description: "A key snippet or the full text of the designated passage.",
    },
    reflection: {
      type: Type.STRING,
      description: "A devotional reflection on the passage (150-250 words).",
    },
    morningPrayer: {
      type: Type.STRING,
      description: "A morning prayer. It MUST end with exactly: 'Not my will, but Yours be done in my life and in the lives of every member of my family. In Jesus' name, Amen.'",
    },
    eveningPrayer: {
      type: Type.STRING,
      description: "An evening prayer. It MUST end with exactly: 'Let Your perfect will be done in my life and in my family. In Jesus' name, Amen.'",
    },
    quote: {
      type: Type.STRING,
      description: "A brief inspirational quote or verse complementing the theme.",
    },
    quoteAuthor: {
      type: Type.STRING,
      description: "The author of the quote.",
    },
    relatedVerseReference: {
      type: Type.STRING,
      description: "Reference for a related Bible verse (e.g., 'John 1:1') that connects to the theme.",
    },
    relatedVerseText: {
      type: Type.STRING,
      description: "The text of the related Bible verse.",
    },
  },
  required: ["passageReference", "scriptureText", "reflection", "morningPrayer", "eveningPrayer", "quote", "quoteAuthor", "relatedVerseReference", "relatedVerseText"],
};

export const fetchDevotionalForDate = async (dateStr: string): Promise<DevotionalContent> => {
  try {
    const prompt = `
      Create a daily devotional entry for ${dateStr}.
      
      CONTEXT:
      This is for a "Bible in a Year" reading plan that covers the entire Bible sequentially from Genesis to Revelation.
      - January 1st MUST start with Genesis 1.
      - December 31st MUST end with Revelation 22.
      - The readings should be evenly distributed across 365 days.
      
      TASK:
      1. Identify the specific reading portion corresponding to this date (${dateStr}) in a standard sequential 365-day plan.
      2. Generate devotional content based strictly on this passage.
      
      AUDIENCE:
      Diverse, seeking spiritual growth and understanding of the whole scripture.
      
      TONE:
      Encouraging, insightful, peaceful.
      
      REQUIREMENTS:
      1. Designate the specific Bible passage (e.g., "Genesis 1-3" or "Matthew 5-7").
      2. Provide a key scripture text snippet (KJV or NIV style).
      3. Write a 150-250 word reflection highlighting themes from this specific portion.
      4. Write a Morning Prayer (approx 50-100 words). 
         - **Style**: deeply personal, vulnerable, and introspective. 
         - **Content**: Do not be generic. Directly apply the specific warnings, examples, or promises found in the ${dateStr} reading to the internal state of the heart. Ask specific questions of the soul based on the text. Focus on surrendering anxiety and aligning desires with God's character as revealed in this passage.
         - **Mandatory Ending**: It MUST end with this exact phrase: "Not my will, but Yours be done in my life and in the lives of every member of my family. In Jesus' name, Amen."
      5. Write an Evening Prayer (approx 50-100 words). 
         - **Style**: Honest review and resting in sovereignty.
         - **Content**: Review the day through the lens of the morning's scripture. Confess specific ways the heart drifted from the truth of the passage. Offer thanks for how the passage's truth sustained you. Encourage unburdening the soul of failures or stressors.
         - **Mandatory Ending**: It MUST end with this exact phrase: "Let Your perfect will be done in my life and in my family. In Jesus' name, Amen."
      6. Include a relevant short quote.
      7. Provide a "Related Verse" (text and reference) from a different part of the Bible that connects to the daily theme (e.g., connecting an Old Testament reading to a New Testament truth).
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: devotionalSchema,
        temperature: 0.7,
      },
    });

    const jsonText = response.text;
    if (!jsonText) {
      throw new Error("Empty response from AI");
    }

    const data = JSON.parse(jsonText);
    
    return {
      date: dateStr,
      ...data,
    };
  } catch (error) {
    console.error("Error fetching devotional:", error);
    throw error;
  }
};