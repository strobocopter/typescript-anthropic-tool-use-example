import { z } from 'zod';
import process from 'process';
import { ToolDefinition } from './tools';

type GenerateToolParams = {
    collectionId: string;
    requestId: string;
    config: {
        language: 'javascript' | 'typescript';
        agentFramework: 'openai' | 'mistral' | 'gemini' | 'anthropic' | 'langchain' | 'autogen';
    };
};

type SuccessfulResponse = {
    data: {
        text: string;
    };
};

type ErrorResponse = {
    type: string;
    status: number;
    title: string;
    detail: string;
};

const generate_tool_from_postman_request = async ({
    collectionId,
    requestId,
    config,
}: GenerateToolParams): Promise<SuccessfulResponse | ErrorResponse> => {
    const baseUrl = process.env.POSTMAN_BASE_URL || 'https://api.getpostman.com';
    const apiKey = process.env.POSTMAN_API_KEY;

    if (!apiKey) {
        throw new Error('POSTMAN_API_KEY not found in environment variables');
    }

    try {
        const response = await fetch(`${baseUrl}/postbot/generations/tool`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey,
            },
            body: JSON.stringify({
                collectionId,
                requestId,
                config,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error Response:', JSON.stringify(errorData, null, 2));
            return errorData;
        }

        const data = await response.json();
        console.log('Success Response:', JSON.stringify(data, null, 2));
        return data;
    } catch (error) {
        return {
            type: 'https://api.postman.com/problems/internal-server-error',
            status: 500,
            title: 'Something went wrong',
            detail: 'Something went wrong, error: ' + error,
        };
    }
};

// Add Zod schema for validation
const generateToolZodSchema = {
    collectionId: z.string().describe("The Public API Network collection's UID., example format: 24483689-91984890-1198-4573-8c9f-a66db81927de"),
    requestId: z.string().describe("The public request UID., example format: 41094746-ab513ced-796f-4b08-946e-bef868534d10"),
    config: z.object({
        language: z.enum(['javascript', 'typescript']).describe('The programming language to use for the generated request.'),
        agentFramework: z.enum(['openai', 'mistral', 'gemini', 'anthropic', 'langchain', 'autogen']).describe('The AI agent framework to use.'),
    }),
};

const generate_tool = async (params: GenerateToolParams) => {
    try {
      const response = await generate_tool_from_postman_request(params);

      if ('data' in response) {
        return [{
          type: "text",
          text: `Generated tool code:\n\n${response.data.text}`
        }];
      } else {
        return [{
          type: "text",
          text: `Error generating tool: ${response.detail}`
        }];
      }
    } catch (err) {
      console.error('Error generating tool:', err);
      return [{
        type: "text",
        text: `Error generating tool: ${err.message}`
      }];
    }
  };

// Export the tool definition
export const postmanToolgenTool: ToolDefinition = {
    function: generate_tool,
    zodSchema: generateToolZodSchema,
    anthropic: {
        name: 'generate_tool',
        description: 'Generates code for an AI agent tool using a collection and request from the Public API Network.',
        input_schema: {
            type: 'object' as 'object',
            properties: {
                collectionId: {
                    type: 'string',
                    description: "The Public API Network collection's UID., example format: 24483689-91984890-1198-4573-8c9f-a66db81927de",
                },
                requestId: {
                    type: 'string',
                    description: 'The public request UID., example format: 41094746-ab513ced-796f-4b08-946e-bef868534d10',
                },
                config: {
                    type: 'object',
                    properties: {
                        language: {
                            type: 'string',
                            enum: ['javascript', 'typescript'],
                            description: 'The programming language to use for the generated request.',
                        },
                        agentFramework: {
                            type: 'string',
                            enum: ['openai', 'mistral', 'gemini', 'anthropic', 'langchain', 'autogen'],
                            description: 'The AI agent framework to use.',
                        },
                    },
                    required: ['language', 'agentFramework'],
                    additionalProperties: false,
                },
            },
            required: ['collectionId', 'requestId', 'config'],
            additionalProperties: false,
        },
    },
};