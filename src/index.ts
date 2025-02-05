import dotenv from "dotenv";
import { input } from "@inquirer/prompts";
import {
  MessageParam,
  ToolUseBlock,
} from "@anthropic-ai/sdk/resources/messages.mjs";
import Anthropic from "@anthropic-ai/sdk";
dotenv.config();

import { tools, functions } from "./tools";

const messages: MessageParam[] = [];
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function exit() {
  console.log("Ok, bye!");
  process.exit(0);
}

async function query() {
  const query = await input({ message: "What would you like to do?" });
  if (["quit", "exit"].includes(query.toLowerCase())) {
    exit();
  }
  return query;
}

async function callClaude(prompt: string | MessageParam[]) {
  if (Array.isArray(prompt)) {
    messages.push(...prompt);
  } else {
    messages.push({
      role: "user",
      content: prompt,
    });
  }

  return client.messages
    .create({
      model: "claude-3-5-sonnet-20240620",
      temperature: 0.5,
      max_tokens: 1024,
      messages: messages,
      tools: tools,
    })
    .then((response) => {
      messages.push({ role: "assistant", content: response.content });
      return response;
    });
}

async function callTool(toolBlock: ToolUseBlock) {
  const { name, id, input } = toolBlock;
  console.log('Available functions:', Object.keys(functions));
  console.log('Trying to call function:', name);

  const tool = tools.find((tool) => tool.name === name);
  if (tool) {
    const toolOutput = await functions[name](input);
    return {
      role: "user",
      content: [
        {
          type: "tool_result",
          tool_use_id: id,
          content: toolOutput,
        },
      ],
    } as MessageParam;
  } else {
    throw Error(`Tool ${name} does not exist`);
  }
}

async function processResponse(response: Anthropic.Messages.Message) {
  const toolUseBlocks = response.content.filter<ToolUseBlock>(
    (content) => content.type === "tool_use",
  );

  if (toolUseBlocks.length) {
    const allToolResultPromises = toolUseBlocks.map(async (toolBlock) => {
      return await callTool(toolBlock);
    });
    const allToolResults = await Promise.all(allToolResultPromises);

    return await callClaude(allToolResults) //
      .then(processResponse);
  } else {
    const textOutputs = response.content
      .map((content) => (content.type === "text" ? content.text : null))
      .filter(Boolean);
    console.log(textOutputs.join("\n"));
  }
}

async function main() {
  while (true) {
    try {
      const userInput = await query();
      const response = await callClaude(userInput);
      await processResponse(response);
    } catch (error) {
      console.error('Error communicating with Claude:', error.message);
      // Continue with next iteration instead of exiting
      continue;
    }
  }
}

// Start the application with error handling
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

