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
        // 'Authorization': `Bearer ${process.env.OpenAIToken}`, // Token will be provided by the user
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
    name: "create_song_with_suno_ai",
    description: "Creates a song using Suno AI based on the provided prompt and parameters.",
    input_schema: {
      type: "object",
      properties: {
        prompt: {
          type: "string",
          description: "The text prompt for the song generation."
        },
        tags: {
          type: "string",
          description: "Tags associated with the song."
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
  create_song_with_suno_ai: async (input: CreateSongParams) => {
    try {
      const response = await createSongWithSunoAI(input);
      console.log('-------- Suno AI response:', response);
      
      return response;
    } catch (err) {
      console.error('Error creating song with Suno AI:', err);
      return 'Error creating song with Suno AI';
    }
  }
};

export { tools, functions };
