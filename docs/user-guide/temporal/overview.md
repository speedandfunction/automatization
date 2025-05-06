# Temporal Overview

## Table of Contents
- Introduction
- Core Platform Components
- Key Features of Temporal
- Temporal UI Interface
- Usage Examples

## Introduction
Temporal is a platform for reliable and scalable execution of business processes (workflows) with a guarantee of completion even in the event of infrastructure failures. Temporal allows you to develop applications as if failures do not exist: the platform automatically restores state and continues process execution after failures, network errors, or server restarts.

## Core Platform Components
- **Temporal Service** — the server-side component that manages event history storage and workflow execution coordination.
- **Worker Processes** — processes that execute user workflow and activity code. Operate using SDKs in various languages (Go, Java, TypeScript, Python, etc.).
- **Temporal UI** — web interface for monitoring and managing workflows (https://temporal.speedandfunction.com/namespaces/default/workflows).

## Key Features of Temporal
- **Durable Execution**: process execution with state persistence and automatic recovery after failures.
- **Scalability**: supports millions of parallel workflows.
- **Flexible Architecture**: integrates with existing services and infrastructure.
- **Automatic Retries**: automatic retry of failed operations (activities) according to defined policies.
- **Determinism**: strict requirements for workflow code to ensure reproducibility.
- **Security**: all connections are secured, and data can be encrypted on the application side.

## Temporal UI Interface
Temporal UI provides:
- Viewing and searching workflows by namespace
- Detailed execution history for each workflow
- State management (start, complete, cancel)
- Diagnostics and process debugging

---
