import { withGeminiFallback } from "./src/lib/ai/gemini-fallback.ts";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "dotenv";

config({ path: ".env.local" });

// Mock global fetch to simulate 429 for the first key
const originalFetch = global.fetch;
global.fetch = async (url: any, options: any) => {
  const urlString = url.toString();
  if (urlString.includes(process.env.GOOGLE_GEMINI_API_KEY!)) {
    console.log("Mocking 429 Quota Exhausted for First Key");
    return new Response("Quota Exceeded", { status: 429 });
  }
  return originalFetch(url, options);
};

async function testFallback() {
  console.log("Starting fallback test...");
  console.log("Key 1:", process.env.GOOGLE_GEMINI_API_KEY?.slice(0, 10) + "...");
  console.log("Key 2:", process.env.GOOGLE_GEMINI_API_KEY_2?.slice(0, 10) + "...");

  try {
    const result = await withGeminiFallback(async (genAI) => {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const res = await model.generateContent("Hello! Respond with 'Fallback works!'");
      return res.response.text();
    });
    
    console.log("SUCCESS! Got response from Gemini:");
    console.log(result);
  } catch (err: any) {
    console.error("FAILED with error:", err.message);
  }
}

testFallback();
