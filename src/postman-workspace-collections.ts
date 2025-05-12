import { z } from 'zod';
import { ToolDefinition, truncateString } from './tools';

type CollectionDescription = {
    id: string;
    name: string;
    owner: string;
    updatedAt: string;
    createdAt: string;
    uid: string;
    isPublic: boolean;
};

type WorkspaceCollectionsResponse = {
    collections: CollectionDescription[];
};

type FunctionParams = {
    workspaceId: string;
    name?: string;
};

// Add zod schema for validation
export const getWorksapceCollectionsZodSchema = {
    workspaceId: z.string().describe('The mandatory ID / UID  of the workspace to retrieve collections from.'),
    name: z.string().optional().describe('Return only collections whose name includes the given value.'),
};

// Helper function to format the API response
const formatCollectionResponse = (response: WorkspaceCollectionsResponse) => {
    const { collections } = response;
    return collections.map(collection => {
        const text = `# Collection: ${collection.name}

## Collection Information
Created: ${collection.createdAt}
Updated: ${collection.updatedAt}
ID: ${collection.uid}`;

        return {
            type: "text",
            text: text
        };
    });
};

// Main function to execute the API call
const fetchWorkspaceCollections = async ({
    workspaceId,
    name,
}: FunctionParams): Promise<WorkspaceCollectionsResponse> => {
    const baseUrl = process.env.POSTMAN_BASE_URL || 'https://api.getpostman.com';
    const apiKey = process.env.POSTMAN_API_KEY || '';

    try {
        // Construct the URL with query parameters
        const url = new URL(`${baseUrl}/collections`);
        url.searchParams.append('workspace', workspaceId);

        if (name) {
            url.searchParams.append('name', name);
        }

        // Set up headers for the request
        const headers: Record<string, string> = {
            'X-API-Key': apiKey,
            'Accept': 'application/json',
        };

        // Perform the fetch request
        const response = await fetch(url.toString(), {
            method: 'GET',
            headers,
        });

        // Check if the response was successful
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(JSON.stringify(errorData));
        }

        // Parse and return the response data
        const data: WorkspaceCollectionsResponse = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching collection:', error);
        throw new Error('An error occurred while fetching the collection.');
    }
};

const get_workspace_collections = async (params) => {
    try {
        const response = await fetchWorkspaceCollections(params);
        const fullSpec = JSON.stringify(response, null, 2); // Convert full collection spec to string
        const formattedResponse = formatCollectionResponse(response);

        const text = formattedResponse.map(item => item.text).join('\n\n');
        const fullText = `${text}\n\nFull List of Workspace Collections Spec:\n${fullSpec}`;

        return [{
            type: "text",
            text: truncateString(fullText)
        }];
    } catch (err) {
        console.error('Error getting collection:', err);
        return [{
            type: "text",
            text: `Error getting collection: ${err.message}`
        }];
    }
}
// Tool definition for Anthropic
export const postmanWorkspaceCollectionsTool: ToolDefinition = {
    function: get_workspace_collections,
    zodSchema: getWorksapceCollectionsZodSchema,
    anthropic: {
        name: 'get_workspace_collections',
        description: 'Get all collections that exist inside a given postman workspace.',
        input_schema: {
            type: 'object' as 'object',
            properties: {
                workspaceId: {
                    type: 'string',
                    description: 'The mandatory ID / UID  of the workspace to retrieve collections from.'
                },
                name: {
                    type: 'string',
                    description: 'Return only collections whose name includes the given value.',
                }
            },
            required: ['workspaceId'],
            additionalProperties: false
        }
    }
};