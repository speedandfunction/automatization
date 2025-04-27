# OAuth2 Proxy Setup Guide

## Overview
This guide explains how to configure OAuth2 Proxy for authentication using Google OAuth in production. Development setup does not include OAuth2 Proxy by default.

---

## Google OAuth Setup
1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services > Credentials**
4. Click **Create Credentials > OAuth client ID**
5. Set application type to **Web application**
6. Add the following to **Authorized redirect URIs**:
   - `https://<your-domain>/oauth2/callback`
7. Save and copy your **Client ID** and **Client Secret**

---

## Environment Configuration
Create a `.env` file in your project root with the following variables:
```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
OAUTH2_PROXY_COOKIE_SECRET=your_random_cookie_secret
OAUTH2_PROXY_EMAIL_DOMAINS=yourdomain.com
# Optional: override default redirect URL
OAUTH2_PROXY_REDIRECT_URL=https://<your-domain>/oauth2/callback
```

- See [Generating a Cookie Secret (official docs)](https://oauth2-proxy.github.io/oauth2-proxy/configuration/overview?_highlight=cookie&_highlight=secret#generating-a-cookie-secret) for more options.