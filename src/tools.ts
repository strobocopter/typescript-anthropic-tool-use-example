import Anthropic from "@anthropic-ai/sdk";
import process from 'process';

import { postmanPrivateNetworkTool } from './postman-private-api-network';
import { postmanCollectionTool } from './postman-collection';
import { postmanToolgenTool } from './postman-toolgen';
import { postmanNetworkSearchTool } from './postman-network-search';
import { postmanWorkspaceCollectionsTool } from "./postman-workspace-collections";

export interface ToolDefinition {
  anthropic: Anthropic.Tool;
  function: (params: any) => Promise<any>;
  zodSchema: any;
}

// Add a utility function for truncating strings
export const truncateString = (str: string, maxLength?: number) => {
  const limit = maxLength || Number(process.env.TRUNCATION_LIMIT) || 19000;
  if (str.length <= limit) return str;
  return str.slice(0, limit - 3) + '...';
};

const tools: ToolDefinition[] = [
  postmanPrivateNetworkTool,
  postmanWorkspaceCollectionsTool,
  postmanCollectionTool,
  postmanToolgenTool,
  postmanNetworkSearchTool,
];

export { tools };
