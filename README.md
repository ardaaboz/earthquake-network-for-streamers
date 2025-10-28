Earthquake Network for Streamers

Free browser source overlay for OBS that shows earthquake early warnings.
Use an Android phone with MacroDroid to forward Deprem Agi notifications to the webhook.
Deploy on Vercel with Upstash or run locally with Node.js.
Open the overlay page with a channel query.
Send alerts to the hook endpoint with your secret and channel.

Example overlay
https://your-app.vercel.app/overlay?channel=example

Example webhook
POST https://your-app.vercel.app/api/hook

Fields
secret channel title message location timestamp
