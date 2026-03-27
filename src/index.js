#!/usr/bin/env node
    import http from 'node:http';
    import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
    import { server } from './server.js';
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

    // Create a stateless HTTP Streamable transport
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    await server.connect(transport);

    // Create an HTTP server that forwards all requests to the MCP transport
    const httpServer = http.createServer((req, res) => {
      transport.handleRequest(req, res);
    });

    const PORT = process.env.PORT || 80;
    httpServer.listen(PORT, () => {
      console.log(`Photoroom MCP server listening on port ${PORT}`);
    });
