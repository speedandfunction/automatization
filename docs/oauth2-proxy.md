# OAuth2 Proxy Setup Guide

## Overview
This document provides instructions for setting up and configuring OAuth2 Proxy for authentication.

## Prerequisites
- Docker and Docker Compose installed
- Google Cloud Platform account
- Domain name for your application

## Google OAuth Setup
1. Go to Google Cloud Console
2. Create a new project or select existing one
3. Enable OAuth2 API
4. Create OAuth2 credentials
5. Configure authorized redirect URIs
6. Save Client ID and Client Secret

## Environment Configuration
Create or update `.env` file with the following variables:
```bash
# OAuth2 Proxy Configuration
OAUTH2_PROXY_CLIENT_ID=your_client_id
OAUTH2_PROXY_CLIENT_SECRET=your_client_secret
OAUTH2_PROXY_COOKIE_SECRET=your_cookie_secret
OAUTH2_PROXY_EMAIL_DOMAIN=your_domain.com

# Docker Configuration
DOCKER_NETWORK=your_network_name
```

## Docker Compose Setup
```yaml
version: '3'
services:
  oauth2-proxy:
    image: bitnami/oauth2-proxy:latest
    environment:
      - OAUTH2_PROXY_CLIENT_ID=${OAUTH2_PROXY_CLIENT_ID}
      - OAUTH2_PROXY_CLIENT_SECRET=${OAUTH2_PROXY_CLIENT_SECRET}
      - OAUTH2_PROXY_COOKIE_SECRET=${OAUTH2_PROXY_COOKIE_SECRET}
      - OAUTH2_PROXY_EMAIL_DOMAIN=${OAUTH2_PROXY_EMAIL_DOMAIN}
    networks:
      - ${DOCKER_NETWORK}
    ports:
      - "4180:4180"
```

## Configuration Steps
1. Set up environment variables
2. Configure Docker Compose
3. Start the services
4. Test the authentication flow

## Troubleshooting
Common issues and their solutions:
- Invalid redirect URI
- Cookie domain mismatch
- Network connectivity issues

## Additional Resources
- [OAuth2 Proxy Documentation](https://oauth2-proxy.github.io/oauth2-proxy/)
- [Google OAuth2 Setup Guide](https://developers.google.com/identity/protocols/oauth2)