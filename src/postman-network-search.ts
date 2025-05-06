import { z } from 'zod';

type Publisher = {
    type: 'team' | 'user';
    name: string;
    profilePicUrl: string;
    isVerified?: boolean;
};

type Links = {
    web: {
        href: string;
    };
    self: {
        href: string;
    };
};

type SearchResult = {
    id: string;
    name: string;
    url: string;
    method: string;
    collection: {
        id: string;
    };
    workspace: {
        id: string;
    };
    publisher: Publisher;
    links: Links;
};

type SearchResponse = {
    data: SearchResult[];
    meta: {
        q: string;
        total: number;
        nextCursor?: string;
    };
};

type ErrorResponse = {
    type: string;
    title: string;
    detail: string;
    status: number;
    instance?: string;
};

type SearchParams = {
    elementType: 'requests';
    query: string;
    publisherIsVerified?: boolean;
    limit?: number;
    nextCursor?: string;
};

export const searchNetworkZodSchema = {
    elementType: z.literal('requests').describe('The type of Postman element to search for. At this time, this only accepts the "requests" value.'),
    query: z.string().describe('The search query to find relevant requests.'),
    publisherIsVerified: z.boolean().optional().describe('Filter the search results to only return entities from publishers verified by Postman.'),
    limit: z.number().min(1).max(10).optional().describe('The max number of search results returned in the response. The maximum allowed value is 10.'),
    nextCursor: z.string().optional().describe('The pagination cursor that points to the next record in the results set.')
};

export const search_postman_network = async ({
    elementType,
    query,
    publisherIsVerified,
    limit,
    nextCursor,
}: SearchParams): Promise<SearchResponse | ErrorResponse> => {
    const baseUrl = process.env.POSTMAN_BASE_URL || 'https://api.getpostman.com';
    const apiKey = process.env.POSTMAN_API_KEY;

    if (!apiKey) {
        throw new Error('POSTMAN_API_KEY not found in environment variables');
    }

    try {
        // Construct the URL with query parameters
        const url = new URL(`${baseUrl}/search/${elementType}`);
        url.searchParams.append('q', query);

        if (publisherIsVerified !== undefined) {
            url.searchParams.append('publisherIsVerified', publisherIsVerified.toString());
        }
        if (limit !== undefined) {
            url.searchParams.append('limit', limit.toString());
        }
        if (nextCursor) {
            url.searchParams.append('nextCursor', nextCursor);
        }

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'X-API-Key': apiKey,
                'Accept': 'application/json',
            },
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
            title: 'Something went wrong',
            status: 500,
            detail: `Something went wrong while searching the network: ${error}`,
        };
    }
};

// Tool definition for Anthropic
export const postmanNetworkSearchTool = {
    function: search_postman_network,
    definition: {
        name: 'search_postman_network',
        description: 'Search the Postman API Network for requests based on a query.',
        input_schema: {
            type: 'object' as 'object',
            properties: {
                elementType: {
                    type: 'string',
                    enum: ['requests'],
                    description: 'The type of Postman element to search for. At this time, this only accepts the "requests" value.'
                },
                query: {
                    type: 'string',
                    description: 'The search query to find relevant requests.'
                },
                publisherIsVerified: {
                    type: 'boolean',
                    description: 'Filter the search results to only return entities from publishers verified by Postman.'
                },
                limit: {
                    type: 'integer',
                    minimum: 1,
                    maximum: 10,
                    description: 'The max number of search results returned in the response. The maximum allowed value is 10.'
                },
                nextCursor: {
                    type: 'string',
                    description: 'The pagination cursor that points to the next record in the results set.'
                }
            },
            required: ['elementType', 'query'],
            additionalProperties: false
        }
    }
}; 