import express, { Request, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { envVariables } from "../EnvironmentVariables";
import { COLOR_MAP } from "../logging/ColorMap";


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

// Helper function to colorize text
const colorize = (text: string, color: keyof typeof COLOR_MAP): string => {
  const supportsColor = process.stdout.isTTY && process.env.TERM !== 'dumb';
  if (!supportsColor) return text;
  return `\x1b[${COLOR_MAP[color]}m${text}\x1b[${COLOR_MAP.reset}m`;
};

// Helper function to create a box with proper alignment
const createBox = (lines: Array<{text: string, color?: keyof typeof COLOR_MAP}>, boxColor: keyof typeof COLOR_MAP, width: number = 55, style: 'double' | 'single' | 'rounded' = 'double') => {
  let chars: {tl: string, tr: string, bl: string, br: string, h: string, v: string};
  
  switch (style) {
    case 'double':
      chars = { tl: '╔', tr: '╗', bl: '╚', br: '╝', h: '═', v: '║' };
      break;
    case 'rounded':
      chars = { tl: '╭', tr: '╮', bl: '╰', br: '╯', h: '─', v: '│' };
      break;
    default:
      chars = { tl: '┌', tr: '┐', bl: '└', br: '┘', h: '─', v: '│' };
  }
  
  const topLine = chars.tl + chars.h.repeat(width) + chars.tr;
  const bottomLine = chars.bl + chars.h.repeat(width) + chars.br;
  
  console.log(colorize('  ' + topLine, boxColor));
  
  lines.forEach(line => {
    if (!line.text) {
      // Empty line
      console.log(colorize('  ' + chars.v + ' '.repeat(width) + chars.v, boxColor));
    } else {
      // Calculate padding needed
      const textLength = line.text.length;
      const totalPadding = width - textLength;
      const leftPadding = Math.floor(totalPadding / 2);
      const rightPadding = totalPadding - leftPadding;
      
      if (line.color) {
        // If text has its own color, we need to color the box and text separately
        console.log(
          colorize('  ' + chars.v, boxColor) + 
          ' '.repeat(leftPadding) +
          colorize(line.text, line.color) + 
          ' '.repeat(rightPadding) +
          colorize(chars.v, boxColor)
        );
      } else {
        // Simple case - everything is the same color
        console.log(colorize('  ' + chars.v + ' '.repeat(leftPadding) + line.text + ' '.repeat(rightPadding) + chars.v, boxColor));
      }
    }
  });
  
  console.log(colorize('  ' + bottomLine, boxColor));
};

// Start the server
app.listen(PORT, () => {
  const dbName = new URL(DB_CONNECTION_STRING).pathname.substring(1);
  
  // Clear the console for a clean display
  console.clear();
  
  // Display colorful header with sparkles
  console.log('\n');
  console.log(colorize('  ✨', 'brightYellow') + ' ' + colorize('Welcome to', 'brightWhite') + ' ' + colorize('✨', 'brightYellow'));
  createBox([
    { text: '' },
    { text: '🚀 HYREX STUDIO SERVER 🚀', color: 'brightMagenta' },
    { text: '' }
  ], 'brightCyan', 55, 'double');
  console.log('\n');
  
  // Display connection info with icons
  console.log(colorize('  ▸ ', 'brightGreen') + colorize('Status:', 'yellow') + ' ' + colorize('● Running', 'brightGreen'));
  console.log(colorize('  ▸ ', 'brightBlue') + colorize('Port:', 'yellow') + ' ' + colorize(String(PORT), 'brightWhite'));
  console.log(colorize('  ▸ ', 'brightMagenta') + colorize('Database:', 'yellow') + ' ' + colorize(dbName, 'brightWhite'));
  console.log(colorize('  ▸ ', 'brightCyan') + colorize('Verbose:', 'yellow') + ' ' + colorize(isVerbose ? '✓ Enabled' : '✗ Disabled', isVerbose ? 'brightGreen' : 'dim'));
  console.log('\n');
  
  // Display URL with emphasis and emojis
  createBox([
    { text: '' },
    { text: '🌐 Open Hyrex Studio in your browser:', color: 'brightWhite' },
    { text: '' },
    { text: '👉 https://local.hyrex.studio 👈', color: 'brightCyan' },
    { text: '' }
  ], 'brightBlue', 55, 'rounded');
  console.log('\n');
  
  if (!isVerbose) {
    console.log(colorize('  Tip: Use --verbose flag to see detailed logs', 'dim'));
  }
  console.log('\n');
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
