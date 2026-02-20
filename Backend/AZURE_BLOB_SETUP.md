# Azure Blob Storage Setup Guide

## What's Changed

✅ Added Azure Blob Storage SDK (`@azure/storage-blob`)
✅ Updated `s3service.service.ts` to support 3 storage types: MinIO, Azure, AWS S3
✅ Added Azure configuration to `.env`
✅ Maintained backward compatibility with MinIO

## Storage Configuration

The system now supports 3 storage options via `STORAGE_TYPE` environment variable:
- `minio` - Local MinIO (default, current setup)
- `azure` - Azure Blob Storage (new option)
- `aws` - AWS S3 (original option)

## How to Switch to Azure Blob Storage

### Step 1: Get Azure Credentials

1. Go to [Azure Portal](https://portal.azure.com)
2. Create a Storage Account (or use existing)
3. Get these values from Azure Portal → Your Storage Account → "Access keys":
   - **Connection String** (copy from key1 or key2)
   - **Storage Account Name**
   - **Storage Account Key** (key1 or key2)
4. Create a container named `preparc` (or your preferred name)

### Step 2: Update `.env` File

Replace these placeholders in `Backend/.env`:

```env
# Change storage type from 'minio' to 'azure'
STORAGE_TYPE=azure

# Azure Blob Storage Configuration
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=YOUR_ACCOUNT_NAME;AccountKey=YOUR_ACCOUNT_KEY;EndpointSuffix=core.windows.net
AZURE_STORAGE_ACCOUNT_NAME=YOUR_ACCOUNT_NAME
AZURE_STORAGE_ACCOUNT_KEY=YOUR_ACCOUNT_KEY
AZURE_STORAGE_CONTAINER_NAME=preparc
```

**Example** (replace with your actual values):
```env
STORAGE_TYPE=azure

AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=preparcstorage;AccountKey=abc123xyz456==;EndpointSuffix=core.windows.net
AZURE_STORAGE_ACCOUNT_NAME=preparcstorage
AZURE_STORAGE_ACCOUNT_KEY=abc123xyz456==
AZURE_STORAGE_CONTAINER_NAME=preparc
```

### Step 3: Restart Backend

```bash
cd Backend
npm run start:dev
```

You should see:
```
✅ Using Azure Blob Storage - Container: preparc
✅ Azure container 'preparc' already exists
```

## Features

### Automatic Container/Bucket Creation
- MinIO: Auto-creates bucket on startup
- Azure: Auto-creates container on startup
- AWS S3: Manual creation required

### Presigned URLs
- **MinIO/AWS**: S3-style presigned URLs
- **Azure**: SAS (Shared Access Signature) URLs with read/write permissions

### File Upload
```typescript
await s3Service.uploadFile('filename.jpg', buffer, 'image/jpeg');
```

### Generate Presigned URL
```typescript
const url = await s3Service.generatePresignedUrl('filename.jpg', 3600); // 1 hour expiry
```

### Delete File
```typescript
await s3Service.deleteFile('filename.jpg');
```

## Switching Between Storage Types

Just change `STORAGE_TYPE` in `.env` and restart:

```env
# Use MinIO (local development)
STORAGE_TYPE=minio

# Use Azure Blob Storage (production)
STORAGE_TYPE=azure

# Use AWS S3
STORAGE_TYPE=aws
```

No code changes needed! The service automatically uses the correct storage backend.

## Azure Blob Storage Benefits

✅ **No self-hosting** - Managed by Microsoft
✅ **Scalability** - Auto-scales with your needs
✅ **High availability** - 99.9% uptime SLA
✅ **Security** - Enterprise-grade encryption
✅ **Cost-effective** - ~$0.02/GB/month
✅ **Global CDN** - Fast access worldwide
✅ **Easy migration** - Keep MinIO for local dev, use Azure for production

## Cost Estimation

**Azure Blob Storage (Hot Tier):**
- Storage: $0.0184 per GB/month
- Operations: $0.004 per 10,000 write operations
- Bandwidth: First 100GB free, then $0.087 per GB

**Example for 100GB + 1M uploads/month:**
- Storage: 100GB × $0.0184 = $1.84
- Operations: 1M uploads ÷ 10,000 × $0.004 = $0.40
- **Total: ~$2.24/month**

## Troubleshooting

### Error: "Connection string is invalid"
- Verify `AZURE_STORAGE_CONNECTION_STRING` has no extra spaces/newlines
- Ensure you copied the full string from Azure Portal

### Error: "Container not found"
- Container will auto-create on first startup
- Check Azure Portal → Storage Account → Containers to verify

### Error: "Signature did not match"
- Verify `AZURE_STORAGE_ACCOUNT_KEY` matches the key in connection string
- Try regenerating the access key in Azure Portal

### Still using MinIO?
- Check `STORAGE_TYPE=minio` in `.env`
- Change to `STORAGE_TYPE=azure` and restart

## Testing

Test the presigned URL endpoint:
```bash
curl http://localhost:3000/s3/presigned-url?key=test.jpg&expiresIn=3600
```

Should return a URL:
- **MinIO**: `http://localhost:9000/preparc/test.jpg?X-Amz-...`
- **Azure**: `https://preparcstorage.blob.core.windows.net/preparc/test.jpg?sv=...`

## Migration from MinIO to Azure

If you have existing files in MinIO, create a migration script:

```bash
# List MinIO files
docker exec minio mc ls local/preparc

# Copy to Azure using Azure Storage Explorer or CLI
az storage blob upload-batch --source /path/to/minio/data --destination preparc --account-name preparcstorage
```

## Support

For Azure-specific issues:
- [Azure Blob Storage Documentation](https://docs.microsoft.com/en-us/azure/storage/blobs/)
- [Azure Storage Explorer](https://azure.microsoft.com/en-us/products/storage/storage-explorer/) (GUI tool)

For MinIO issues:
- Current MinIO setup works as before
- No changes to MinIO configuration
