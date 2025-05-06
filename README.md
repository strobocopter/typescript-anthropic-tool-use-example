# Typescript Anthropic Tool Use Example

This repository demonstrates how to use Claude with multiple API tools including Weather, Music Generation (Suno), Image Generation (DALL-E), Content Management (Confluence), Backstage Catalog, Postman Private API Network, and Postman Collections.

![LLM with API Tools Architecture](llm-with-api-tools.png)

The Anthropic tool description and API client code has been generated with [Postman's New Toolgen API](https://www.postman.com/explore/toolgen).

![Postman Toolgen DALL-E Example](postman-toolgen-dall-e.png)

## MCP Server Functionality

The embedded Multi-Channel Prompt (MCP) server enables LLMs like Claude to interact with the exposed APIs and services through a unified interface. This allows for complex workflows combining multiple tools in response to natural language requests. In addition to the MCP server functionality, this application also provides a standalone, built-in, console based chat.

## Available Organs (Tools) to the Agentic AI (Claude LLM)

### Postman Private API Network
- Browse and search through private API collections
- Retrieve detailed API documentation and specifications
- Navigate through API folders and hierarchies
- View API endpoints and their details

### Postman Collections
- Fetch detailed collection information
- Access API documentation, endpoints, and example requests
- View collection structure and organization
- Support for both private and public collections

### Postman Toolgen
- Generate agent glue code for API requests in Postman collections
- supports multiple agent frameworks like Anthropic, OpenAI, Mistral, Gemini, Langchain, and Autogen
- supports multiple languages like TypeScript and JavaScript

### Postman Network Search
- Search the Postman Network for API requests based on a query
- Supports filtering by verified publishers
- Supports pagination

## Setup

1. Clone this repository
2. Install dependencies with `yarn install`
3. Build the application with `yarn build`
4. Copy `.env.example` to `.env`
5. Add your API keys to `.env`:
```env
POSTMAN_API_KEY=your_postman_key
```

## Usage

Start the application:
```bash
yarn start
```

You can then interact with Claude and use any of the available tools through natural language requests.

## Examples

1. Weather-Inspired Song:
```
Create a song about the current weather in Tokyo, using the weather API to get accurate conditions
```

2. Documentation to Music:
```
Get the content from our API documentation in Confluence and turn it into a funny rap song using the ACE API
```

3. Visual Story:
```
Check the weather in Paris and generate a DALL-E image that captures that weather condition with an artistic twist
```

4. Confluence Content Visualization:
```
Get the architecture diagram description from our Confluence page titled "System Design" and create a DALL-E image based on it
```

5. API Discovery:
```
Show me all APIs tagged with 'erp' in our Postman Private API Network and summarize their capabilities
```

6. Backstage Integration:
```
Find all API entities in Backstage that are related to our payment system and show their documentation
```

7. Collection Analysis:
```
Get the details of our order management collection and list all its endpoints
```

```
8. Search Postman Network:
```
Can you show me the top 10 requests in postman's network dealing with Harry Potter including the URL to have a look at the collection?
```

9. Generate TypeScript Code for API Integration:
```
Generate the TypeScript code required to integrate the API request for retrieving all Hogwarts students from the Harry Potter collection in Postman, using the Anthropic agent framework
```


## Error Handling

Each tool includes proper error handling and logging. Check the console output for detailed information about API responses and any errors that occur.

## Original Repository

The original base logic for Anthropic Function calling has been forked from [this repository](https://github.com/codewithpassion/typescript-anthropic-tool-use-example).