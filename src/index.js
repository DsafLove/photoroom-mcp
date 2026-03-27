#!/usr/bin/env node
    import http2 from 'node:http2';
    import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
    import { createServer } from './server.js';
    import dotenv from 'dotenv';

    // Load environment variables
    dotenv.config();

    console.log('Starting Photoroom MCP server...');

    // Check for API key
    if (!process.env.PHOTOROOM_API_KEY) {
      console.warn('⚠️ PHOTOROOM_API_KEY not found in environment variables.');
      console.warn('Please create a .env file with your Photoroom API key.');
      console.warn('You can copy .env.example to .env and add your key.');
    }

    // Create an HTTP/2 cleartext (h2c) server.
    // Cloud Run terminates TLS and forwards traffic to containers using HTTP/2 cleartext,
    // so using http2.createServer() (without TLS) resolves the protocol error.
    // A fresh McpServer + StreamableHTTPServerTransport is created for every
    // incoming request because the SDK's stateless transport (sessionIdGenerator: undefined)
    // cannot be reused across multiple requests.
    const httpServer = http2.createServer(async (req, res) => {
      try {
        const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
        const server = createServer();
        await server.connect(transport);
        await transport.handleRequest(req, res);
      } catch (error) {
        console.error('Error handling request:', error);
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Internal server error' }));
        }
      }
    });

    const PORT = process.env.PORT || 8080;
    httpServer.listen(PORT, () => {
      console.log(`Photoroom MCP server listening on port ${PORT}`);
    });
