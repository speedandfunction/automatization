# System Overview

**The system architecture includes two main components for business process automation: n8n and Temporal.**

- **n8n** is a visual tool for creating, running, and monitoring workflows, supporting integration with various external services and APIs. Users can configure process automation through a web interface using ready-made nodes and connectors.
- **Temporal** is a platform for orchestrating complex and long-running workflows at the code level. Temporal ensures reliable task execution, state management, and scalability, allowing for the implementation of custom automation scenarios.

**Interaction between components:**
- n8n is used for quick integration and automation of typical tasks, as well as for launching and monitoring workflows.
- Temporal is used for implementing complex, reliability-critical processes that require detailed control and programmable logic.

**The system supports:**
- Integration with external services (via n8n).
- Scalable execution and monitoring of processes (via Temporal).