# Jira Cloudflare Worker Proxy

This is a serverless proxy designed to securely forward feedback from your frontend app to Jira without exposing your API tokens in the frontend code.

## How to Deploy (100% Free)

1. Create a free account at [Cloudflare](https://dash.cloudflare.com/) and go to **Workers & Pages**.
2. Click **Create Application** -> **Create Worker**. Name it `jira-feedback-proxy` (or similar) and click Deploy.
3. Click **Edit Code**, paste the entire contents of `worker.js` from this folder into the editor, and click **Save and deploy**.
4. Go back to your Worker's dashboard, go to **Settings** -> **Variables**.
5. Add the following Environment Variables (mark `JIRA_API_TOKEN` as Encrypted):
   - `JIRA_EMAIL`: Your Atlassian login email.
   - `JIRA_API_TOKEN`: Create one at [Atlassian Account Settings](https://id.atlassian.com/manage-profile/security/api-tokens).
   - `JIRA_DOMAIN`: Your domain, e.g., `yourcompany.atlassian.net` (no https://).
   - `JIRA_PROJECT_KEY`: Your project prefix, e.g., `DEP`.
   - `ALLOWED_ORIGIN`: `*` for now, but change to your app's actual URL in production.

6. **Done!** Copy your worker's URL (e.g., `https://jira-feedback-proxy.username.workers.dev`) and set it as `VITE_JIRA_PROXY_URL` in your frontend app's `.env` file!
