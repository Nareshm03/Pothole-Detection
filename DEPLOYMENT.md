# Deployment Guide

## Architecture
- **Frontend**: Vercel (Static hosting)
- **Backend**: Render (Python + YOLO model)

## Backend Deployment (Render)

1. **Create Render account** at render.com

2. **Connect GitHub repository**
   - New Web Service → Connect GitHub repo

3. **Configure service**
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `python app.py`
   - Environment: Python 3

4. **Set environment variables**
   ```
   MODEL_WARMUP=0
   PORT=5000
   ```

5. **Deploy** - Render will auto-deploy from main branch

## Frontend Deployment (Vercel)

1. **Create Vercel account** at vercel.com

2. **Connect GitHub repository**
   - Import Project → Select your repo

3. **Configure build settings**
   - Framework: Other
   - Build Command: (leave empty)
   - Output Directory: (leave empty)

4. **Update API URL**
   - Edit `config.js`
   - Replace `your-app-name.onrender.com` with your Render URL

5. **Deploy** - Vercel will auto-deploy

## Update Frontend API Configuration

After backend deployment, update `config.js`:
```javascript
production: {
    API_BASE_URL: 'https://your-actual-render-url.onrender.com'
}
```

## Testing

1. **Backend**: Test API endpoints at your Render URL
2. **Frontend**: Test detection functionality on Vercel URL
3. **Integration**: Verify frontend can communicate with backend

## Notes

- Render free tier may have cold starts
- Model loading takes ~30 seconds on first request
- Consider upgrading to paid plans for production use