import Anthropic from "@anthropic-ai/sdk";
import process from 'process';

import {
  postmanPrivateNetworkTool,
  getAllElementsAndFoldersZodSchema,
  fetchPrivateAPINetworkElements,
  formatPrivateApiResponse
} from './private-api-network';
import {
  postmanCollectionTool,
  getCollectionZodSchema,
  fetchPostmanCollection,
  formatCollectionResponse
} from './postman-collection';
import {
  postmanToolgenTool,
  generateToolZodSchema,
  generate_tool_from_postman_request,
  GenerateToolParams,
} from './postman-toolgen';
import {
  postmanNetworkSearchTool,
  searchNetworkZodSchema,
  search_postman_network,
} from './postman-network-search';

// Add this near the top of the file after the imports
const zodSchemas = {
  get_all_elements_and_folders: getAllElementsAndFoldersZodSchema,
  get_collection: getCollectionZodSchema,
  generate_tool: generateToolZodSchema,
  search_postman_network: searchNetworkZodSchema
};

// Add a utility function for truncating strings
const truncateString = (str: string, maxLength?: number) => {
  const limit = maxLength || Number(process.env.TRUNCATION_LIMIT) || 19000;
  if (str.length <= limit) return str;
  return str.slice(0, limit - 3) + '...';
};

const tools: Anthropic.Tool[] = [
  postmanPrivateNetworkTool.definition,
  postmanCollectionTool.definition,
  postmanToolgenTool.definition,
  postmanNetworkSearchTool.definition,
];

const functions = {
  get_all_elements_and_folders: async (params) => {
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
  },
  get_collection: async (params) => {
    try {
      const response = await fetchPostmanCollection(params);
      const fullSpec = JSON.stringify(response, null, 2); // Convert full collection spec to string
      const formattedResponse = formatCollectionResponse(response);

      const text = formattedResponse.map(item => item.text).join('\n\n');
      const fullText = `${text}\n\nFull Collection Spec:\n${fullSpec}`;

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
  },
  generate_tool: async (params: GenerateToolParams) => {
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
  },
  search_postman_network: async (params) => {
    try {
      const response = await search_postman_network(params);
      if ('data' in response) {
        const text = `Found ${response.meta.total} results:
${response.data.map(result => `
Name: ${result.name}
Method: ${result.method}
URL: ${result.url}
Collection:
  - ID: ${result.collection.id}
  - Go URL: https://go.postman.co/collections/${result.collection.id}
Workspace:
  - ID: ${result.workspace.id}
  - Go URL: https://go.postman.co/workspace/${result.workspace.id}
Publisher: ${result.publisher.name}${result.publisher.isVerified ? ' (Verified)' : ''}
Publisher Type: ${result.publisher.type}
Publisher Profile: ${result.publisher.profilePicUrl}
Links:
  - Web View: ${result.links.web.href}
  - API Endpoint: ${result.links.self.href}
---`).join('\n')}

${response.meta.nextCursor ? `Next Page Cursor: ${response.meta.nextCursor}` : 'No more pages available'}`;

        return [{
          type: "text",
          text: truncateString(text)
        }];
      } else {
        return [{
          type: "text",
          text: `Error searching network: ${response.detail}`
        }];
      }
    } catch (err) {
      console.error('Error searching network:', err);
      return [{
        type: "text",
        text: `Error searching network: ${err.message}`
      }];
    }
  },
};

export { tools, functions, zodSchemas };
