# Temporal Overview

## Table of Contents
- Introduction
- Core Platform Components
- Shared Utilities and Configuration
- Key Features of Temporal
- Temporal UI Interface

## Introduction
Temporal is a platform for reliable and scalable execution of business processes (workflows) with a guarantee of completion even in the event of infrastructure failures. Temporal allows you to develop applications as if failures do not exist: the platform automatically restores state and continues process execution after failures, network errors, or server restarts.

## Core Platform Components
- **Temporal Service** — the server-side component that manages event history storage and workflow execution coordination.
- **Worker Processes** — processes that execute user workflow and activity code. Operate using SDKs in various languages (Go, Java, TypeScript, Python, etc.).
- **Temporal UI** — web interface for monitoring and managing workflows.

## Shared Utilities and Configuration
- **workers-shared/** — This directory contains shared utilities, type definitions, and configuration used by multiple Temporal workers. It is intended for code that is not specific to a single worker but is reused across the project to avoid duplication and promote consistency. Examples include common helper functions, shared type definitions, and configuration files that are imported by different worker packages.

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
