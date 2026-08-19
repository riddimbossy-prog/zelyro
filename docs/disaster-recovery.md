# Disaster recovery

1. Restore Postgres from PITR.  
2. Confirm S3 masters (versioning).  
3. Re-point Cloudflare DNS if the API region is lost.  
4. Disable checkout via remote config `maintenance_mode`.  
5. Replay unprocessed webhooks from provider dashboards.
