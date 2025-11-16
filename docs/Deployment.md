# EMS MedHx App Deployment Guide

## Overview

This document provides comprehensive instructions for deploying and maintaining the EMS MedHx App infrastructure.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Deployment Process](#deployment-process)
4. [Monitoring](#monitoring)
5. [Troubleshooting](#troubleshooting)
6. [Rollback Procedures](#rollback-procedures)

## Prerequisites

### Required Tools
- Docker v20.10+
- Node.js v18+
- AWS CLI v2
- kubectl v1.25+
- Terraform v1.5+

### Access Requirements
- AWS IAM credentials
- GitHub repository access
- Docker Hub access
- MongoDB Atlas access

### Environment Variables
```bash
# Core Configuration
NODE_ENV=production
PORT=3000

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<access-key>
AWS_SECRET_ACCESS_KEY=<secret-key>

# Database Configuration
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>
REDIS_URL=redis://redis:6379

# Authentication
JWT_SECRET=<jwt-secret>
JWT_EXPIRY=24h

# Monitoring
NEW_RELIC_LICENSE_KEY=<license-key>
SENTRY_DSN=<dsn-url>
```

## Environment Setup

### 1. Infrastructure Provisioning

```bash
# Initialize Terraform
cd terraform
terraform init

# Plan deployment
terraform plan -out=tfplan

# Apply changes
terraform apply tfplan
```

### 2. Database Setup

```bash
# Initialize MongoDB
mongo mongodb://<host>:27017/ems-medhx

# Run migrations
yarn workspace server migrate:up

# Verify database
yarn workspace server db:verify
```

### 3. Cache Configuration

```bash
# Configure Redis
redis-cli -h <host> -p 6379

# Set cache parameters
CONFIG SET maxmemory 2gb
CONFIG SET maxmemory-policy allkeys-lru
```

## Deployment Process

### 1. Build Applications

```bash
# Build server
yarn workspace server build

# Build mobile apps
yarn workspace mobile build:android
yarn workspace mobile build:ios
```

### 2. Container Deployment

```bash
# Build containers
docker-compose build

# Push to registry
docker-compose push

# Deploy to ECS
aws ecs update-service --cluster ems-medhx --service api --force-new-deployment
```

### 3. Mobile App Distribution

```bash
# Android
fastlane android deploy

# iOS
fastlane ios deploy
```

### 4. Verify Deployment

```bash
# Check service health
curl https://api.example.com/health

# Monitor logs
aws logs tail /ems-medhx/application --follow

# Verify metrics
aws cloudwatch get-metric-statistics --namespace EMS-MedHx --metric-name SystemHealth
```

## Monitoring

### Dashboard Access
- CloudWatch Dashboards: https://console.aws.amazon.com/cloudwatch/
- New Relic: https://newrelic.com/
- Sentry: https://sentry.io/

### Key Metrics
1. System Health
   - CPU Usage
   - Memory Utilization
   - Error Rates
   - Response Times

2. Application Metrics
   - Active Users
   - Scenario Completions
   - Sync Success Rate
   - Cache Hit Ratio

3. Database Metrics
   - Connection Count
   - Query Performance
   - Storage Usage
   - Replication Lag

### Alerts Configuration

```bash
# CPU Usage Alert
aws cloudwatch put-metric-alarm \
  --alarm-name high-cpu-usage \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:us-east-1:123456789012:alerts

# Error Rate Alert
aws cloudwatch put-metric-alarm \
  --alarm-name high-error-rate \
  --metric-name ErrorRate \
  --namespace EMS-MedHx \
  --statistic Average \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:us-east-1:123456789012:alerts
```

## Troubleshooting

### Common Issues

1. High Response Times
   ```bash
   # Check system resources
   aws cloudwatch get-metric-statistics \
     --namespace AWS/ECS \
     --metric-name CPUUtilization \
     --dimensions Name=ServiceName,Value=api \
     --start-time $(date -v-1H +%Y-%m-%dT%H:%M:%S) \
     --end-time $(date +%Y-%m-%dT%H:%M:%S) \
     --period 60 \
     --statistics Average

   # Check database performance
   mongo --eval "db.currentOp()"
   ```

2. Sync Issues
   ```bash
   # Check sync queue
   redis-cli LLEN sync_queue

   # Monitor sync workers
   pm2 logs sync-worker

   # Clear stuck items
   redis-cli DEL sync_queue
   ```

3. Memory Leaks
   ```bash
   # Generate heap dump
   node --heapsnapshot

   # Analyze with Chrome DevTools
   chrome://inspect
   ```

### Diagnostic Commands

```bash
# Container Logs
docker logs <container-id>

# Process Status
pm2 status

# Network Status
netstat -tulpn

# Disk Usage
df -h
```

## Rollback Procedures

### 1. Container Rollback

```bash
# Get previous version
aws ecs describe-task-definition --task-definition ems-medhx-api

# Rollback deployment
aws ecs update-service \
  --cluster ems-medhx \
  --service api \
  --task-definition ems-medhx-api:<previous-version>
```

### 2. Database Rollback

```bash
# Restore from backup
mongorestore --uri mongodb://<host>:27017 --db ems-medhx backup/

# Verify data
mongo --eval "db.scenarios.count()"
```

### 3. Mobile App Rollback

```bash
# Android
fastlane android deploy version:<previous-version>

# iOS
fastlane ios deploy version:<previous-version>
```

### 4. Verify Rollback

```bash
# Check application version
curl https://api.example.com/version

# Verify functionality
yarn workspace server test:smoke

# Monitor metrics
aws cloudwatch get-metric-data \
  --metric-data-queries file://queries.json \
  --start-time $(date -v-1H +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date +%Y-%m-%dT%H:%M:%S)
```

