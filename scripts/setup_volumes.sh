#!/bin/bash

# Create volume directories for Docker Compose
echo "Setting up volume directories..."
mkdir -p volumes/opensearch-data
mkdir -p volumes/postgresql-data
mkdir -p volumes/n8n_data

# Set broader permissions to ensure Docker can access these directories
echo "Setting permissions for Docker access..."
chmod -R 777 volumes/opensearch-data
chmod -R 777 volumes/postgresql-data
chmod -R 777 volumes/n8n_data

echo "Volume directories created successfully with Docker-accessible permissions." 