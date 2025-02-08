import Anthropic from "@anthropic-ai/sdk";

type CreateSongParams = {
  prompt: string;
  tags?: string;
  title: string;
  make_instrumental?: boolean;
  wait_audio?: boolean;
};

type SongResponseItem = {
  id: string;
  title: string;
  image_url: string;
  lyric: string;
  audio_url: string;
  video_url: string;
  created_at: string;
  model_name: string;
  status: string;
  gpt_description_prompt: string | null;
  prompt: string;
  type: string;
  tags: string;
};

type CreateSongResponse = SongResponseItem[];

const createSongWithSunoAI = async ({
  prompt,
  tags,
  title,
  make_instrumental = false,
  wait_audio = true,
}: CreateSongParams): Promise<CreateSongResponse> => {
  const sunoAIUrl = 'http://localhost:3000/api/custom_generate';
  
  try {
    const response = await fetch(sunoAIUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        tags,
        title,
        make_instrumental,
        wait_audio,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(JSON.stringify(errorData));
    }

    const data: CreateSongResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating song:', error);
    throw new Error('An error occurred while creating the song.');
  }
};

type AcedataCreateSongParams = {
  lyric: string;
  style: string;
  title: string;
  action?: 'generate';
  model?: string;
  custom?: boolean;
  instrumental?: boolean;
};

type AcedataSongResponse = {
  id: string;
  title: string;
  image_url: string;
  lyric: string;
  audio_url: string;
  video_url: string;
  created_at: string;
  model: string;
  state: string;
  style: string;
  duration: number;
};

type AcedataApiResponse = {
  success: boolean;
  task_id: string;
  trace_id: string;
  data: AcedataSongResponse[];
};

const createSongWithAcedata = async ({
  lyric,
  style,
  title,
  action = 'generate',
  model = 'chirp-v3-0',
  custom = true,
  instrumental = false,
}: AcedataCreateSongParams): Promise<AcedataApiResponse> => {
  const url = 'https://api.acedata.cloud/suno/audios';
  const token = `${process.env.ACEDATA_API_KEY}`;

  const body = JSON.stringify({
    action,
    model,
    lyric,
    custom,
    instrumental,
    style,
    title,
  });

  try {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(JSON.stringify(errorData));
    }

    const data: AcedataApiResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating song:', error);
    throw new Error('An error occurred while creating the song.');
  }
};

type ContentType = 'page';

type ExpandOptions =
  | 'childTypes.all'
  | 'body'
  | 'body.storage'
  | 'childTypes.attachment'
  | 'childTypes.comment'
  | 'childTypes.page'
  | 'container'
  | 'metadata.currentuser'
  | 'metadata.properties'
  | 'metadata.labels'
  | 'operations'
  | 'children.page'
  | 'children.attachment'
  | 'children.comment'
  | 'restrictions.read.restrictions.user'
  | 'restrictions.read.restrictions.group'
  | 'restrictions.update.restrictions.user'
  | 'restrictions.update.restrictions.group'
  | 'history'
  | 'version'
  | 'descendants.page'
  | 'descendants.attachment'
  | 'descendants.comment'
  | 'space';

type GetContentParams = {
  type: ContentType;
  title: string;
  expand: ExpandOptions[];
};

const getConfluenceContent = async ({ type, title, expand }: GetContentParams) => {
  const baseUrl = `${process.env.CONFLUENCE_BASE_URL}/wiki/rest`;
  const url = new URL(`${baseUrl}/api/content`);
  
  url.searchParams.append('type', type);
  url.searchParams.append('title', title);
  // Handle expand parameter - ensure it's an array and join with commas
  if (expand && Array.isArray(expand)) {
    url.searchParams.append('expand', expand.join(','));
  } else {
    // Default to include body.storage if no expand is provided
    url.searchParams.append('expand', 'body.storage');
  }

  // Create basic auth token
  const auth = Buffer.from(
    `${process.env.CONFLUENCE_USERNAME}:${process.env.CONFLUENCE_API_KEY}`
  ).toString('base64');

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching Confluence content:', error);
    throw new Error('An error occurred while fetching Confluence content');
  }
};

type ImageGenerationParams = {
  prompt: string;
  n?: number;
  size?: '256x256' | '512x512' | '1024x1024';
  model?: 'dall-e-3' | 'dall-e-2';
};

type ImageData = {
  revised_prompt: string;
  url: string;
};

type ImageGenerationResponse = {
  created: number;
  data: ImageData[];
};

const generateImage = async ({
  prompt,
  n = 1,
  size = '1024x1024',
  model = 'dall-e-3',
}: ImageGenerationParams): Promise<ImageGenerationResponse> => {
  const baseUrl = 'https://api.openai.com/v1';
  
  try {
    const response = await fetch(`${baseUrl}/images/generations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, n, size, model }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(JSON.stringify(errorData));
    }

    return await response.json();
  } catch (error) {
    console.error('Error generating image:', error);
    throw new Error('An error occurred while generating the image.');
  }
};

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
  {
    name: "create_song_with_suno_ai_classic",
    description: "Creates a song using Suno AI classic API, does not currently support instant video generation",
    input_schema: {
      type: "object",
      properties: {
        prompt: {
          type: "string",
          description: "The lyrics for the song, do not include instructions what the lyrics should be, just the lyrics themselves"
        },
        tags: {
          type: "string",
          description: "genre with the song."
        },
        title: {
          type: "string",
          description: "The title of the song."
        },
        make_instrumental: {
          type: "boolean",
          description: "Whether to create an instrumental version of the song."
        },
        wait_audio: {
          type: "boolean",
          description: "Whether to wait for the audio to be generated."
        }
      },
      required: ['prompt', 'title'],
      additionalProperties: false
    }
  },
  {
    name: 'create_song_suno_ai_ace',
    description: 'Create a song using Suno ACE API, supports music videos as well',
    input_schema: {
      type: 'object',
      properties: {
        musicText: {
          type: 'string',
          description: 'The lyrics for the song, do not include instructions what the lyrics should be, just the lyrics themselves'
        },
        musicStyle: {
          type: 'string',
          description: 'The style of the music (e.g., "rock", "pop", "jazz").'
        }
      },
      required: ['musicText', 'musicStyle'],
      additionalProperties: false
    }
  },
  {
    name: "get_confluence_content",
    description: "Retrieves content from Confluence",
    input_schema: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["page"],
          description: "The type of content to retrieve"
        },
        title: {
          type: "string",
          description: "The title of the content to retrieve"
        },
        expand: {
          type: "array",
          items: {
            type: "string",
            enum: [
              "body",
              "body.storage",
              "childTypes.all",
              "childTypes.attachment",
              "childTypes.comment",
              "childTypes.page",
              "container",
              "metadata.currentuser",
              "metadata.properties",
              "metadata.labels",
              "operations",
              "children.page",
              "children.attachment",
              "children.comment",
              "restrictions.read.restrictions.user",
              "restrictions.read.restrictions.group",
              "restrictions.update.restrictions.user",
              "restrictions.update.restrictions.group",
              "history",
              "version",
              "descendants.page",
              "descendants.attachment",
              "descendants.comment",
              "space"
            ]
          },
          description: "Properties to expand in the response, body.storage is required to get the content"
        }
      },
      required: ["type", "title"],
      additionalProperties: false
    }
  },
  {
    name: "generate_image",
    description: "Generate an image using DALL-E 3",
    input_schema: {
      type: "object",
      properties: {
        prompt: {
          type: "string",
          description: "The description of the image to generate"
        },
        n: {
          type: "integer",
          minimum: 1,
          maximum: 10,
          description: "The number of images to generate. Defaults to 1. dalle-3 only supports 1."
        },
        size: {
          type: "string",
          enum: ["256x256", "512x512", "1024x1024"],
          description: "The size of the generated image. Larger sizes produce more detailed images. Defaults to 1024x1024. dall-e-3 only supports 1024x1024."
        },
        model: {
          type: "string",
          enum: ["dall-e-3", "dall-e-2"],
          description: "The model to use for image generation."
        }
      },
      required: ["prompt"],
      additionalProperties: false
    }
  }
];

const functions = {
  get_weather: async (input: { location: string }) => {
    try {
      const response = await fetch(
        `https://api.weatherapi.com/v1/current.json?q=${input.location}&lang=en-us&key=${process.env.WEATHER_API_KEY}`,
      );
      const data = await response.json();
      console.log(
        `-------- Weather API response was ${data.current?.condition?.text ?? "unknown"}`,
      );
      return `The weather in ${input.location} is ${data.current?.condition?.text ?? "unknown"}`;
    } catch (err) {
      console.error(`Error getting the weather:`, err);
      return `Error getting the weather for ${input.location}`;
    }
  },
  create_song_with_suno_ai_classic: async (input: CreateSongParams) => {
    try {
      const response = await createSongWithSunoAI(input);
      console.log('-------- Suno AI response:', response);
      
      return response.map((song) => ({
        type: "text",
        text: `Generated song "${song.title}":
Lyrics:
${song.lyric}

Audio URL: ${song.audio_url}
Video URL: ${song.video_url}`
      }));

    } catch (err) {
      console.error('Error creating song with Suno AI:', err);
      return [{
        type: "text",
        text: 'Error creating song with Suno AI'
      }];
    }
  },
  create_song_suno_ai_ace: async (input: { musicText: string, musicStyle: string }) => {
    try {
      const response = await createSongWithAcedata({
        lyric: input.musicText,
        style: input.musicStyle,
        title: `Generated Song`,
      });
      console.log('-------- ACE Data response:', response);
      
      if (response.success && response.data.length > 0) {
        return response.data.map(song => ({
          type: "text",
          text: `Generated song "${song.title}":
Lyrics:
${song.lyric}

Style: ${song.style}
Audio URL: ${song.audio_url}
Video URL: ${song.video_url}`
        }));
      }
      
      return [{
        type: "text",
        text: 'Failed to generate song'
      }];
    } catch (err) {
      console.error('Error creating song with ACE Data:', err);
      return [{
        type: "text",
        text: 'Error creating song with ACE Data'
      }];
    }
  },
  get_confluence_content: async (input: Partial<GetContentParams>) => {
    try {
      // Ensure required parameters and defaults
      const params: GetContentParams = {
        type: input.type || 'page',
        title: input.title || '',
        expand: Array.isArray(input.expand) ? input.expand : ['body.storage']
      };

      const response = await getConfluenceContent(params);
      console.log('-------- Confluence response:', response);
      
      if (response.results && response.results.length > 0) {
        const content = response.results[0];
        return [{
          type: "text",
          text: `Title: ${content.title}
ID: ${content.id}
Type: ${content.type}
Status: ${content.status}
${content.body?.storage?.value ? `\nContent:\n${content.body.storage.value}` : ''}`
        }];
      }
      
      return [{
        type: "text",
        text: 'No content found'
      }];
    } catch (err) {
      console.error('Error getting Confluence content:', err);
      return [{
        type: "text",
        text: `Error getting Confluence content: ${err.message}`
      }];
    }
  },
  generate_image: async (input: ImageGenerationParams) => {
    try {
      const response = await generateImage(input);
      console.log('-------- DALL-E response:', response);
      
      if (response.data && response.data.length > 0) {
        return response.data.map(image => ({
          type: "text",
          text: `Generated image:
Original prompt: ${input.prompt}
Revised prompt: ${image.revised_prompt}
Image URL: ${image.url}`
        }));
      }
      
      return [{
        type: "text",
        text: 'Failed to generate image'
      }];
    } catch (err) {
      console.error('Error generating image:', err);
      return [{
        type: "text",
        text: `Error generating image: ${err.message}`
      }];
    }
  }
};

export { tools, functions };
