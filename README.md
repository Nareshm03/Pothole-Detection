# Pothole Detection System

An AI-powered pothole detection system using YOLOv8 with a modern web interface for real-time detection, analysis, and reporting.

![Pothole Detection Demo](images/smoothtrack-vintage-logo.png)

## Features

- **Real-time Detection**: Upload images or use webcam for live pothole detection
- **AI-Powered**: Uses YOLOv8 object detection model trained specifically for potholes
- **Web Interface**: Modern, responsive web application with dark mode support
- **Analytics Dashboard**: Comprehensive analytics and reporting tools
- **Municipality Dashboard**: Specialized interface for municipal road management
- **Export Capabilities**: Export detection results and generate heatmaps
- **Multi-format Support**: Supports various image formats and video streams

## Quick Start

### Prerequisites

- Python 3.8 or higher
- Webcam (optional, for live detection)
- GPU with CUDA support (optional, for faster inference)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd pothole
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application**
   ```bash
   python app.py
   ```
   Or on Windows:
   ```bash
   run.bat
   ```

4. **Open your browser**
   Navigate to `http://localhost:5000`

## Usage

### Image Detection
1. Go to the Detection page
2. Upload an image or use your webcam
3. View detection results with confidence scores
4. Export results or generate heatmaps

### Municipality Dashboard
- Access comprehensive road condition analytics
- View detection statistics and trends
- Generate reports for road maintenance planning

### Analytics
- Monitor detection patterns over time
- Analyze pothole severity distributions
- Export data for further analysis

## Project Structure

```
pothole/
├── app.py                 # Main Flask application
├── model_manager.py       # YOLOv8 model management
├── requirements.txt       # Python dependencies
├── models/
│   └── pothole_best.pt   # Trained pothole detection model
├── css/                  # Stylesheets
├── js/                   # JavaScript files
├── images/               # UI assets and logos
├── data/                 # Training datasets
├── *.html               # Web pages
└── static/              # Static assets
```

## Model Information

- **Architecture**: YOLOv8 (You Only Look Once)
- **Training Data**: Custom pothole dataset with augmentation
- **Input Size**: 640x640 pixels
- **Classes**: Pothole detection with severity classification
- **Performance**: Real-time inference on CPU/GPU

## API Endpoints

- `POST /detect` - Image detection endpoint
- `GET /status` - Server status check
- `POST /export` - Export detection results
- `POST /generate_heatmap` - Generate detection heatmaps
- `GET /video_feed` - Live video stream with detection

## Configuration

### Environment Variables
- `MODEL_WARMUP`: Enable/disable model warm-up (default: 1)

### Model Configuration
Edit `pothole.yaml` to customize detection parameters:
- Confidence threshold
- IoU threshold
- Input image size

## Development

### Adding New Features
1. Backend: Modify `app.py` and `model_manager.py`
2. Frontend: Update HTML, CSS, and JavaScript files
3. Styling: Use the unified vintage theme in `css/unified-vintage.css`

### Training Custom Models
1. Prepare your dataset in YOLO format
2. Update `data.yaml` with your dataset paths
3. Train using YOLOv8:
   ```python
   from ultralytics import YOLO
   model = YOLO('yolov8n.pt')
   model.train(data='data.yaml', epochs=100)
   ```

## Deployment

### Local Deployment
- Use the provided `run.bat` script on Windows
- Or run `python app.py` directly

### Production Deployment
- Use a WSGI server like Gunicorn
- Configure reverse proxy with Nginx
- Set up SSL certificates for HTTPS
- Consider using Docker for containerization

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- YOLOv8 by Ultralytics
- Flask web framework
- OpenCV for image processing
- The open-source community for various tools and libraries

## Support

If you encounter any issues or have questions:
1. Check the [Issues](../../issues) page
2. Create a new issue with detailed information
3. Include system information and error logs

## Roadmap

- [ ] Mobile app development
- [ ] Integration with mapping services
- [ ] Advanced analytics and ML insights
- [ ] Multi-language support
- [ ] Cloud deployment options
- [ ] API rate limiting and authentication

---

**Made with ❤️ for safer roads**