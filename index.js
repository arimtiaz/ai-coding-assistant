import "dotenv/config";
import OpenAI from "openai";
import readline from "readline";
import { read_file, write_file, append_file, delete_file, write_folder, run_command } from "./tools/fileTools.js";

const openai = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

const availableTools = {
  read_file: {
    fn: read_file,
    description: "Reads content from a file path.",
  },
  write_file: {
    fn: write_file,
    description: "Writes content to a file. Expects { path, content }.",
  },
  append_file: {
    fn: append_file,
    description: "Appends content to a file. Expects { path, content }.",
  },
  delete_file: {
    fn: delete_file,
    description: "Deletes file. Expects { path }.",
  },
  write_folder: {
    fn: write_folder,
    description: "Creates folders. Expects { path }.",
  },
  run_command: {
    fn: run_command,
    description: "Executes system commands like npm, node, etc. Expects command as string.",
  },
};

const systemPrompt = `
You are a coding assistant. You are capable of full-stack development tasks such as writing code, creating folders/files, and executing commands.
You work on start, plan, action, observe mode.
For the given user query and available tools, plan the step by step execution, based on the planning,
select the relevant tool from the available tools. Based on the tool selection you perform an action to call the tool.
Wait for the observation and based on the observation from the tool call resolve the user query.

Rules:
- Follow the Output JSON Format.
- Always perform one step at a time and wait for next input
- Carefully analyze the user query

Output JSON Format:
{
    "step": "string", // "plan", "action", "observe", or "output"
    "content": "string", // Explanation or final output
    "function": "The name of function if the step is action",
    "input": "The input parameter for the function",
}

Available Tools:
- read_file: Reads content from a file path.
- write_file: Writes content to a file. Expects { path, content }.
- append_file: Appends content to a file. Expects { path, content }.
- delete_file: Deletes files and folders. Expects { path }.
- write_folder: Creates folders. Expects { path }.
- run_command: Executes system commands like npm, node, etc. Expects command as string.
`;

async function main() {
  console.log("Hey! Welcome to vibe coding, how can I help you?");

  const messages = [{ role: "system", content: systemPrompt }];

  const rlQuestion = () => {
    rl.question("> ", async (userQuery) => {
      if (userQuery.toLowerCase() === "exit") {
        rl.close();
        return;
      }

      messages.push({ role: "user", content: userQuery });

      let isProcessing = true;

      while (isProcessing) {
        try {
          const response = await openai.chat.completions.create({
            model: "gemini-2.0-flash",
            response_format: { type: "json_object" },
            messages: messages,
          });

          const parsedOutput = JSON.parse(response.choices[0].message.content);
          messages.push({
            role: "assistant",
            content: JSON.stringify(parsedOutput),
          });

          if (parsedOutput.step === "plan") {
            console.log(`🧠: ${parsedOutput.content}`);
            continue;
          }

          if (parsedOutput.step === "action") {
            const toolName = parsedOutput.function;
            const toolInput = parsedOutput.input;

            if (availableTools[toolName]) {
              console.log(`🔨 Tool Called: ${toolName}`, toolInput);
              let output;
              if (toolName === "read_file" || toolName === "delete_file" || toolName === "write_folder" || toolName === "run_command") {
                // read_file expects just a path string
                output = await availableTools[toolName].fn(toolInput);
              } else if (
                toolName === "write_file" ||
                toolName === "append_file"
              ) {
                // Make sure toolInput has the correct structure
                if (typeof toolInput === "string") {
                  // If the AI passed a string, try to parse it as JSON
                  try {
                    toolInput = JSON.parse(toolInput);
                  } catch (e) {
                    output =
                      "Error: Input must be an object with path and content properties";
                  }
                }

                if (toolInput && toolInput.path && toolInput.content) {
                  output = await availableTools[toolName].fn(toolInput);
                } else {
                  output =
                    "Error: Input must contain path and content properties";
                }
              }

              messages.push({
                role: "assistant",
                content: JSON.stringify({
                  step: "observe",
                  output: output,
                }),
              });

              continue;
            }
          }

          if (parsedOutput.step === "output") {
            console.log(`🤖: ${parsedOutput.content}`);
            isProcessing = false;
          }
        } catch (error) {
          console.error("Error:", error.message);
          isProcessing = false;
        }
      }

      rlQuestion(); // Continue the conversation
    });
  };

  rlQuestion();
}

main().catch((error) => {
  console.error("An unexpected error occurred:", error);
});
