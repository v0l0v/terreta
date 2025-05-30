#!/usr/bin/env node

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputFile = path.join(__dirname, '../public/icon.png');
const outputFile = path.join(__dirname, '../public/icon-processed.png');

async function processIcon() {
  console.log('Processing icon to remove green background and zoom in...');
  
  try {
    // First, let's analyze the image to understand its structure
    const image = sharp(inputFile);
    const metadata = await image.metadata();
    console.log('Original image metadata:', metadata);

    // Create a version with transparent background by removing green colors
    // We'll target the green theme color #10b981 and similar greens
    const processed = await image
      .ensureAlpha() // Ensure we have an alpha channel
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { data, info } = processed;
    const { width, height, channels } = info;
    
    console.log(`Processing ${width}x${height} image with ${channels} channels`);

    // Process pixel by pixel to remove green background
    const newData = Buffer.alloc(data.length);
    
    for (let i = 0; i < data.length; i += channels) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = channels === 4 ? data[i + 3] : 255;

      // Check if pixel is greenish (targeting the theme color #10b981 and similar)
      const isGreen = (
        g > r + 30 && // Green is significantly higher than red
        g > b + 30 && // Green is significantly higher than blue
        g > 100 &&    // Green value is substantial
        Math.abs(r - 16) < 50 && // Close to theme color red component
        Math.abs(g - 185) < 50 && // Close to theme color green component
        Math.abs(b - 129) < 50    // Close to theme color blue component
      ) || (
        // Also catch lighter/darker variations of green
        g > Math.max(r, b) + 20 && g > 80
      );

      if (isGreen) {
        // Make green pixels transparent
        newData[i] = 0;     // R
        newData[i + 1] = 0; // G
        newData[i + 2] = 0; // B
        newData[i + 3] = 0; // A (transparent)
      } else {
        // Keep non-green pixels
        newData[i] = r;
        newData[i + 1] = g;
        newData[i + 2] = b;
        newData[i + 3] = a;
      }
    }

    // Create image from processed data
    let processedImage = sharp(newData, {
      raw: {
        width,
        height,
        channels: 4
      }
    });

    // Find the bounding box of non-transparent content
    const stats = await processedImage.stats();
    
    // Trim transparent edges and add some padding
    processedImage = processedImage
      .trim({ threshold: 1 }) // Remove transparent edges
      .extend({
        top: 50,
        bottom: 50,
        left: 50,
        right: 50,
        background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent padding
      });

    // Save the processed image
    await processedImage
      .png({ quality: 90 })
      .toFile(outputFile);

    console.log('✓ Processed icon saved as icon-processed.png');
    console.log('✓ Green background removed and content zoomed in');
    
    // Now replace the original icon with the processed version
    fs.copyFileSync(outputFile, inputFile);
    console.log('✓ Original icon.png updated with processed version');
    
    // Clean up temporary file
    fs.unlinkSync(outputFile);
    console.log('✓ Temporary file cleaned up');

  } catch (error) {
    console.error('Error processing icon:', error);
    process.exit(1);
  }
}

processIcon();