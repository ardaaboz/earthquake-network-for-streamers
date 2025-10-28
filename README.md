Earthquake Network for Streamers

Free overlay for OBS to show earthquake alerts.
Use MacroDroid on Android to forward notifications to the webhook.
Deploy to Vercel with Upstash or run locally with Node.js.
Open the overlay with channel query.
Send alerts to the hook with your secret.

Overlay example
https://your-app.vercel.app/overlay?channel=example

Webhook example
POST https://your-app.vercel.app/api/hook

Fields
secret channel title message location timestamp