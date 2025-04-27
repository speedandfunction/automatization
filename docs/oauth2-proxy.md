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
# Google OAuth credentials
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# OAuth2 Proxy core settings
OAUTH2_PROXY_PROVIDER=google
OAUTH2_PROXY_EMAIL_DOMAINS=yourdomain.com
OAUTH2_PROXY_COOKIE_SECRET=your_random_cookie_secret
OAUTH2_PROXY_REDIRECT_URL=https://<your-domain>/oauth2/callback
OAUTH2_PROXY_HTTP_ADDRESS=0.0.0.0:8080
OAUTH2_PROXY_UPSTREAMS=http://temporal-ui:8080

# Cookie settings
OAUTH2_PROXY_COOKIE_DOMAINS=.your-domain.com
OAUTH2_PROXY_WHITELIST_DOMAINS=.your-domain.com
OAUTH2_PROXY_COOKIE_NAME=_oauth2_proxy
OAUTH2_PROXY_COOKIE_SECURE=true
OAUTH2_PROXY_COOKIE_HTTPONLY=true
OAUTH2_PROXY_COOKIE_SAMESITE=lax
OAUTH2_PROXY_COOKIE_REFRESH=1h
OAUTH2_PROXY_COOKIE_EXPIRE=168h

# CSRF protection settings
OAUTH2_PROXY_CSRF_COOKIE_NAME=_oauth2_proxy_csrf
OAUTH2_PROXY_CSRF_COOKIE_SECURE=true
OAUTH2_PROXY_CSRF_COOKIE_DOMAIN=.your-domain.com
OAUTH2_PROXY_CSRF_COOKIE_HTTPONLY=true
OAUTH2_PROXY_CSRF_COOKIE_SAMESITE=lax

# Debug and sign-out settings
OAUTH2_PROXY_SHOW_DEBUG_ON_ERROR=true
OAUTH2_PROXY_SIGN_OUT_URL=https://<your-domain>/oauth2/sign_out
```
- See [Generating a Cookie Secret (official docs)](https://oauth2-proxy.github.io/oauth2-proxy/configuration/overview?_highlight=cookie&_highlight=secret#generating-a-cookie-secret) for more options.

**Note:**
- For production, use `docker-compose.prod.yml` and set all variables as above.
- For development, OAuth2 Proxy is not enabled by default. If needed, replicate the above settings in your local `.env` and compose files.
- Adjust domain values to match your deployment.