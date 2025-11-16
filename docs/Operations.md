# EMS MedHx App Operations Guide

## Overview

This document outlines standard operating procedures for maintaining and supporting the EMS MedHx App infrastructure.

## Table of Contents

1. [Daily Operations](#daily-operations)
2. [Weekly Tasks](#weekly-tasks)
3. [Monthly Maintenance](#monthly-maintenance)
4. [Incident Response](#incident-response)
5. [Backup Procedures](#backup-procedures)
6. [Security Procedures](#security-procedures)

## Daily Operations

### System Health Checks

1. **Morning Checklist (8:00 AM)**
   ```bash
   # Check system status
   curl https://api.example.com/health
   
   # Review error logs
   aws logs filter-log-events \
     --log-group-name /ems-medhx/application \
     --filter-pattern "ERROR" \
     --start-time $(date -v-24H +%s000)
   
   # Monitor resource usage
   aws cloudwatch get-metric-statistics \
     --namespace AWS/ECS \
     --metric-name CPUUtilization \
     --dimensions Name=ServiceName,Value=api \
     --start-time $(date -v-24H +%Y-%m-%dT%H:%M:%S) \
     --end-time $(date +%Y-%m-%dT%H:%M:%S) \
     --period 3600 \
     --statistics Average
   ```

2. **Performance Monitoring (Continuous)**
   - Review CloudWatch dashboards
   - Check alert status
   - Monitor user activity
   - Track sync performance

3. **Evening Review (5:00 PM)**
   - Analyze daily metrics
   - Review support tickets
   - Check deployment status
   - Verify backup completion

### Response Time Monitoring

```bash
# Check API latency
curl -w "%{time_total}\n" -s https://api.example.com/health

# Monitor database performance
mongo --eval "db.currentOp()"

# Check cache performance
redis-cli INFO | grep ops
```

## Weekly Tasks

### 1. System Updates

```bash
# Update dependencies
yarn upgrade-interactive --latest

# Security patches
apt update && apt upgrade -y

# Container updates
docker-compose pull
docker-compose up -d
```

### 2. Performance Analysis

```bash
# Generate performance report
yarn workspace server report:performance

# Analyze slow queries
mongo --eval "db.currentOp({op: 'query', microsecs_running: {$gt: 100}})"

# Check resource trends
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=api \
  --start-time $(date -v-7d +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Average
```

### 3. Security Checks

```bash
# Run security scan
yarn workspace server security:audit

# Check SSL certificates
openssl x509 -enddate -noout -in /etc/ssl/certs/api.pem

# Review access logs
aws logs filter-log-events \
  --log-group-name /ems-medhx/access \
  --start-time $(date -v-7d +%s000)
```

## Monthly Maintenance

### 1. Resource Optimization

```bash
# Analyze resource usage
aws cost-explorer get-cost-and-usage \
  --time-period Start=$(date -v-1m +%Y-%m-%d),End=$(date +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics "BlendedCost" "UsageQuantity"

# Optimize instances
aws ec2 describe-instance-recommendations

# Clean up unused resources
aws ecr delete-untagged-images --repository-name ems-medhx
```

### 2. Database Maintenance

```bash
# Optimize collections
mongo --eval "db.scenarios.reIndex()"

# Update statistics
mongo --eval "db.scenarios.stats()"

# Clean old data
mongo --eval "db.logs.remove({timestamp: {$lt: new Date(Date.now() - 30*24*60*60*1000)}})"
```

### 3. Performance Testing

```bash
# Run load tests
yarn workspace server test:load

# Analyze results
yarn workspace server analyze:performance

# Generate report
yarn workspace server report:monthly
```

## Incident Response

### 1. High Error Rate

```bash
# Check error logs
aws logs filter-log-events \
  --log-group-name /ems-medhx/application \
  --filter-pattern "ERROR" \
  --start-time $(date -v-1H +%s000)

# Monitor metrics
aws cloudwatch get-metric-data \
  --metric-data-queries file://error-queries.json \
  --start-time $(date -v-1H +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date +%Y-%m-%dT%H:%M:%S)

# Scale if needed
aws ecs update-service --cluster ems-medhx --service api --desired-count 4
```

### 2. Performance Degradation

```bash
# Check system resources
top -b -n 1

# Monitor database
mongo --eval "db.currentOp({microsecs_running: {$gt: 1000}})"

# Check network
netstat -s | grep -i retransmit
```

### 3. Sync Issues

```bash
# Check sync status
redis-cli LLEN sync_queue

# Monitor workers
pm2 logs sync-worker

# Reset if needed
redis-cli DEL sync_queue
pm2 restart sync-worker
```

## Backup Procedures

### 1. Database Backup

```bash
# Full backup
mongodump --uri mongodb://<host>:27017 --out backup/$(date +%Y%m%d)

# Verify backup
cd backup/$(date +%Y%m%d) && tar -czvf backup.tar.gz *

# Upload to S3
aws s3 cp backup.tar.gz s3://ems-medhx-backups/$(date +%Y%m%d)/
```

### 2. Configuration Backup

```bash
# Export config
aws ecs describe-task-definition --task-definition ems-medhx-api > config-backup.json

# Backup secrets
aws secretsmanager get-secret-value --secret-id ems-medhx > secrets-backup.json

# Store safely
aws s3 cp config-backup.json s3://ems-medhx-backups/config/
aws s3 cp secrets-backup.json s3://ems-medhx-backups/secrets/
```

### 3. Log Archival

```bash
# Export logs
aws logs create-export-task \
  --log-group-name /ems-medhx/application \
  --from $(date -v-30d +%s000) \
  --to $(date +%s000) \
  --destination ems-medhx-logs \
  --destination-prefix $(date +%Y%m)

# Verify export
aws logs describe-export-tasks
```

## Security Procedures

### 1. Access Management

```bash
# Review IAM users
aws iam list-users

# Check permissions
aws iam list-attached-user-policies --user-name admin

# Rotate keys
aws iam create-access-key --user-name admin
aws iam delete-access-key --user-name admin --access-key-id AKIA...
```

### 2. Security Monitoring

```bash
# Check security groups
aws ec2 describe-security-groups

# Review CloudTrail
aws cloudtrail lookup-events --lookup-attributes AttributeKey=EventName,AttributeValue=ConsoleLogin

# Monitor suspicious activity
aws guardduty list-findings
```

### 3. Compliance Checks

```bash
# Run security scan
yarn workspace server security:audit

# Check compliance
aws configservice get-compliance-details-by-config-rule \
  --config-rule-name ems-medhx-compliance

# Generate report
yarn workspace server report:security
```

