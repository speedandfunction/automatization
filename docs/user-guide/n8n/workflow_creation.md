# Creating and Running a Workflow (n8n)

## Table of Contents
- General Information
- Creating a New Workflow
- Adding and Configuring Nodes
- Running a Workflow
- Example of a Simple Workflow

## General Information

**Description:**  
A workflow in n8n is a sequence of automated actions (nodes) that are executed when a specific event (trigger) occurs.

## Creating a New Workflow

1. Go to the "Workflows" section in the left menu.
2. Click the "New Workflow" button.
3. Enter a name and, if necessary, a description for the workflow.

## Adding and Configuring Nodes

1. In the Node Panel, find the required node (for example, "HTTP Request", "Slack", "Google Sheets").
2. Drag the node into the workspace.
3. Connect the nodes to define the execution order.
4. For each node, open the properties panel and specify the necessary parameters (for example, URL, method, request data, credentials).

## Running a Workflow

- For testing, use the "Execute Workflow" button (manual run).
- To run automatically, set up a trigger (for example, Webhook, Cron, Email Trigger).
- After configuring the trigger, activate the workflow using the "Active" toggle.

## Example of a Simple Workflow

**Task:** Retrieve data from a public API and send the result to Slack.

**Main Steps:**
1. **HTTP Request** — retrieve data from the API.
2. **Slack** — send a message with the result to the selected channel.

**Example of Input and Output Data:**

```json
// HTTP Request (output data)
{
  "data": {
    "value": 42
  }
}

// Slack (input data)
{
  "text": "API value: 42"
}
```

**Used Services/Integrations:**
- HTTP Request
- Slack

--- 