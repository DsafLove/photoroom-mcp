import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
    import { z } from 'zod';
    import { removeBackground } from './photoroom-api.js';

    // Factory function that creates and configures a new MCP server instance.
    // A fresh instance must be created for each incoming HTTP request because the
    // StreamableHTTPServerTransport in stateless mode cannot be reused across requests.
    export function createServer() {
      const server = new McpServer({
        name: "Photoroom API",
        version: "1.0.0",
        description: "MCP server for Photoroom API to remove backgrounds from images"
      });

      // Add remove background tool
      server.tool(
        "remove_background",
        {
          image_url: z.string().url().describe("URL of the image to process"),
          output_format: z.enum(["png", "jpg"]).default("png").describe("Output format (png or jpg)"),
          output_type: z.enum(["cutout", "room", "product"]).default("cutout").describe("Output type (cutout, room, or product)"),
          crop: z.boolean().default(false).describe("Whether to crop the image"),
          scale: z.number().min(0.1).max(10).default(1).describe("Scale factor for the output image")
        },
        async ({ image_url, output_format, output_type, crop, scale }) => {
          try {
            const result = await removeBackground(image_url, {
              outputFormat: output_format,
              outputType: output_type,
              crop,
              scale
            });

            return {
              content: [
                { 
                  type: "text", 
                  text: "Background removed successfully." 
                },
                {
                  type: "image",
                  url: result.resultUrl
                }
              ]
            };
          } catch (error) {
            return {
              content: [{ 
                type: "text", 
                text: `Error removing background: ${error.message}` 
              }],
              isError: true
            };
          }
        },
        { 
          description: "Remove the background from an image using Photoroom API" 
        }
      );

      return server;
    }
