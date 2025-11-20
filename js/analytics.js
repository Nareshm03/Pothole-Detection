// Analytics Dashboard Functionality
document.addEventListener('DOMContentLoaded', function() {
    loadAnalytics();
    
    // Handle date range changes
    const dateRange = document.getElementById('dateRange');
    if (dateRange) {
        dateRange.addEventListener('change', function() {
            loadAnalytics();
        });
    }
});

function loadAnalytics() {
    const detections = JSON.parse(localStorage.getItem('detectionHistory')) || [];
    
    if (detections.length === 0) {
        document.getElementById('totalPotholes').textContent = '0';
        document.getElementById('totalDetections').textContent = '0';
        document.getElementById('highSeverityCount').textContent = '0';
        document.getElementById('avgConfidence').textContent = '0%';
        initTrendChart([]);
        initSeverityChart([0, 0, 0]);
        return;
    }
    
    let totalPotholes = 0;
    let highSeverity = 0;
    let mediumSeverity = 0;
    let lowSeverity = 0;
    let totalConfidence = 0;
    
    detections.forEach(d => {
        totalPotholes += d.count;
        d.detections.forEach(det => {
            totalConfidence += det.confidence;
            if (det.severity === 'high') highSeverity++;
            else if (det.severity === 'medium') mediumSeverity++;
            else lowSeverity++;
        });
    });
    
    const avgConf = totalPotholes > 0 ? (totalConfidence / totalPotholes * 100).toFixed(1) : 0;
    
    document.getElementById('totalPotholes').textContent = totalPotholes;
    document.getElementById('totalDetections').textContent = detections.length;
    document.getElementById('highSeverityCount').textContent = highSeverity;
    document.getElementById('avgConfidence').textContent = avgConf + '%';
    
    document.getElementById('totalScans').textContent = detections.length;
    document.getElementById('successfulDetections').textContent = detections.filter(d => d.count > 0).length;
    document.getElementById('highSevCount').textContent = highSeverity;
    document.getElementById('mediumSevCount').textContent = mediumSeverity;
    
    const maxScans = Math.max(detections.length, 10);
    document.getElementById('totalScansBar').style.width = (detections.length / maxScans * 100) + '%';
    document.getElementById('successfulBar').style.width = (detections.filter(d => d.count > 0).length / maxScans * 100) + '%';
    document.getElementById('highSevBar').style.width = (highSeverity / totalPotholes * 100) + '%';
    document.getElementById('mediumSevBar').style.width = (mediumSeverity / totalPotholes * 100) + '%';
    
    initTrendChart(detections);
    initSeverityChart([highSeverity, mediumSeverity, lowSeverity]);
}

function initTrendChart(detections) {
    const ctx = document.getElementById('trendChart').getContext('2d');
    
    const labels = detections.slice(-10).map((d, i) => `Scan ${i + 1}`);
    const data = detections.slice(-10).map(d => d.count);
    
    if (window.trendChart) window.trendChart.destroy();
    
    window.trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels.length > 0 ? labels : ['No Data'],
            datasets: [{
                label: 'Potholes Detected',
                data: data.length > 0 ? data : [0],
                borderColor: '#D4AF37',
                backgroundColor: 'rgba(212, 175, 55, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' },
                tooltip: { mode: 'index', intersect: false }
            },
            scales: {
                y: { beginAtZero: true, grid: { drawBorder: false } },
                x: { grid: { display: false } }
            }
        }
    });
}

function initSeverityChart(data) {
    const ctx = document.getElementById('severityChart').getContext('2d');
    
    if (window.severityChart) window.severityChart.destroy();
    
    window.severityChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['High Severity', 'Medium Severity', 'Low Severity'],
            datasets: [{
                data: data.every(d => d === 0) ? [1, 1, 1] : data,
                backgroundColor: ['#e74c3c', '#f39c12', '#3498db'],
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } },
            cutout: '65%'
        }
    });
}

function saveDetection(detections) {
    const history = JSON.parse(localStorage.getItem('detectionHistory')) || [];
    history.push({
        timestamp: new Date().toISOString(),
        count: detections.length,
        detections: detections
    });
    localStorage.setItem('detectionHistory', JSON.stringify(history));
}

function updateCharts(range) {
    const reports = JSON.parse(localStorage.getItem('potholeReports')) || [];
    if (reports.length === 0) {
        return;
    }
    
    // Filter reports based on date range
    const now = new Date();
    let startDate;
    
    if (range === 'week') {
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
    } else if (range === 'month') {
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
    } else if (range === 'quarter') {
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 3);
    } else if (range === 'year') {
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
    }
    
    const filteredReports = reports.filter(report => {
        const reportDate = new Date(report.date);
        return reportDate >= startDate;
    });
    
    // Process real data
    const realData = processReportsData(filteredReports, range);
    
    // Update charts with real data
    updateChartsWithData(realData, range);
}

// Process reports data into chart format
function processReportsData(reports, range) {
    let trendDetected = [];
    let trendRepaired = [];
    let severityData = [0, 0, 0]; // High, Medium, Low
    
    // Process severity data
    reports.forEach(report => {
        // Add high severity count
        severityData[0] += report.highSeverityCount || 0;
        
        // Estimate medium and low severity
        const remaining = report.potholesCount - (report.highSeverityCount || 0);
        const mediumCount = Math.round(remaining * 0.6);
        const lowCount = remaining - mediumCount;
        
        severityData[1] += mediumCount;
        severityData[2] += lowCount;
    });
    
    // Process trend data based on range
    if (range === 'week') {
        // Daily data for a week
        for (let i = 6; i >= 0; i--) {
            const dayStart = new Date();
            dayStart.setDate(dayStart.getDate() - i);
            dayStart.setHours(0, 0, 0, 0);
            
            const dayEnd = new Date(dayStart);
            dayEnd.setDate(dayStart.getDate() + 1);
            
            const dayReports = reports.filter(r => {
                const date = new Date(r.date);
                return date >= dayStart && date < dayEnd;
            });
            
            const detected = dayReports.reduce((sum, r) => sum + r.potholesCount, 0);
            const repaired = dayReports.filter(r => r.status === 'completed').length;
            
            trendDetected.push(detected);
            trendRepaired.push(repaired);
        }
    } else {
        // Monthly data
        const monthlyDetected = Array(12).fill(0);
        const monthlyRepaired = Array(12).fill(0);
        
        reports.forEach(report => {
            const date = new Date(report.date);
            const month = date.getMonth();
            monthlyDetected[month] += report.potholesCount || 0;
            if (report.status === 'completed') {
                monthlyRepaired[month]++;
            }
        });
        
        trendDetected = monthlyDetected;
        trendRepaired = monthlyRepaired;
    }
    
    return {
        trend: {
            detected: trendDetected,
            repaired: trendRepaired
        },
        severity: severityData
    };
}

// Update charts with data
function updateChartsWithData(data, range) {
    // Update trend chart
    const trendChart = Chart.getChart('trendChart');
    if (trendChart) {
        // Set appropriate labels based on range
        let labels;
        if (range === 'week') {
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            labels = Array.from({length: 7}, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - 6 + i);
                return days[d.getDay()];
            });
        } else {
            labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        }
        
        trendChart.data.labels = labels;
        trendChart.data.datasets[0].data = data.trend.detected;
        trendChart.data.datasets[1].data = data.trend.repaired;
        trendChart.update();
    }
    
    // Update severity chart
    const severityChart = Chart.getChart('severityChart');
    if (severityChart) {
        severityChart.data.datasets[0].data = data.severity;
        severityChart.update();
    }
    
    // Update overview stats
    const overviewStats = document.querySelectorAll('.overview-stat-value');
    if (overviewStats.length >= 4) {
        const totalDetected = data.trend.detected.reduce((a, b) => a + b, 0);
        const totalRepaired = data.trend.repaired.reduce((a, b) => a + b, 0);
        const highSeverity = data.severity[0];
        const repairRate = totalDetected > 0 ? Math.round((totalRepaired / totalDetected) * 100) : 0;
        
        overviewStats[0].textContent = totalDetected;
        overviewStats[1].textContent = totalRepaired;
        overviewStats[2].textContent = highSeverity;
        overviewStats[3].textContent = `${repairRate}%`;
    }
}