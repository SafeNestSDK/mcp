import express from 'express';
import cors from 'cors';
import { createServer } from './src/index.js';
import { createHttpHandler } from './src/transport.js';

const app = express();
const port = parseInt(process.env.PORT || '3001', 10);

app.use(cors());
app.use(express.json());

const mcpServer = createServer();
const mcpHandler = createHttpHandler(mcpServer);

app.all('/mcp', (req, res) => {
  mcpHandler(req, res).catch((err) => {
    console.error('MCP handler error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: '3.0.0' });
});

app.listen(port, () => {
  console.error(`Tuteliq MCP App server running on http://localhost:${port}/mcp`);
});
