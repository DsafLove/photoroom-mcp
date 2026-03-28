import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { removeBackground, editImage } from './photoroom-api.js';

// Factory function that creates and configures a new MCP server instance.
// A fresh instance must be created for each incoming HTTP request because the
// StreamableHTTPServerTransport in stateless mode cannot be reused across requests.
export function createServer() {
  const server = new McpServer({
    name: "Photoroom API",
    version: "1.0.0",
    description: "MCP server for Photoroom API"
  });

  // Add remove background tool (Basic plan - /v1/segment)
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
              data: result.resultBase64,
              mimeType: result.resultMimeType
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
      description: "Remove the background from an image using Photoroom API (Basic plan)"
    }
  );

  // Add image editing tool (Plus plan - /v2/edit)
  server.tool(
    "edit_image",
    {
      image_url: z.string().url().describe("URL of the image to edit"),
      remove_background: z.boolean().optional().describe("Whether to remove the background (default: true)"),
      background_color: z.string().optional().describe("Background color as a hex code (e.g. FF0000) or color name (e.g. red). Cannot be combined with background_prompt."),
      background_prompt: z.string().optional().describe("Text prompt to generate an AI background (e.g. 'a sunny beach'). Requires background removal."),
      shadow_mode: z.enum(["ai.soft", "ai.hard", "ai.floating"]).optional().describe("Add a realistic AI shadow to the subject"),
      padding: z.number().min(0).max(0.5).optional().describe("Padding around the subject as a fraction of the output size (0–0.5)"),
      output_size: z.string().optional().describe("Output dimensions in WIDTHxHEIGHT format (e.g. '1920x1080'). Aspect ratio is maintained when only one dimension changes."),
      export_format: z.enum(["png", "jpg", "webp"]).default("png").describe("Output image format"),
      expand_mode: z.enum(["ai.auto"]).optional().describe("AI Expand: seamlessly expand the background to fill the output canvas"),
      uncrop_mode: z.enum(["ai.auto"]).optional().describe("AI Uncrop: reconstruct clipped edges of the main subject. Requires remove_background=true."),
      background_blur_mode: z.enum(["bokeh", "gaussian"]).optional().describe("Blur the background of the image. Requires remove_background=false."),
      lighting_mode: z.enum(["ai.auto", "ai.preserve-hue-and-saturation"]).optional().describe("AI Relight: intelligently relight the subject"),
      text_removal_mode: z.enum(["ai.artificial", "ai.natural", "ai.all"]).optional().describe("AI Text Removal: automatically detect and remove text from the image"),
      beautify_mode: z.enum(["ai.auto", "ai.food", "ai.car"]).optional().describe("AI Beautifier: ai.auto for packshot product images, ai.food for food images (e.g. placing subject on a plate), ai.car for car images (e.g. removing reflections)"),
      flat_lay_mode: z.enum(["ai.auto"]).optional().describe("Flat Lay: generate a clean top-down product image for e-commerce"),
      ghost_mannequin_mode: z.enum(["ai.auto"]).optional().describe("Ghost Mannequin: remove the mannequin from clothing product images"),
      upscale_mode: z.enum(["ai.fast", "ai.slow"]).optional().describe("AI Upscale: increase the resolution of the image (ai.fast: optimized for speed, ai.slow: optimized for quality)")
    },
    async ({
      image_url,
      remove_background,
      background_color,
      background_prompt,
      shadow_mode,
      padding,
      output_size,
      export_format,
      expand_mode,
      uncrop_mode,
      background_blur_mode,
      lighting_mode,
      text_removal_mode,
      beautify_mode,
      flat_lay_mode,
      ghost_mannequin_mode,
      upscale_mode
    }) => {
      try {
        // Validate mutually exclusive and dependent parameter combinations
        if (background_color && background_prompt) {
          return {
            content: [{ type: "text", text: "Error editing image: background_color and background_prompt cannot be used together. Use one or the other." }],
            isError: true
          };
        }
        if (uncrop_mode && background_blur_mode) {
          return {
            content: [{ type: "text", text: "Error editing image: uncrop_mode and background_blur_mode cannot be used together. uncrop_mode requires remove_background=true, while background_blur_mode requires remove_background=false." }],
            isError: true
          };
        }
        if (uncrop_mode && remove_background === false) {
          return {
            content: [{ type: "text", text: "Error editing image: uncrop_mode requires remove_background=true." }],
            isError: true
          };
        }
        if (background_blur_mode && remove_background === true) {
          return {
            content: [{ type: "text", text: "Error editing image: background_blur_mode requires remove_background=false." }],
            isError: true
          };
        }

        const result = await editImage(image_url, {
          removeBackground: remove_background,
          backgroundColor: background_color,
          backgroundPrompt: background_prompt,
          shadowMode: shadow_mode,
          padding,
          outputSize: output_size,
          exportFormat: export_format,
          expandMode: expand_mode,
          uncropMode: uncrop_mode,
          backgroundBlurMode: background_blur_mode,
          lightingMode: lighting_mode,
          textRemovalMode: text_removal_mode,
          beautifyMode: beautify_mode,
          flatLayMode: flat_lay_mode,
          ghostMannequinMode: ghost_mannequin_mode,
          upscaleMode: upscale_mode
        });

        return {
          content: [
            {
              type: "text",
              text: "Image edited successfully."
            },
            {
              type: "image",
              data: result.resultBase64,
              mimeType: result.resultMimeType
            }
          ]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error editing image: ${error.message}`
          }],
          isError: true
        };
      }
    },
    {
      description: "Edit an image using Photoroom Image Editing API (Plus plan). Supports background removal, AI backgrounds, AI shadows, AI expand, AI uncrop, background blur, AI relight, text removal, AI beautifier, flat lay, ghost mannequin, and AI upscale."
    }
  );

  return server;
}
