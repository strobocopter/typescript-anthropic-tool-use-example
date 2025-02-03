# Typescript Anthropic Tool Use Example

This repository demonstrates how to use Claude with multiple API tools including Weather, Music Generation (Suno), Image Generation (DALL-E), and Content Management (Confluence).

![LLM with API Tools Architecture](llm-with-api-tools.png)

The Anthropic tool description and API client code has been generated with [Postman's New Toolgen API](https://www.postman.com/explore/toolgen).

![Postman Toolgen DALL-E Example](postman-toolgen-dall-e.png)

## Available Organs (Tools) to the Agentic AI (Claude LLM)

### Weather API
- Get current weather conditions for any location
- Requires `WEATHER_API_KEY` in environment variables
- Returns temperature and weather description

### Suno AI (Classic)
- Generate songs with custom lyrics and style
- Local API endpoint for song generation
- Returns audio URL and generated lyrics

### Suno AI (ACE)
- Advanced song generation with video support
- Requires `ACEDATA_API_KEY` in environment variables
- Returns audio URL, video URL, and lyrics

### DALL-E Image Generation
- Generate images from text descriptions using DALL-E 3
- Supports different image sizes (256x256, 512x512, 1024x1024)
- DALL-E 3 specific features:
  - High-quality image generation
  - Revised prompts for better results
  - Limited to 1 image per request
  - Only supports 1024x1024 size
- Requires `OPENAI_API_KEY` in environment variables

### Confluence Content Management
- Retrieve content from Confluence workspace
- Supports various content expansions (body, attachments, comments, etc.)
- Authentication using Basic Auth with:
  - `CONFLUENCE_USERNAME`
  - `CONFLUENCE_API_KEY`
  - `CONFLUENCE_BASE_URL`

## Setup

1. Clone this repository
2. Install dependencies with `yarn install`
3. Copy `.env.example` to `.env`
4. Add your API keys to `.env`:
```env
ANTHROPIC_API_KEY=your_anthropic_key
WEATHER_API_KEY=your_weather_key
ACEDATA_API_KEY=your_acedata_key
CONFLUENCE_USERNAME=your_confluence_email
CONFLUENCE_API_KEY=your_confluence_api_key
CONFLUENCE_BASE_URL=your_confluence_url
OPENAI_API_KEY=your_openai_key
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

## Error Handling

Each tool includes proper error handling and logging. Check the console output for detailed information about API responses and any errors that occur.

## Origial Repository

The original base logic for Anthropic Function calling has been forked from [this repository](https://github.com/codewithpassion/typescript-anthropic-tool-use-example).