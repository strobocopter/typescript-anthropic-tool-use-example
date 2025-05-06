import { z } from 'zod';
import { ToolDefinition } from './tools';

// Types and Enums
enum SortOptions {
  CreatedAt = 'createdAt',
  UpdatedAt = 'updatedAt',
}

enum DirectionOptions {
  Asc = 'asc',
  Desc = 'desc',
}

enum ElementType {
  Folder = 'folder',
  Workspace = 'workspace',
  Collection = 'collection',
  Api = 'api',
}

// Define Zod schema for validation
export const getAllElementsAndFoldersZodSchema = {
  since: z.string().optional().describe('Return only results created since the given time, in ISO 8601 format.'),
  until: z.string().optional().describe('Return only results created until this given time, in ISO 8601 format.'),
  addedBy: z.number().optional().describe('Return only elements published by the given user ID.'),
  name: z.string().optional().describe('Return only elements whose name includes the given value.'),
  summary: z.string().optional().describe('Return only elements whose summary includes the given value.'),
  description: z.string().optional().describe('Return only elements whose description includes the given value.'),
  sort: z.enum(Object.values(SortOptions) as [string, ...string[]]).optional().describe('Sort the results by the given value.'),
  direction: z.enum(Object.values(DirectionOptions) as [string, ...string[]]).optional().describe('Sort in ascending or descending order.'),
  createdBy: z.number().optional().describe('Return only the elements created by the given user ID.'),
  offset: z.number().optional().describe('The zero-based offset of the first item to return.'),
  limit: z.number().optional().describe('The maximum number of elements to return.'),
  parentFolderId: z.number().optional().describe('Return the folders and elements in a specific folder.'),
  type: z.enum(Object.values(ElementType) as [string, ...string[]]).optional().describe('Filter by the element type.')
};

type QueryParams = {
  since?: string;
  until?: string;
  addedBy?: number;
  name?: string;
  summary?: string;
  description?: string;
  sort?: SortOptions;
  direction?: DirectionOptions;
  createdBy?: number;
  offset?: number;
  limit?: number;
  parentFolderId?: number;
  type?: ElementType;
};

type ApiResponse = {
  elements: Element[];
  folders: Folder[];
  meta: Meta;
};

type Element = {
  addedAt: string;
  addedBy: number;
  createdBy: number;
  createdAt: string;
  updatedBy: number;
  updatedAt: string;
  type: string;
  id: string;
  parentFolderId: number;
  name: string;
  summary: string;
  description: string | null;
  href: string;
};

type Folder = {
  id: number;
  parentFolderId: number;
  updatedAt: string;
  updatedBy: number;
  createdBy: number;
  createdAt: string;
  name: string;
  description: string | null;
  type: string;
};

type Meta = {
  limit: number;
  offset: number;
  totalCount: number;
};

// Helper function to format Postman view URL
const getPostmanViewUrl = (element: Element) => {
  const teamDomain = process.env.POSTMAN_TEAM_DOMAIN || 'insurance-demo.postman.co';
  return `https://${teamDomain}/${element.type}/${element.id}`;
};

// Helper function for formatting response
export const formatPrivateApiResponse = (response: ApiResponse) => {
  const formatElement = (element: Element) => {
    return `## ${element.name}
**Type**: ${element.type}
**ID**: ${element.id}
**Parent Folder**: ${element.parentFolderId}
${element.description ? `**Description**: ${element.description}` : ''}
${element.summary ? `**Summary**: ${element.summary}` : ''}
🔗 [View in Postman](${getPostmanViewUrl(element)})
`;
  };

  const formatFolder = (folder: Folder) => {
    return `## 📁 ${folder.name}
**Type**: ${folder.type}
**ID**: ${folder.id}
**Parent Folder**: ${folder.parentFolderId}
${folder.description ? `**Description**: ${folder.description}` : ''}
`;
  };

  const elements = response.elements.map(formatElement).join('\n---\n');
  const folders = response.folders.map(formatFolder).join('\n---\n');

  return [{
    type: "text",
    text: `# Summary
Total Elements: ${response.meta.totalCount}

# Folders
${folders}

# Elements
${elements}`
  }];
};

// Main function to execute the API call
const fetchPrivateAPINetworkElements = async (params: QueryParams): Promise<ApiResponse> => {
  const baseUrl = process.env.POSTMAN_BASE_URL || 'https://api.getpostman.com';
  const apiKey = process.env.POSTMAN_API_KEY || '';

  if (!apiKey) {
    throw new Error('POSTMAN_API_KEY not found in environment variables');
  }

  try {

    // Construct the URL with query parameters
    const url = new URL(`${baseUrl}/network/private`);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value.toString());
      }
    });

    const headers: Record<string, string> = {
      'X-API-Key': apiKey,
      'Accept': 'application/json',
    };

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(JSON.stringify(errorData));
    }

    const data: ApiResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching elements and folders:', error);
    throw new Error('An error occurred while fetching elements and folders.');
  }
};

const get_all_elements_and_folders = async (params) => {
  try {
    const response = await fetchPrivateAPINetworkElements(params);
    return formatPrivateApiResponse(response);
  } catch (err) {
    console.error('Error getting elements and folders:', err);
    return [{
      type: "text",
      text: `Error getting elements and folders: ${err.message}`
    }];
  }
}

// Tool definition for Anthropic
export const postmanPrivateNetworkTool: ToolDefinition = {
  function: get_all_elements_and_folders,
  zodSchema: getAllElementsAndFoldersZodSchema,
  anthropic: {
    name: 'get_all_elements_and_folders',
    description: 'Fetch all elements and folders from the Private API Network.',
    input_schema: {
      type: 'object' as 'object',
      properties: {
        since: {
          type: 'string',
          description: 'Return only results created since the given time, in ISO 8601 format.',
        },
        until: {
          type: 'string',
          description: 'Return only results created until this given time, in ISO 8601 format.',
        },
        addedBy: {
          type: 'integer',
          description: 'Return only elements published by the given user ID.',
        },
        name: {
          type: 'string',
          description: 'Return only elements whose name includes the given value.',
        },
        summary: {
          type: 'string',
          description: 'Return only elements whose summary includes the given value.',
        },
        description: {
          type: 'string',
          description: 'Return only elements whose description includes the given value.',
        },
        sort: {
          type: 'string',
          enum: Object.values(SortOptions),
          description: 'Sort the results by the given value.',
        },
        direction: {
          type: 'string',
          enum: Object.values(DirectionOptions),
          description: 'Sort in ascending or descending order.',
        },
        createdBy: {
          type: 'integer',
          description: 'Return only the elements created by the given user ID.',
        },
        offset: {
          type: 'integer',
          description: 'The zero-based offset of the first item to return.',
        },
        limit: {
          type: 'integer',
          description: 'The maximum number of elements to return.',
        },
        parentFolderId: {
          type: 'integer',
          description: 'Return the folders and elements in a specific folder.',
        },
        type: {
          type: 'string',
          enum: Object.values(ElementType),
          description: 'Filter by the element type.',
        },
      },
      additionalProperties: false,
    },
  },
};