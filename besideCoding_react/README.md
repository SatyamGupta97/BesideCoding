# besideCoding client

React + Vite single-page client for [besideCoding](../README.md).

## Run locally

```bash
npm install
echo "VITE_API_BASE_URL=http://localhost:8080/" > .env
npm run dev
```

`VITE_API_BASE_URL` must end with a slash; the API is expected at that prefix.

## Build

```bash
npm run build
npm run lint
```

See the root [README](../README.md) for the full setup, API routes and the Ask Beside assistant.
