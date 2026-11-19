const IMAGE_EXTENSION_RE = /\.(png|jpe?g|webp|gif|bmp|svg|avif)$/i;

/**
 * Resizes and center-crops an uploaded image File into a crisp 256x256 JPEG
 * data URL suitable for localStorage persistence.
 */
export function resizeAvatarFileToDataUrl(
  file: File,
  outputSize = 256
): Promise<string> {
  return new Promise((resolve, reject) => {
    const isImageMime = file.type.startsWith('image/');
    const isImageExt = IMAGE_EXTENSION_RE.test(file.name || '');

    if (!isImageMime && !isImageExt) {
      reject(
        new Error('Please select a valid image file (PNG, JPG, WebP, or GIF).')
      );
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      reject(new Error('Please choose an image smaller than 10 MB.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () =>
      reject(new Error('Could not read the selected image.'));
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!dataUrl) {
        reject(new Error('Selected image could not be decoded.'));
        return;
      }

      const img = new Image();
      img.onerror = () => reject(new Error('Unsupported image format.'));
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = outputSize;
          canvas.height = outputSize;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(dataUrl);
            return;
          }

          const srcWidth = img.naturalWidth || img.width;
          const srcHeight = img.naturalHeight || img.height;
          const minSide = Math.min(srcWidth, srcHeight);
          const sx = Math.max(0, Math.floor((srcWidth - minSide) / 2));
          const sy = Math.max(0, Math.floor((srcHeight - minSide) / 2));

          ctx.fillStyle = '#FFFDF8';
          ctx.fillRect(0, 0, outputSize, outputSize);
          ctx.drawImage(
            img,
            sx,
            sy,
            minSide,
            minSide,
            0,
            0,
            outputSize,
            outputSize
          );

          resolve(canvas.toDataURL('image/jpeg', 0.86));
        } catch {
          reject(new Error('Failed to process the uploaded image.'));
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Validates that a pasted URL or relative path resolves to a loadable image.
 */
export function validateImageUrl(rawUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const trimmed = rawUrl.trim();
    if (!trimmed) {
      reject(new Error('Enter an image URL first.'));
      return;
    }

    const isAllowedScheme =
      /^https?:\/\//i.test(trimmed) ||
      trimmed.startsWith('/') ||
      trimmed.startsWith('data:image/');

    if (!isAllowedScheme) {
      reject(
        new Error(
          'Image URL must start with https://, http://, /, or data:image/.'
        )
      );
      return;
    }

    let settled = false;
    const img = new Image();
    img.referrerPolicy = 'no-referrer';

    const timeoutId = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error('Image timed out while loading. Try another image link.'));
    }, 8000);

    img.onload = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      resolve(trimmed);
    };

    img.onerror = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      reject(
        new Error(
          'Could not load an image from that URL. Check the link and try again.'
        )
      );
    };

    img.src = trimmed;
  });
}
