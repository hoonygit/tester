import { neon } from '@neondatabase/serverless';

// Netlify Function Handler
export const handler = async (event: any, context: any) => {
  // CORS Headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json; charset=utf-8'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Successful preflight call' })
    };
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'DATABASE_URL environment variable is not defined.' })
    };
  }

  const sql = neon(databaseUrl);

  try {
    // 1. Ensure table exists
    await sql`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(50) NOT NULL,
        start_time TIMESTAMP WITH TIME ZONE NOT NULL,
        end_time TIMESTAMP WITH TIME ZONE NOT NULL,
        all_day BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const path = event.path;
    const method = event.httpMethod;

    // We route requests via Netlify's redirects or directly
    // E.g., GET /api/events or GET /.netlify/functions/api
    // We check if it is GET, POST, PUT, or DELETE.

    // GET: Retrieve all events
    if (method === 'GET') {
      const rows = await sql`
        SELECT id, title, description, category, 
               start_time AS "startTime", 
               end_time AS "endTime", 
               all_day AS "allDay", 
               created_at AS "createdAt"
        FROM events 
        ORDER BY start_time ASC
      `;
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(rows)
      };
    }

    // POST: Create a new event
    if (method === 'POST') {
      if (!event.body) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing body' }) };
      }
      const data = JSON.parse(event.body);
      const { title, description, category, startTime, endTime, allDay } = data;

      if (!title || !category || !startTime || !endTime) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing required fields: title, category, startTime, endTime' })
        };
      }

      const result = await sql`
        INSERT INTO events (title, description, category, start_time, end_time, all_day)
        VALUES (${title}, ${description || ''}, ${category}, ${startTime}, ${endTime}, ${allDay || false})
        RETURNING id, title, description, category, 
                  start_time AS "startTime", 
                  end_time AS "endTime", 
                  all_day AS "allDay";
      `;

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(result[0])
      };
    }

    // PUT: Update an existing event
    if (method === 'PUT') {
      if (!event.body) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing body' }) };
      }
      const data = JSON.parse(event.body);
      const { id, title, description, category, startTime, endTime, allDay } = data;

      if (!id || !title || !category || !startTime || !endTime) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing required fields: id, title, category, startTime, endTime' })
        };
      }

      const result = await sql`
        UPDATE events 
        SET title = ${title}, 
            description = ${description || ''}, 
            category = ${category}, 
            start_time = ${startTime}, 
            end_time = ${endTime}, 
            all_day = ${allDay || false}
        WHERE id = ${id}
        RETURNING id, title, description, category, 
                  start_time AS "startTime", 
                  end_time AS "endTime", 
                  all_day AS "allDay";
      `;

      if (result.length === 0) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Event not found' }) };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result[0])
      };
    }

    // DELETE: Delete an event
    if (method === 'DELETE') {
      // Find ID from query string or body
      let id = event.queryStringParameters?.id;
      if (!id && event.body) {
        try {
          const data = JSON.parse(event.body);
          id = data.id;
        } catch (e) {
          // ignore
        }
      }

      if (!id) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing event ID' })
        };
      }

      const result = await sql`
        DELETE FROM events 
        WHERE id = ${id}
        RETURNING id;
      `;

      if (result.length === 0) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Event not found' }) };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'Event deleted successfully', id: result[0].id })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: `Method ${method} Not Allowed` })
    };
  } catch (error: any) {
    console.error('Database query error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal Server Error', details: error.message })
    };
  }
};
