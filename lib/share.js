import { db } from './firebase';
import { collection, addDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Create a shareable link for a chat message
 * @param {string} userId - User ID
 * @param {string} message - User message
 * @param {string} response - AI response
 * @param {string} model - Model used
 * @returns {Promise<string>} - Shareable URL
 */
export async function shareChatMessage(userId, message, response, model = 'AI') {
  try {
    const shareData = {
      type: 'chat',
      userId,
      message,
      response,
      model,
      createdAt: serverTimestamp(),
      views: 0
    };
    
    const docRef = await addDoc(collection(db, 'sharedContent'), shareData);
    const shareUrl = `${window.location.origin}/shared/chat/${docRef.id}`;
    return shareUrl;
  } catch (error) {
    console.error('Error creating share link:', error);
    throw error;
  }
}

/**
 * Create a shareable link for an image
 * @param {string} userId - User ID
 * @param {string} prompt - Image prompt
 * @param {string} imageUrl - Generated image URL
 * @returns {Promise<string>} - Shareable URL
 */
export async function shareImage(userId, prompt, imageUrl) {
  try {
    const shareData = {
      type: 'image',
      userId,
      prompt,
      imageUrl,
      createdAt: serverTimestamp(),
      views: 0
    };
    
    const docRef = await addDoc(collection(db, 'sharedContent'), shareData);
    const shareUrl = `${window.location.origin}/shared/image/${docRef.id}`;
    return shareUrl;
  } catch (error) {
    console.error('Error creating share link:', error);
    throw error;
  }
}

/**
 * Get shared content by ID
 * @param {string} shareId - Shared content ID
 * @returns {Promise<object>} - Shared content data
 */
export async function getSharedContent(shareId) {
  try {
    const docRef = doc(db, 'sharedContent', shareId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching shared content:', error);
    throw error;
  }
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} - Success status
 */
export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    }
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    return false;
  }
}

/**
 * Download image with watermark
 * @param {string} imageUrl - Image URL
 * @param {string} prompt - Image prompt
 * @param {string} filename - Download filename
 */
export async function downloadImageWithWatermark(imageUrl, prompt, filename = 'ai-generated-image.png') {
  try {
    // Create canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Load image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    return new Promise((resolve, reject) => {
      img.onload = () => {
        // Set canvas size
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw image
        ctx.drawImage(img, 0, 0);
        
        // Add watermark
        const watermarkText = 'Made with AI Platform';
        const fontSize = Math.max(16, img.width / 40);
        ctx.font = `${fontSize}px Inter, sans-serif`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 2;
        
        const textWidth = ctx.measureText(watermarkText).width;
        const x = img.width - textWidth - 20;
        const y = img.height - 20;
        
        ctx.strokeText(watermarkText, x, y);
        ctx.fillText(watermarkText, x, y);
        
        // Convert to blob and download
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            resolve(true);
          } else {
            reject(new Error('Failed to create blob'));
          }
        }, 'image/png');
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageUrl;
    });
  } catch (error) {
    console.error('Error downloading image:', error);
    throw error;
  }
}

