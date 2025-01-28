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
    description: "Creates a song using Suno AI classic API",
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
    description: 'Create a song using Suno ACE API.',
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
        const song = response.data[0];
        return `Generated song "${song.title}":
Lyrics:
${song.lyric}

Style: ${song.style}
Audio URL: ${song.audio_url}
Video URL: ${song.video_url}`;
      }
      
      return 'Failed to generate song';
    } catch (err) {
      console.error('Error creating song with ACE Data:', err);
      return 'Error creating song with ACE Data';
    }
  }
};

export { tools, functions };
