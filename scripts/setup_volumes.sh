#!/bin/bash

# Create volume directories for Docker Compose
echo "Setting up volume directories..."
mkdir -p volumes/opensearch-data
mkdir -p volumes/postgresql-data
mkdir -p volumes/n8n_data

echo "Volume directories created successfully." 