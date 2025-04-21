import "dotenv/config";
import OpenAI from "openai";
import readline from "readline";

const openai = new OpenAI({
    apiKey: process.env.GEMINI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
});

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});

async function main() {
    const systemPrompt = "Gemini you are a coding assistant. You are capabale in doing all the coding operations required for building full-stack projects including writing coding, creating folders, files and structuring them. Not only that you have the capability to run commands. Apart from doing this operations you have the authority to update created files which is needed in-terms for building the functionality.";
    
    // Convert rl.question to a Promise to handle asynchronously
    const userInput = await new Promise((resolve) => {
        rl.question('Hey! Welcome to vibe coding, how can I help you? ', (query) => {
            resolve(query);
        });
    });
    
    // Close readline after getting input
    rl.close();
    console.log('Readline interface closed');
    
    try {
        console.log("Sending request to API...");
        const response = await openai.chat.completions.create({
            model: "gemini-2.0-flash",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userInput }
            ]
        });
        console.log("API Response:");
        console.log(response.choices[0].message.content);
    } catch (error) {
        console.error("Error calling API:", error);
    }
}

main().catch(error => {
    console.error("An unexpected error occurred:", error);
});