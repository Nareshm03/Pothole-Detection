// Detection functionality
let currentDetections = [];
let gpsLocation = null;

// Get GPS location
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        (position) => {
            gpsLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
        },
        (error) => console.log('GPS error:', error)
    );
}

document.addEventListener('DOMContentLoaded', function() {
    const uploadArea = document.getElementById('uploadArea');
    const imageInput = document.getElementById('imageInput');
    const resultCanvas = document.getElementById('resultCanvas');
    const detectionResults = document.getElementById('detectionResults');
    const actionButtons = document.getElementById('actionButtons');

    // File input change
    imageInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (file.type.startsWith('image/')) {
            handleImageUpload(file);
        } else if (file.type.startsWith('video/')) {
            handleVideoUpload(file);
        }
    });

    // Handle image upload
    function handleImageUpload(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            displayImage(e.target.result);
            processImage(e.target.result);
        };
        reader.readAsDataURL(file);
    }

    // Handle video upload
    function handleVideoUpload(file) {
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        video.src = URL.createObjectURL(file);
        video.onloadedmetadata = function() {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            video.currentTime = 0;
            video.onseeked = function() {
                ctx.drawImage(video, 0, 0);
                const imageData = canvas.toDataURL('image/jpeg');
                displayImage(imageData);
                processImage(imageData);
            };
        };
    }

    // Display image
    function displayImage(imageSrc) {
        const img = new Image();
        img.onload = function() {
            const canvas = resultCanvas;
            const ctx = canvas.getContext('2d');
            
            const maxWidth = 800;
            const maxHeight = 600;
            let width = img.width;
            let height = img.height;
            
            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }
            if (height > maxHeight) {
                width = (width * maxHeight) / height;
                height = maxHeight;
            }
            
            canvas.width = width;
            canvas.height = height;
            canvas.dataset.originalWidth = img.width;
            canvas.dataset.originalHeight = img.height;
            
            ctx.drawImage(img, 0, 0, width, height);
        };
        img.src = imageSrc;
    }

    // Process image
    function processImage(imageSrc) {
        // Show loading animation
        const resultSection = document.querySelector('.results-section');
        resultSection.style.position = 'relative';
        
        const processingOverlay = document.createElement('div');
        processingOverlay.className = 'processing-overlay';
        processingOverlay.innerHTML = `
            <div class="loading-spinner"></div>
            <p>Analyzing image for potholes...</p>
        `;
        resultSection.appendChild(processingOverlay);
        // Original loading function is still called for compatibility
        showLoading();
        
        // Function to remove loading overlay
        function removeLoadingOverlay() {
            const overlay = document.querySelector('.processing-overlay');
            if (overlay) {
                overlay.classList.add('animate-fadeIn');
                setTimeout(() => {
                    overlay.remove();
                }, 300);
            }
        }
        
        fetch(`${window.API_BASE_URL}/detect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: imageSrc })
        })
        .then(response => response.json())
        .then(data => {
            console.log('DEBUG: Received data:', data);
            console.log('DEBUG: Detections:', data.detections);
            
            if (data.error) throw new Error(data.error);
            
            currentDetections = data.detections;
            
            // Save to localStorage for analytics
            const history = JSON.parse(localStorage.getItem('detectionHistory')) || [];
            history.push({
                timestamp: new Date().toISOString(),
                count: data.detections.length,
                detections: data.detections
            });
            localStorage.setItem('detectionHistory', JSON.stringify(history));
            
            displayResults(data.detections);
            drawDetectionBoxes(data.detections);
            actionButtons.style.display = 'flex';
            removeLoadingOverlay();
        })
        .catch(error => {
            console.error('Detection error:', error);
            alert('Error: ' + error.message);
            removeLoadingOverlay();
        });
    }

    // Show loading
    function showLoading() {
        const resultsContent = detectionResults.querySelector('.results-content');
        resultsContent.innerHTML = '<p>Analyzing...</p>';
    }

    // Display results
    function displayResults(results) {
        const resultsContent = detectionResults.querySelector('.results-content');
        const accuracyMetrics = document.getElementById('accuracyMetrics');
        
        if (results.length === 0) {
            resultsContent.innerHTML = '<p>No potholes detected</p>';
            accuracyMetrics.style.display = 'none';
            return;
        }
        
        // Calculate metrics
        let totalConfidence = 0;
        let severityCounts = { critical: 0, high: 0, medium: 0, low: 0 };
        
        results.forEach(det => {
            totalConfidence += det.confidence;
            const severity = det.severity || determineSeverity(det.confidence);
            severityCounts[severity] = (severityCounts[severity] || 0) + 1;
        });
        
        const avgConfidence = results.length > 0 ? totalConfidence / results.length : 0;
        
        // Update metrics display
        document.getElementById('avgConfidence').textContent = `${(avgConfidence * 100).toFixed(1)}%`;
        document.getElementById('potholesFound').textContent = results.length;
        document.getElementById('highSeverity').textContent = severityCounts.critical + severityCounts.high;
        
        // Show metrics section
        accuracyMetrics.style.display = 'block';
        
        // Update results list with legend
        let html = `
            <div class="bbox-legend">
                <div class="legend-item"><div class="legend-color critical"></div><span>Critical</span></div>
                <div class="legend-item"><div class="legend-color high"></div><span>High</span></div>
                <div class="legend-item"><div class="legend-color medium"></div><span>Medium</span></div>
                <div class="legend-item"><div class="legend-color low"></div><span>Low</span></div>
            </div>
            <p><strong>${results.length} pothole(s) detected</strong></p>
            <button onclick="generateHeatmap()" class="btn gold-glow" style="margin: 1rem 0;">Generate Heatmap</button>
        `;
        
        results.forEach((det, idx) => {
            const severity = det.severity || determineSeverity(det.confidence);
            const confPercent = (det.confidence * 100).toFixed(1);
            
            html += `
                <div class="detection-item severity-${severity}" style="animation-delay: ${idx * 0.1}s">
                    <strong>Pothole #${idx + 1}</strong>
                    <div class="confidence-bar">
                        <div class="confidence-fill" style="width: ${confPercent}%"></div>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem;">
                        <span>Confidence: <strong>${confPercent}%</strong></span>
                        <span class="severity-badge severity-${severity}">${severity}</span>
                    </div>
                    ${det.area ? `<div style="margin-top: 0.5rem; font-size: 0.875rem; color: #666;">Area: ${det.area} px²</div>` : ''}
                </div>
            `;
        });
        
        resultsContent.innerHTML = html;
    }
    
    function determineSeverity(confidence) {
        if (confidence > 0.85) return 'critical';
        if (confidence > 0.7) return 'high';
        if (confidence > 0.5) return 'medium';
        return 'low';
    }

    // Draw detection boxes with enhanced visualization
    function drawDetectionBoxes(results) {
        const canvas = resultCanvas;
        const ctx = canvas.getContext('2d');
        
        const scaleX = canvas.width / canvas.dataset.originalWidth;
        const scaleY = canvas.height / canvas.dataset.originalHeight;
        
        // Clear canvas first to redraw the image
        const img = new Image();
        img.onload = function() {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            // Calculate average confidence
            let totalConfidence = 0;
            results.forEach(det => totalConfidence += det.confidence);
            const avgConfidence = results.length > 0 ? totalConfidence / results.length : 0;
            
            // Draw each detection box
            results.forEach((det, idx) => {
                const [x, y, w, h] = det.bbox;
                const sx = x * scaleX;
                const sy = y * scaleY;
                const sw = w * scaleX;
                const sh = h * scaleY;
                
                // Get severity and color
                const severity = det.severity || determineSeverity(det.confidence);
                const colors = {
                    critical: '#e74c3c',
                    high: '#e67e22',
                    medium: '#f39c12',
                    low: '#f1c40f'
                };
                const color = colors[severity];
                
                // Draw pulsing glow
                ctx.shadowBlur = 15;
                ctx.shadowColor = color;
                
                // Draw semi-transparent fill
                ctx.fillStyle = color + '22';
                ctx.fillRect(sx, sy, sw, sh);
                
                // Draw double border
                ctx.strokeStyle = color;
                ctx.lineWidth = 4;
                ctx.strokeRect(sx, sy, sw, sh);
                ctx.lineWidth = 2;
                ctx.strokeStyle = '#fff';
                ctx.strokeRect(sx + 2, sy + 2, sw - 4, sh - 4);
                
                ctx.shadowBlur = 0;
                
                // Draw label background
                const labelHeight = 35;
                const gradient = ctx.createLinearGradient(sx, sy - labelHeight, sx, sy);
                gradient.addColorStop(0, color);
                gradient.addColorStop(1, color + 'dd');
                ctx.fillStyle = gradient;
                ctx.fillRect(sx, sy - labelHeight, Math.max(sw, 120), labelHeight);
                
                // Draw label text
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 13px Arial';
                ctx.fillText(`#${idx + 1} ${severity.toUpperCase()}`, sx + 8, sy - 20);
                ctx.font = '11px Arial';
                ctx.fillText(`${(det.confidence * 100).toFixed(1)}% confidence`, sx + 8, sy - 6);
                
                // Draw corner markers
                const markerSize = 12;
                ctx.fillStyle = color;
                // Top-left
                ctx.fillRect(sx - 2, sy - 2, markerSize, 3);
                ctx.fillRect(sx - 2, sy - 2, 3, markerSize);
                // Top-right
                ctx.fillRect(sx + sw - markerSize + 2, sy - 2, markerSize, 3);
                ctx.fillRect(sx + sw - 1, sy - 2, 3, markerSize);
                // Bottom-left
                ctx.fillRect(sx - 2, sy + sh - 1, markerSize, 3);
                ctx.fillRect(sx - 2, sy + sh - markerSize + 2, 3, markerSize);
                // Bottom-right
                ctx.fillRect(sx + sw - markerSize + 2, sy + sh - 1, markerSize, 3);
                ctx.fillRect(sx + sw - 1, sy + sh - markerSize + 2, 3, markerSize);
            });
            
            // Draw info panel
            if (results.length > 0) {
                const panelWidth = 200;
                const panelHeight = 80;
                const panelX = canvas.width - panelWidth - 15;
                const panelY = 15;
                
                // Panel background
                ctx.fillStyle = 'rgba(10, 17, 40, 0.85)';
                ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
                ctx.strokeStyle = '#D4AF37';
                ctx.lineWidth = 2;
                ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
                
                // Panel content
                ctx.fillStyle = '#f5f5f5';
                ctx.font = 'bold 14px Arial';
                ctx.fillText('Detection Summary', panelX + 10, panelY + 20);
                ctx.font = '12px Arial';
                ctx.fillText(`Total: ${results.length} potholes`, panelX + 10, panelY + 40);
                ctx.fillText(`Avg Confidence: ${(avgConfidence * 100).toFixed(1)}%`, panelX + 10, panelY + 58);
                
                // Confidence bar
                const barWidth = 180;
                const barX = panelX + 10;
                const barY = panelY + 65;
                ctx.fillStyle = 'rgba(212, 175, 55, 0.3)';
                ctx.fillRect(barX, barY, barWidth, 6);
                const barGradient = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
                barGradient.addColorStop(0, '#f5bf2b');
                barGradient.addColorStop(1, '#d08f1b');
                ctx.fillStyle = barGradient;
                ctx.fillRect(barX, barY, barWidth * avgConfidence, 6);
            }
        };
        img.src = canvas.toDataURL();
    }
});

// Export results
function exportResults(format) {
    const data = {
        detections: currentDetections,
        gps: gpsLocation,
        format: format
    };
    
    fetch(`${window.API_BASE_URL}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (format === 'json') {
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'pothole-detection.json';
            a.click();
        } else if (format === 'excel') {
            // Convert to CSV for Excel
            const csv = convertToCSV(data);
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'pothole-detection.csv';
            a.click();
        }
    });
}

// Convert to CSV
function convertToCSV(data) {
    const header = 'Timestamp,Latitude,Longitude,Class,Confidence,Severity\n';
    const rows = data.detections.map(d => 
        `${data.timestamp},${data.location.latitude},${data.location.longitude},${d.class},${d.confidence},${d.severity || 'N/A'}`
    ).join('\n');
    return header + rows;
}

// Report to municipality
function reportToMunicipality() {
    if (currentDetections.length === 0) {
        alert('No potholes to report');
        return;
    }
    
    // Get current date and time
    const now = new Date();
    const reportDate = now.toISOString();
    
    // Create report data
    const reportData = {
        id: 'report_' + Date.now(),
        date: reportDate,
        location: gpsLocation || { latitude: 40.7128, longitude: -74.0060 }, // Default to NYC if no GPS
        detections: currentDetections,
        status: 'pending',
        avgConfidence: document.getElementById('avgConfidence').textContent,
        potholesCount: parseInt(document.getElementById('potholesFound').textContent),
        highSeverityCount: parseInt(document.getElementById('highSeverity').textContent),
        image: resultCanvas.toDataURL('image/jpeg', 0.7) // Compressed image
    };
    
    // Store in localStorage
    let reports = JSON.parse(localStorage.getItem('potholeReports')) || [];
    reports.push(reportData);
    localStorage.setItem('potholeReports', JSON.stringify(reports));
    
    // Redirect to municipality page
    window.location.href = 'municipality.html';
}

// Generate heatmap
function generateHeatmap() {
    if (currentDetections.length === 0) {
        alert('No detections available for heatmap');
        return;
    }
    
    const canvas = document.getElementById('resultCanvas');
    const ctx = canvas.getContext('2d');
    
    // Store original image
    if (!canvas.originalImageData) {
        canvas.originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }
    
    const data = {
        detections: currentDetections,
        width: parseInt(canvas.dataset.originalWidth) || canvas.width,
        height: parseInt(canvas.dataset.originalHeight) || canvas.height
    };
    
    fetch(`${window.API_BASE_URL}/generate_heatmap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) throw new Error(data.error);
        
        // Create heatmap overlay
        const heatmapImg = new Image();
        heatmapImg.onload = function() {
            ctx.putImageData(canvas.originalImageData, 0, 0);
            ctx.globalCompositeOperation = 'multiply';
            ctx.globalAlpha = 0.7;
            ctx.drawImage(heatmapImg, 0, 0, canvas.width, canvas.height);
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 1.0;
            
            addHeatmapControls(data.stats);
        };
        heatmapImg.src = data.heatmap;
    })
    .catch(error => {
        console.error('Heatmap error:', error);
        alert('Error generating heatmap: ' + error.message);
    });
}

function addHeatmapControls(stats) {
    const controlsHTML = `
        <div class="heatmap-controls">
            <div class="heatmap-stats">
                <h4>Analysis</h4>
                <div class="stats-grid">
                    <span class="stat high">High: ${stats.high_severity}</span>
                    <span class="stat medium">Med: ${stats.medium_severity}</span>
                    <span class="stat low">Low: ${stats.low_severity}</span>
                    <span class="stat avg">Avg: ${(stats.avg_confidence * 100).toFixed(1)}%</span>
                </div>
            </div>
            <button onclick="resetToOriginal()" class="reset-btn">Reset View</button>
        </div>
    `;
    
    document.querySelector('.results-content').insertAdjacentHTML('beforeend', controlsHTML);
}

function resetToOriginal() {
    const canvas = document.getElementById('resultCanvas');
    const ctx = canvas.getContext('2d');
    
    if (canvas.originalImageData) {
        ctx.putImageData(canvas.originalImageData, 0, 0);
        drawDetectionBoxes(currentDetections);
    }
    
    const controls = document.querySelector('.heatmap-controls');
    if (controls) controls.remove();
}

// Reset detection
function resetDetection() {
    document.getElementById('imageInput').value = '';
    const canvas = document.getElementById('resultCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.originalImageData = null;
    
    const resultsContent = document.querySelector('.results-content');
    resultsContent.innerHTML = '<p>Upload an image to see detection results</p>';
    
    document.getElementById('actionButtons').style.display = 'none';
    currentDetections = [];
}
