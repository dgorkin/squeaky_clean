// Cloudflare Worker — proxies requests to Anthropic API for AI schedule generation
// Rate limited to 20 requests per hour

const RATE_LIMIT_WINDOW = 3600; // 1 hour in seconds
const RATE_LIMIT_MAX = 20;

const SYSTEM_PROMPT = `You are a helpful house cleaning schedule assistant for the "Squeaky Clean" app.
When the user describes their cleaning needs, generate a structured list of cleaning tasks.

Return ONLY valid JSON — no markdown, no explanation — in this exact format:
{
  "tasks": [
    {
      "title": "Task name",
      "frequency": "weekly|daily|biweekly|monthly|quarterly|annually",
      "category": "Kitchen|Bathroom|Bedroom|Living Room|Outdoor|Laundry|Garage|General",
      "priority": "low|medium|high",
      "notes": "Optional helpful tip or detail"
    }
  ]
}

Guidelines:
- Generate 5-15 practical, actionable tasks
- Use clear, concise task titles
- Assign appropriate categories from the list above
- Set realistic frequencies
- Include helpful tips in the notes field when relevant
- Prioritize based on hygiene impact and frequency needs
- Be practical and specific, not generic`;

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders(),
      });
    }

    // Only handle POST to /api/generate-schedule
    const url = new URL(request.url);
    if (url.pathname !== '/api/generate-schedule' || request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      });
    }

    // Rate limiting using Cloudflare KV (or in-memory fallback)
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    const rateLimitKey = `rate:${clientIP}`;

    if (env.RATE_LIMIT) {
      const current = await env.RATE_LIMIT.get(rateLimitKey);
      const count = current ? parseInt(current) : 0;

      if (count >= RATE_LIMIT_MAX) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          {
            status: 429,
            headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
          }
        );
      }

      await env.RATE_LIMIT.put(rateLimitKey, String(count + 1), {
        expirationTtl: RATE_LIMIT_WINDOW,
      });
    }

    // Parse request
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      });
    }

    const userPrompt = body.prompt;
    if (!userPrompt || typeof userPrompt !== 'string' || userPrompt.length > 2000) {
      return new Response(
        JSON.stringify({ error: 'Please provide a prompt (max 2000 characters).' }),
        {
          status: 400,
          headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
        }
      );
    }

    // Call Anthropic API
    const apiKey = env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key not configured. Please set ANTHROPIC_API_KEY secret.' }),
        {
          status: 500,
          headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
        }
      );
    }

    try {
      const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2048,
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: 'user',
              content: userPrompt,
            },
          ],
        }),
      });

      if (!anthropicRes.ok) {
        const errText = await anthropicRes.text();
        console.error('Anthropic API error:', errText);
        return new Response(
          JSON.stringify({ error: 'AI service temporarily unavailable. Please try again.' }),
          {
            status: 502,
            headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
          }
        );
      }

      const anthropicData = await anthropicRes.json();
      const content = anthropicData.content?.[0]?.text || '';

      // Parse the JSON response
      let tasks;
      try {
        const parsed = JSON.parse(content);
        tasks = parsed.tasks || parsed;
      } catch {
        // Try to extract JSON from the response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          tasks = parsed.tasks || parsed;
        } else {
          throw new Error('Could not parse AI response');
        }
      }

      return new Response(JSON.stringify({ tasks }), {
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      });
    } catch (err) {
      console.error('Worker error:', err);
      return new Response(
        JSON.stringify({ error: 'Failed to generate schedule. Please try again.' }),
        {
          status: 500,
          headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
        }
      );
    }
  },
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
