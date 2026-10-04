# PARKNOVA frontend (vanilla HTML/CSS/JS)
Run on port 3000 (the backend's CORS default is `app.frontend.url=http://localhost:3000`):

    cd parking-frontend && python3 -m http.server 3000

Backend: `FRONTEND_URL=http://localhost:3000` (also drives the OAuth redirect to `/oauth2/redirect`). Open http://localhost:3000
