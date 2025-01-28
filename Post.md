# Anthropic Tool API in TypeScript

The tool use, also called function calling part of the Anthropic API is a few
months old now, but most examples out there are using the Python version of the SDK and I wanted to go the TypeScript route. So here we go - this is a simple example of how to use the Anthropic API in TypeScript.

## TL;DR; - Show me the code

For the impatient - go to my [github repo here](https://github.com/codewithpassion/typescript-anthropic-tool-use-example).

## Want to walk through the code while I write it? 

[Check out my video](https://youtu.be/dVuJPvopY18) about it!

## Installation

First, you need to install the Anthropic API package:

```bash
npm install @anthropic/sdk
```
or
```bash
yarn add @anthropic/sdk
```


## Calling the Anthropic API

As the tool use is just part of the regular API, let's look at how we're calling the API in the first place:

```typescript
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const messages: MessageParam[] = [];

messages.push({
    role: "user",
    content: prompt,
});

const response = await client.messages
    .create({
      model: "claude-3-5-sonnet-20240620",
      temperature: 0.5,
      max_tokens: 1024,
      messages: messages,
    });

const textOutputs = response.content
    .map((content) => (content.type === "text" ? content.text : null))
    .filter(Boolean);
console.log(textOutputs.join("\n"));
    
```

### Steps:
1. first, we create a new `Anthropic` client instance
    
    ```typescript
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    ```

2. Create a `messages` array

    ```typescript
    const messages: MessageParam[] = [];
    ```

3. Call the API.

    ```typescript
    const response = await client.messages
    .create({
      model: "claude-3-5-sonnet-20240620",
      temperature: 0.5,
      max_tokens: 1024,
      messages: messages,
    });
    ```
    Here we can specify the `model`, `temperature`, `max_tokens` and our messages that we want to send to the model.

4. Get the response:

    ```typescript
    const textOutputs = response.content
        .map((content) => (content.type === "text" ? content.text : null))
        .filter(Boolean);
    console.log(textOutputs.join("\n"));
    ```
    In the `response` you can have multiple content blocks of different types.
    In this case, we're just interested in the `text` block.
    So we map out the text, filter out any elements that are empty with the `.filter(Boolean)` statement and then just write out the text blocks to the console. 



## Tool use

Tool use, or function calling, allows us to tell Claude about the existence of capabilities that it can call back to.
For example, if you ask Claude, `What is the weather in New York`, it will probably tell you that it can't access the internet to get up to date information.

Now, we can extend this by providing Claude our own functionality to get the weather by specifying a too.

This tool consists of a tool definition:

```typescript
const tools: Anthropic.Tool[] = [
  {
    name: "get_weather",
    description: "Get the weather for a given location",
    input_schema: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description: "The location to get the weather for",
        },
      },
    },
  },
];
```

And the implementation:

```typescript
async function get_weather async (input: { location: string }) => {
    return `The weather in ${input.location} is always sunny!`
}
```

Now we need to pass this to Claude.

### Making tools available

To give the tool to Claude you just pass the `tools` array with your call:

```typescript
const response = await client.messages
    .create({
      model: "claude-3-5-sonnet-20240620",
      temperature: 0.5,
      max_tokens: 1024,
      messages: messages,

      // Pass the tools:
      tools: tools
    });
```

Now, Claude will use our `tool description` to determine what the different tools it has available and what their capabilities are. 

If we would now ask Claude again, `What is the weather in New York?`, it
would identify that we are asking about the weather in a specific location.

Then we will get a response with a content block of `tool_use`.

```typescript
const toolUseBlocks = response.content.filter<ToolUseBlock>(
    (content) => content.type === "tool_use",
);

if (toolUseBlocks.length) {
        const allToolResultPromises = toolUseBlocks
            .map(async (toolBlock) => {
                return await callTool(toolBlock);
            });
    const allToolResults = await Promise.all(allToolResultPromises);

    const responseWithTools = await callClaude(allToolResults) 
}
```

In this example, we filter for all the `tool_use` blocks, then call the tool, assemble all the tool results, and call Claude again.

So, let's look at `callTool`:

```typescript
async function callTool(toolBlock: ToolUseBlock) {
  const { name, id, input } = toolBlock;

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
```

Every tool block comes with a `name`, `id`, and `input`, which are crucial to our tool call.

- The `name` is the name of the tool Claude want's us to call.
- The `id` is an identification string so Claude can associate the result with the initial question.
- The `input` is the input into the tool. This follows the schema that we provided in the tool definition.

In this simple implementation, we go and find the tool:
```typescript
const tool = tools.find((tool) => tool.name === name);
```

Call the function associated with it:
```typescript
const toolOutput = await functions[name](input);
```

And return the result:
```typescript
return {
      role: "user",
      content: [
        {
          type: "tool_result",
          tool_use_id: id,
          content: toolOutput,
        },
      ],
    };
```

The result consists of a `tool_result` block which comes from the role `user` and, crucially, has the `too_use_id` set to the `id` that we got passed in.

The tool result can be a text string, an array of text messages or an even image messages. See the Anthropic documentation for this.

**NOTE:**
```
In a production environment, we would want to do a lot more typechecking, input validation, and error handling. This code is just a bare bone example.
```

Once we have the tool result, we just call Claude again:

```typescript
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
```

Now this is slightly extended from our first call, so let's break it down:

To make our life easier, the input parameters is specified as:
```typescript
prompt: string | MessageParam[]
```

So, first we fill the `messages` array with the right content:
```typescript
  if (Array.isArray(prompt)) {
    messages.push(...prompt);
  } else {
    messages.push({
      role: "user",
      content: prompt,
    });
  }
```

Then we do the actual call:
```typescript
client.messages
    .create({
      model: "claude-3-5-sonnet-20240620",
      temperature: 0.5,
      max_tokens: 1024,
      messages: messages,
      tools: tools,
    })
```

and, one step that is **important**:
```typescript
    .then((response) => {
      messages.push({ role: "assistant", content: response.content });
      return response;
    })
```

We add the resulting assistant messages back into our messages. 

So, after the first call, `messages` looks a bit like this:

```typescript
[
    { role: "user", content: "What is the weather in New York?" }
]
```

Then we get the answer from Claude with a `tool_use` block:

```typescript
[
    { role: "user", content: "What is the weather in New York?" },
    { role: "assistant", content: [{ type: "tool_use", name: "get_weather", id: "_tool_use_xyz123"  }]}
]
```

And with the result added:

```typescript
[
    { role: "user", content: "What is the weather in New York?" },
    { role: "assistant", content: [{ type: "tool_use", name: "get_weather", id: "_tool_use_xyz123"  }]},
    { role: "user", content: [ { type: "tool_result", tool_use_id: "_tool_use_xyz123", content: "The weather in New York is always sunny!" } ]}
]
```

Claude will then send us a another answer with it's assessment on what the weather in New York is.

```typescript
[
    { role: "user", content: "What is the weather in New York?" },
    { role: "assistant", content: [{ type: "tool_use", name: "get_weather", id: "_tool_use_xyz123"  }]},
    { role: "user", content: [ { type: "tool_result", tool_use_id: "_tool_use_xyz123", content: "The weather in New York is always sunny!" } ]},
    { role: "assistant", content: [{ type: "text", text: "As always, the weather in New York is perfectly sunny. It's a great day [...]"  }]},
]
```

## Suno AI Integration

This project includes two different implementations for generating songs using AI:

### Classic Suno AI

Uses a local endpoint (`http://localhost:3000/api/custom_generate`) to generate songs. Tool definition:

```typescript
{
  name: "create_song_with_suno_ai_classic",
  description: "Create a song using Suno AI classic",
  parameters: {
    type: "object",
    properties: {
      prompt: {
        type: "string",
        description: "Description or lyrics for the song"
      },
      title: {
        type: "string",
        description: "Title for the song"
      }
    },
    required: ["prompt", "title"]
  }
}
```

### Suno AI with ACE Data

Uses a local endpoint (`http://localhost:3000/api/ace_generate`) to generate songs with ACE Data. Tool definition:

```typescript
{
  name: "create_song_suno_ai_ace",
  description: "Create a song using Suno AI with ACE Data",
  parameters: {
    type: "object",
    properties: {
      musicText: {
        type: "string",
        description: "The lyrics or description for the song"
      },
      musicStyle: {
        type: "string",
        description: "The style of music to generate"
      }
    },
    required: ["musicText", "musicStyle"]
  }
}
```

### Generated Song Output

The generated song output will be in the following format:

```typescript
[{
  type: "text",
  text: `Generated song "${title}":
Lyrics:
${lyrics}

Style: ${style}
Audio URL: ${audioUrl}
Video URL: ${videoUrl}`
}]
```

### Original code with weather example

Find the project on my github: https://github.com/codewithpassion/typescript-anthropic-tool-use-example
