/**
 * Client-side file upload validation and handling
 */

class UploadValidator {
    constructor() {
        this.maxSize = 250 * 1024 * 1024; // 250MB
        this.allowedTypes = ['image/jpeg', 'image/png', 'image/bmp', 'image/tiff', 'video/mp4', 'video/quicktime'];
        this.allowedExtensions = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif', '.mp4', '.mov'];
        this.loadConfig();
    }

    async loadConfig() {
        try {
            const response = await fetch('/upload/config');
            const config = await response.json();
            this.maxSize = config.max_size;
            this.allowedTypes = config.allowed_types;
            this.allowedExtensions = config.allowed_extensions;
        } catch (e) {
            console.warn('Failed to load upload config, using defaults');
        }
    }

    validate(file) {
        // Check file exists
        if (!file) {
            return { valid: false, error: 'No file selected' };
        }

        // Check size
        if (file.size > this.maxSize) {
            const sizeMB = (file.size / 1024 / 1024).toFixed(1);
            const maxMB = (this.maxSize / 1024 / 1024).toFixed(0);
            return { valid: false, error: `File too large (${sizeMB}MB > ${maxMB}MB)` };
        }

        if (file.size === 0) {
            return { valid: false, error: 'Empty file' };
        }

        // Check MIME type
        if (!this.allowedTypes.includes(file.type)) {
            return { valid: false, error: `Invalid file type: ${file.type}` };
        }

        // Check extension
        const ext = '.' + file.name.split('.').pop().toLowerCase();
        if (!this.allowedExtensions.includes(ext)) {
            return { valid: false, error: `Invalid extension: ${ext}` };
        }

        return { valid: true };
    }

    async upload(file, onProgress) {
        // Client-side validation
        const validation = this.validate(file);
        if (!validation.valid) {
            throw new Error(validation.error);
        }

        // Create form data
        const formData = new FormData();
        formData.append('file', file);

        // Upload with progress
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable && onProgress) {
                    const percent = (e.loaded / e.total) * 100;
                    onProgress(percent);
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status === 200) {
                    resolve(JSON.parse(xhr.responseText));
                } else {
                    const error = JSON.parse(xhr.responseText);
                    reject(new Error(error.error || 'Upload failed'));
                }
            });

            xhr.addEventListener('error', () => reject(new Error('Network error')));
            xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));

            xhr.open('POST', '/upload');
            xhr.send(formData);
        });
    }
}

// Example usage
async function handleFileUpload(fileInput) {
    const validator = new UploadValidator();
    const file = fileInput.files[0];

    try {
        // Validate
        const validation = validator.validate(file);
        if (!validation.valid) {
            alert(validation.error);
            return;
        }

        // Upload with progress
        console.log('Uploading...');
        const result = await validator.upload(file, (percent) => {
            console.log(`Progress: ${percent.toFixed(1)}%`);
        });

        console.log('Upload successful:', result);
        return result;

    } catch (error) {
        console.error('Upload error:', error.message);
        alert(`Upload failed: ${error.message}`);
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UploadValidator, handleFileUpload };
}
