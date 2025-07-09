require("dotenv").config();
const readline = require("./readline");
const { OpenAI } = require("openai");
// const tools = require('./tool');
// const tools = require('./screenshotTools');
const tools = require("./postTools");
// const tools = require("./runCommands");
// const tools = require('./speechToCodeTools')
const fs = require("fs");
const path = require("path");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const rl = readline;
rl.setPrompt("\x1b[94mYou\x1b[0m: ");

function logToFile(logEntry) {
  const logFile = path.join(__dirname, "chat-log.json");

  let logData = [];
  if (fs.existsSync(logFile)) {
    const existing = fs.readFileSync(logFile, "utf8");
    try {
      logData = JSON.parse(existing);
    } catch (e) {
      console.warn("Could not parse existing log file. Overwriting.");
    }
  }

  logData.push(logEntry);
  fs.writeFileSync(logFile, JSON.stringify(logData, null, 2), "utf8");
}

class Agent {
  constructor(client, getUserMessage, tools = []) {
    this.client = client;
    this.getUserMessage = getUserMessage;
    this.conversation = [];
    this.tools = tools;
  }

  async run() {
    console.log("Chat with OpenAI (use 'ctrl-c' to quit)");
    rl.prompt();

    for await (const userInput of this.getUserMessage()) {
      if (!this.conversation.length) {
        this.conversation.unshift({
          role: "system",
          content: `You are a helpful personal assistant. Use tools only if needed. 
Stop once you've answered the user's question or completed the task. 
Avoid repeating tool calls unless necessary.`,
        });
      }

      this.conversation.push({ role: "user", content: userInput });

      for (let step = 0; step < 5; step++) {
        console.log(`\x1b[90mStep ${step + 1}/5\x1b[0m`);

        const completion = await this.client.chat.completions.create({
          model: "gpt-4",
          messages: this.conversation,
          tools: this.tools.map((tool) => ({
            type: "function",
            function: {
              name: tool.name,
              description: tool.description,
              parameters: tool.parameters,
            },
          })),
          tool_choice: "auto",
          max_tokens: 1024,
        });

        const msg = completion.choices[0].message;

        if (msg.tool_calls && msg.tool_calls.length > 0) {
          this.conversation.push({
            role: "assistant",
            content: null,
            tool_calls: msg.tool_calls,
          });

          const toolLogs = [];

          for (const toolCall of msg.tool_calls) {
            const tool = this.tools.find(
              (t) => t.name === toolCall.function.name
            );
            if (!tool) continue;

            const args = JSON.parse(toolCall.function.arguments);
            console.log(
              `\x1b[96mTool Call\x1b[0m: ${
                tool.name
              } with args: ${JSON.stringify(args)}`
            );
            const result = await tool.function(args);

            this.conversation.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: result,
            });

            toolLogs.push({
              tool: tool.name,
              args,
              result,
            });
          }

          logToFile({
            timestamp: new Date().toISOString(),
            user: userInput,
            assistant: null,
            tool_calls: toolLogs,
          });
        } else {
          this.conversation.push(msg);
          console.log(`\x1b[93mOpenAI\x1b[0m: ${msg.content}`);

          logToFile({
            timestamp: new Date().toISOString(),
            user: userInput,
            assistant: msg.content,
            tool_calls: null,
          });

          break;
        }
      }

      rl.prompt();
    }
  }
}

async function* stdinMessageGenerator() {
  for await (const line of rl) {
    yield line;
  }
}

const agent = new Agent(openai, stdinMessageGenerator, tools);
agent.run();
