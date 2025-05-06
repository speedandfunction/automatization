# n8n Integrations and Services

_A list of supported integrations and configuration features._

## Table of Contents
- Integration Overview
- Popular Integration Examples
- Configuration Features

## Integration Overview

**Description:**  
n8n supports a wide range of integrations with external services and applications, enabling business process automation without coding. Integrations are implemented as nodes that can be added to a workflow.

## Popular Integration Examples

- **Slack** — send and receive messages, manage channels.
- **Gmail** — automate email operations (sending, receiving, filtering emails).
- **Google Sheets** — read, write, and update spreadsheet data.
- **Trello** — manage cards, boards, and lists.
- **HTTP Request** — integration with any REST API.
- **HubSpot** — manage leads, contacts, companies, and deals in CRM.
- **Redmine** — automate tasks, create and update tickets, integrate with project management.

The full list of integrations is available on the official website: [n8n Integrations](https://n8n.io/integrations)

## Configuration Features

- Most integrations require you to provide credentials (API keys, OAuth tokens, etc.).
- Configuration is done through the "Credentials" section in the n8n interface.
- Some services support OAuth authorization directly from the interface.
- After adding credentials, you can use them in all workflows.
- For integrations with custom APIs, use the "HTTP Request" node.
- For HubSpot integration, you need to create and add an API key or OAuth token in the "Credentials" section.
- For Redmine integration, you must specify the server URL and user API key.

--- 