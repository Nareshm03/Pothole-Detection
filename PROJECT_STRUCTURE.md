# Pothole Detection Project Structure

## Core Application Files
- `app.py` - Main Flask application server
- `model_manager.py` - YOLOv8 model management
- `requirements.txt` - Python dependencies
- `pothole.yaml` - Model configuration
- `run.bat` - Windows startup script

## Web Pages
- `index.html` - Homepage
- `detection.html` - Detection interface
- `municipality.html` - Municipality dashboard
- `analytics.html` - Analytics dashboard

## Assets
### CSS (`css/`)
- `unified-vintage.css` - Main theme styles
- `ui-enhancements.css` - UI components
- `dark-mode.css` - Dark mode support
- `animations.css` - Animation effects
- `polish.css` - Visual polish
- `hero-enhanced.css` - Hero section styles
- `micro-interactions.css` - Interactive elements
- `detection-vintage.css` - Detection page styles
- `municipality-vintage.css` - Municipality page styles
- `analytics-vintage.css` - Analytics page styles
- `pages-enhanced.css` - Page-specific enhancements
- `detection-results.css` - Detection results display

### JavaScript (`js/`)
- `dark-mode.js` - Dark mode toggle
- `ui-components.js` - UI component logic
- `scroll-effects.js` - Scroll animations
- `micro-interactions.js` - Interactive effects
- `detection.js` - Detection page logic
- `municipality.js` - Municipality dashboard logic
- `analytics.js` - Analytics dashboard logic

### Images (`images/`)
- `smoothtrack-vintage-logo.png` - Main logo
- Various SVG graphics for UI elements

## Data & Models
- `models/pothole_best.pt` - Trained pothole detection model
- `yolov8n.pt` - Base YOLOv8 model
- `data/` - Training dataset
- `dataset/` - Processed dataset
- `dataset_aug/` - Augmented dataset

## Directories
- `reports/` - Generated reports
- `static/` - Static assets
- `uploads/` - User uploaded files
