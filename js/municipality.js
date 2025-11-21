// Municipality Dashboard Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Load all reports from localStorage
    loadReports();
    
    // Initialize summary stats
    updateSummaryStats();
    
    // Filter reports
    const reportFilter = document.getElementById('reportFilter');
    if (reportFilter) {
        reportFilter.addEventListener('change', function() {
            filterReports(this.value);
        });
    }
    
    // Add event listener for status change buttons
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('status-btn')) {
            changeReportStatus(e.target);
        }
    });

    // Initialize map (placeholder for demo)
    initMap();
});

// Load all reports from localStorage
function loadReports() {
    const reportsList = document.getElementById('reportsList');
    if (!reportsList) return;
    
    // Clear existing reports
    reportsList.innerHTML = '';
    
    // Get reports from localStorage
    const reports = JSON.parse(localStorage.getItem('potholeReports')) || [];
    
    if (reports.length === 0) {
        reportsList.innerHTML = '<div class="no-reports">No pothole reports found</div>';
        return;
    }
    
    // Sort reports by date (newest first)
    reports.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Add each report to the list
    reports.forEach(report => {
        addReportToList(report);
    });
}

// Add a report to the list
function addReportToList(report) {
    const reportsList = document.getElementById('reportsList');
    if (!reportsList) return;

    // Create new report element
    const reportItem = document.createElement('div');
    reportItem.className = 'report-item';
    reportItem.dataset.id = report.id;
    
    // Determine severity class
    const severityClass = report.highSeverityCount > 0 ? 'high-severity' : 
                          (report.potholesCount > 2 ? 'medium-severity' : 'low-severity');
    reportItem.classList.add(severityClass);
    
    // Format date
    const reportDate = new Date(report.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Get location string
    const location = report.location ? 
        `${report.location.latitude.toFixed(4)}, ${report.location.longitude.toFixed(4)}` : 
        'Location unavailable';

    // Set report content
    reportItem.innerHTML = `
        <div class="report-image">
            <img src="${report.image}" alt="Reported Pothole">
        </div>
        <div class="report-details">
            <h4>Pothole Report #${report.id.substring(7, 13)}</h4>
            <p>Reported: ${reportDate}</p>
            <p>Location: ${location}</p>
            <p>Potholes: ${report.potholesCount} (${report.highSeverityCount} high severity)</p>
            <span class="severity-badge ${report.highSeverityCount > 0 ? 'high' : 'medium'}">
                ${report.avgConfidence} Confidence
            </span>
        </div>
        <div class="report-status ${report.status}">
            <span>${report.status.charAt(0).toUpperCase() + report.status.slice(1)}</span>
            <div class="status-actions">
                <button class="status-btn pending-btn" data-status="pending">Pending</button>
                <button class="status-btn progress-btn" data-status="in-progress">In Progress</button>
                <button class="status-btn completed-btn" data-status="completed">Completed</button>
            </div>
        </div>
    `;

    // Add to the list
    reportsList.appendChild(reportItem);
}

// Filter reports by status
function filterReports(status) {
    const reportItems = document.querySelectorAll('.report-item');
    
    reportItems.forEach(item => {
        if (status === 'all') {
            item.style.display = 'flex';
            return;
        }
        
        const itemStatus = item.querySelector('.report-status').className.split(' ')[1];
        if (itemStatus === status) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// Change report status
function changeReportStatus(button) {
    const newStatus = button.dataset.status;
    const reportItem = button.closest('.report-item');
    const reportId = reportItem.dataset.id;
    
    // Update status in DOM
    const statusElement = reportItem.querySelector('.report-status');
    statusElement.className = `report-status ${newStatus}`;
    statusElement.querySelector('span').textContent = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
    
    // Update status in localStorage
    const reports = JSON.parse(localStorage.getItem('potholeReports')) || [];
    const reportIndex = reports.findIndex(r => r.id === reportId);
    
    if (reportIndex !== -1) {
        reports[reportIndex].status = newStatus;
        localStorage.setItem('potholeReports', JSON.stringify(reports));
    }
    
    // Update summary stats
    updateSummaryStats();
}

// Update summary statistics
function updateSummaryStats() {
    const reports = JSON.parse(localStorage.getItem('potholeReports')) || [];
    const statValues = document.querySelectorAll('.stat-value');
    
    if (statValues.length >= 4) {
        // Count reports by status
        const totalReports = reports.length;
        const pendingReports = reports.filter(r => r.status === 'pending').length;
        const inProgressReports = reports.filter(r => r.status === 'in-progress').length;
        const completedReports = reports.filter(r => r.status === 'completed').length;
        
        // Update stats display
        statValues[0].textContent = totalReports;
        statValues[1].textContent = pendingReports;
        statValues[2].textContent = inProgressReports;
        statValues[3].textContent = completedReports;
    }
}

// Initialize map
function initMap() {
    const canvas = document.getElementById('mapCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const reports = JSON.parse(localStorage.getItem('potholeReports')) || [];
    
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
    ctx.fillStyle = '#f5f1e8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = '#d4c5a9';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += 50) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
    }
    
    if (reports.length === 0) {
        ctx.fillStyle = '#666';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('No pothole reports to display', canvas.width / 2, canvas.height / 2);
        return;
    }
    
    const lats = reports.map(r => r.location?.latitude || 40.7128);
    const lngs = reports.map(r => r.location?.longitude || -74.0060);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    
    reports.forEach((report, idx) => {
        const lat = report.location?.latitude || 40.7128;
        const lng = report.location?.longitude || -74.0060;
        
        const x = ((lng - minLng) / (maxLng - minLng || 1)) * (canvas.width - 60) + 30;
        const y = ((maxLat - lat) / (maxLat - minLat || 1)) * (canvas.height - 60) + 30;
        
        const colors = { 'pending': '#e74c3c', 'in-progress': '#f39c12', 'completed': '#27ae60' };
        const color = colors[report.status] || '#3498db';
        
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.fillStyle = '#333';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`#${idx + 1}`, x, y - 12);
    });
    
    const legendX = 10;
    const legendY = canvas.height - 60;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(legendX, legendY, 150, 50);
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 2;
    ctx.strokeRect(legendX, legendY, 150, 50);
    
    const legendItems = [
        { color: '#e74c3c', label: 'Pending' },
        { color: '#f39c12', label: 'In Progress' },
        { color: '#27ae60', label: 'Completed' }
    ];
    
    legendItems.forEach((item, i) => {
        ctx.fillStyle = item.color;
        ctx.beginPath();
        ctx.arc(legendX + 15, legendY + 15 + i * 15, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#333';
        ctx.font = '11px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(item.label, legendX + 25, legendY + 19 + i * 15);
    });
}