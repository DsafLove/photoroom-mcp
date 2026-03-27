import fetch from 'node-fetch';
import FormData from 'form-data';

/**
 * Remove background from an image using Photoroom API (Basic plan)
 * @param {string} imageUrl - URL of the image to process
 * @param {Object} options - Options for the API
 * @param {string} options.outputFormat - Output format (png or jpg)
 * @param {string} options.outputType - Output type (cutout, room, or product)
 * @param {boolean} options.crop - Whether to crop the image
 * @param {number} options.scale - Scale factor for the output image
 * @returns {Promise<Object>} - Result object with resultUrl
 */
export async function removeBackground(imageUrl, options = {}) {
  const apiKey = process.env.PHOTOROOM_API_KEY;

  if (!apiKey) {
    throw new Error('PHOTOROOM_API_KEY not found in environment variables');
  }

  const {
    outputFormat = 'png',
    outputType = 'cutout',
    crop = false,
    scale = 1
  } = options;

  try {
    // Fetch the image from the URL
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
    }
    const imageBuffer = await imageResponse.buffer();

    // Create form data
    const formData = new FormData();
    formData.append('image_file', imageBuffer, {
      filename: 'image.jpg',
      contentType: imageResponse.headers.get('content-type')
    });

    // Set API parameters
    const apiUrl = `https://sdk.photoroom.com/v1/segment`;
    const params = new URLSearchParams();
    params.append('format', outputFormat);
    params.append('type', outputType);
    params.append('crop', crop.toString());
    params.append('scale', scale.toString());

    // Make API request
    const response = await fetch(`${apiUrl}?${params.toString()}`, {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Photoroom API error (${response.status}): ${errorText}`);
    }

    const resultBuffer = await response.buffer();
    const resultBase64 = resultBuffer.toString('base64');
    const resultMimeType = outputFormat === 'png' ? 'image/png' : 'image/jpeg';

    return {
      resultBase64,
      resultMimeType,
      success: true
    };
  } catch (error) {
    console.error('Error in removeBackground:', error);
    throw error;
  }
}

/**
 * Edit an image using Photoroom Image Editing API (Plus plan)
 * @param {string} imageUrl - URL of the image to process
 * @param {Object} options - Options for the API
 * @param {boolean} options.removeBackground - Whether to remove the background
 * @param {string} options.backgroundColor - Background color (hex or color name)
 * @param {string} options.backgroundPrompt - AI-generated background prompt
 * @param {string} options.shadowMode - Shadow mode (ai.soft, ai.hard, ai.floating)
 * @param {number} options.padding - Padding around the subject (0–0.5 fraction)
 * @param {string} options.outputSize - Output dimensions (e.g. "1920x1080")
 * @param {string} options.exportFormat - Export format (png, jpg, webp)
 * @param {string} options.expandMode - AI expand mode ("ai.auto")
 * @param {string} options.uncropMode - AI uncrop mode ("ai.auto")
 * @param {string} options.backgroundBlurMode - Background blur mode (bokeh, gaussian)
 * @param {string} options.lightingMode - AI relight mode
 * @param {string} options.textRemovalMode - AI text removal mode ("auto")
 * @param {string} options.beautifyMode - AI beautification mode ("auto")
 * @param {string} options.flatLayMode - Flat lay mode ("ai.auto")
 * @param {string} options.ghostMannequinMode - Ghost mannequin mode ("ai.auto")
 * @param {string} options.upscaleMode - AI upscale mode ("auto")
 * @returns {Promise<Object>} - Result object with resultUrl
 */
export async function editImage(imageUrl, options = {}) {
  const apiKey = process.env.PHOTOROOM_API_KEY;

  if (!apiKey) {
    throw new Error('PHOTOROOM_API_KEY not found in environment variables');
  }

  try {
    const params = new URLSearchParams();
    params.append('imageUrl', imageUrl);

    if (options.removeBackground !== undefined) {
      params.append('removeBackground', options.removeBackground.toString());
    }
    if (options.backgroundColor) {
      params.append('background.color', options.backgroundColor);
    }
    if (options.backgroundPrompt) {
      params.append('background.prompt', options.backgroundPrompt);
    }
    if (options.shadowMode) {
      params.append('shadow.mode', options.shadowMode);
    }
    if (options.padding !== undefined) {
      params.append('padding', options.padding.toString());
    }
    if (options.outputSize) {
      params.append('outputSize', options.outputSize);
    }
    if (options.exportFormat) {
      params.append('export.format', options.exportFormat);
    }
    if (options.expandMode) {
      params.append('expand.mode', options.expandMode);
    }
    if (options.uncropMode) {
      params.append('uncrop.mode', options.uncropMode);
    }
    if (options.backgroundBlurMode) {
      params.append('background.blur.mode', options.backgroundBlurMode);
    }
    if (options.lightingMode) {
      params.append('lighting.mode', options.lightingMode);
    }
    if (options.textRemovalMode) {
      params.append('textRemoval.mode', options.textRemovalMode);
    }
    if (options.beautifyMode) {
      params.append('beautify.mode', options.beautifyMode);
    }
    if (options.flatLayMode) {
      params.append('flatLay.mode', options.flatLayMode);
    }
    if (options.ghostMannequinMode) {
      params.append('ghostMannequin.mode', options.ghostMannequinMode);
    }
    if (options.upscaleMode) {
      params.append('upscale.mode', options.upscaleMode);
    }

    const apiUrl = `https://image-api.photoroom.com/v2/edit?${params.toString()}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Photoroom API error (${response.status}): ${errorText}`);
    }

    const resultBuffer = await response.buffer();
    const resultMimeType = response.headers.get('content-type') || 'image/png';
    const resultBase64 = resultBuffer.toString('base64');

    return {
      resultBase64,
      resultMimeType,
      success: true
    };
  } catch (error) {
    console.error('Error in editImage:', error);
    throw error;
  }
}
