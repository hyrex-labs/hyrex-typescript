import express, { Request, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { envVariables } from "../EnvironmentVariables";


// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.STUDIO_PORT || 1337;
const isVerbose = process.env.STUDIO_VERBOSE === 'true';

// Database connection string
const DB_CONNECTION_STRING = envVariables.getDatabaseUrl()
if (!DB_CONNECTION_STRING) {
  throw new Error("To run Hyrex Studio you must specify a database connection string.");
}

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Only add morgan logging if verbose flag is set
if (process.env.STUDIO_VERBOSE === 'true') {
  app.use(morgan('combined'));
}

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: DB_CONNECTION_STRING,
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Execute raw SQL query
app.post('/api/query', (req: Request, res: Response) => {
  const { query, params = [] } = req.body;

  if (process.env.STUDIO_VERBOSE === 'true') {
    if (isVerbose) {
    console.log('Received query payload:', JSON.stringify({ query, params }, null, 2));
  }
  }

  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  pool.connect()
    .then(client => {
      return client.query(query, params)
        .then(result => {
          res.json({
            rows: result.rows,
            rowCount: result.rowCount,
            fields: result.fields.map(f => ({
              name: f.name,
              dataTypeID: f.dataTypeID
            }))
          });
          client.release();
        })
        .catch(error => {
          client.release();
          if (isVerbose) {
            console.error('Error executing query:', error);
          }
          res.status(500).json({
            error: 'Error executing query',
            message: error instanceof Error ? error.message : String(error)
          });
        });
    })
    .catch(error => {
      if (isVerbose) {
        console.error('Error connecting to database:', error);
      }
      res.status(500).json({
        error: 'Error connecting to database',
        message: error instanceof Error ? error.message : String(error)
      });
    });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Hyrex Studio Server running on port ${PORT}`);
  const dbName = new URL(DB_CONNECTION_STRING).pathname.substring(1)
  console.log(`Using database: ${dbName}`);
});

// Handle server shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  pool.end()
    .then(() => {
      console.log('Database pool closed');
      process.exit(0);
    })
    .catch(err => {
      console.error('Error closing database pool:', err);
      process.exit(1);
    });
});
