import { Injectable, OnModuleInit } from "@nestjs/common";
import { PutObjectAclCommand, PutObjectCommand, S3Client, CreateBucketCommand, HeadBucketCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { BlobServiceClient, StorageSharedKeyCredential, generateBlobSASQueryParameters, BlobSASPermissions } from '@azure/storage-blob';

type StorageType = 'minio' | 'azure' | 'aws';

@Injectable()
export class S3Service implements OnModuleInit {

    private readonly s3Client: S3Client;
    private readonly blobServiceClient: BlobServiceClient;
    private readonly bucketName: string;
    private readonly containerName: string;
    private readonly storageType: StorageType;

    constructor() {
        this.storageType = (process.env.STORAGE_TYPE as StorageType) || 'minio';
        
        if (this.storageType === 'azure') {
            // Azure Blob Storage configuration
            const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
            this.containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'preparc';
            this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
            console.log(`✅ Using Azure Blob Storage - Container: ${this.containerName}`);
        } else if (this.storageType === 'minio') {
            // MinIO configuration
            this.s3Client = new S3Client({
                endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
                region: process.env.MINIO_REGION || 'us-east-1',
                credentials: {
                    accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
                    secretAccessKey: process.env.MINIO_SECRET_KEY || 'minioadmin123'
                },
                forcePathStyle: true,
            });
            this.bucketName = process.env.MINIO_BUCKET_NAME || 'preparc';
            console.log(`✅ Using MinIO - Bucket: ${this.bucketName}`);
        } else {
            // AWS S3 configuration
            this.s3Client = new S3Client({
                region: process.env.AWS_S3_REGION,
                credentials: {
                    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
                    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY
                }
            });
            this.bucketName = process.env.AWS_S3_BUCKET_NAME;
            console.log(`✅ Using AWS S3 - Bucket: ${this.bucketName}`);
        }
    }

    async onModuleInit() {
        if (this.storageType === 'minio') {
            await this.ensureBucketExists();
        } else if (this.storageType === 'azure') {
            await this.ensureContainerExists();
        }
    }

    private async ensureBucketExists() {
        try {
            await this.s3Client.send(new HeadBucketCommand({ Bucket: this.bucketName }));
            console.log(`✅ MinIO bucket '${this.bucketName}' already exists`);
        } catch (error) {
            try {
                await this.s3Client.send(new CreateBucketCommand({ Bucket: this.bucketName }));
                console.log(`✅ Created MinIO bucket '${this.bucketName}'`);
            } catch (createError) {
                console.error(`❌ Failed to create MinIO bucket '${this.bucketName}':`, createError);
            }
        }
    }

    private async ensureContainerExists() {
        try {
            const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
            const exists = await containerClient.exists();
            if (!exists) {
                await containerClient.create();
                console.log(`✅ Created Azure container '${this.containerName}'`);
            } else {
                console.log(`✅ Azure container '${this.containerName}' already exists`);
            }
        } catch (error) {
            console.error(`❌ Failed to ensure Azure container '${this.containerName}':`, error);
        }
    }

    async generatePresignedUrl(key: string, expiresIn: number): Promise<string> {
        if (this.storageType === 'azure') {
            return this.generateAzureSasUrl(key, expiresIn);
        } else {
            return this.generateS3PresignedUrl(key, expiresIn);
        }
    }

    private async generateS3PresignedUrl(key: string, expiresIn: number): Promise<string> {
        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key
        });

        const presignedUrl = await getSignedUrl(this.s3Client, command, { expiresIn });
        return presignedUrl;
    }

    private async generateAzureSasUrl(fileName: string, expiresIn: number): Promise<string> {
        const blobClient = this.blobServiceClient
            .getContainerClient(this.containerName)
            .getBlobClient(fileName);

        const accountName = this.blobServiceClient.accountName;
        const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;

        const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);

        const sasOptions = {
            containerName: this.containerName,
            blobName: fileName,
            permissions: BlobSASPermissions.parse('racw'), // read, add, create, write
            startsOn: new Date(),
            expiresOn: new Date(new Date().valueOf() + expiresIn * 1000),
        };

        const sasToken = generateBlobSASQueryParameters(sasOptions, sharedKeyCredential).toString();

        return `${blobClient.url}?${sasToken}`;
    }

    async uploadFile(fileName: string, buffer: Buffer, contentType: string): Promise<string> {
        if (this.storageType === 'azure') {
            return this.uploadToAzure(fileName, buffer, contentType);
        } else {
            return this.uploadToS3(fileName, buffer, contentType);
        }
    }

    private async uploadToS3(fileName: string, buffer: Buffer, contentType: string): Promise<string> {
        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: fileName,
            Body: buffer,
            ContentType: contentType,
        });

        await this.s3Client.send(command);
        
        if (this.storageType === 'minio') {
            return `${process.env.MINIO_ENDPOINT}/${this.bucketName}/${fileName}`;
        } else {
            return `https://${this.bucketName}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/${fileName}`;
        }
    }

    private async uploadToAzure(fileName: string, buffer: Buffer, contentType: string): Promise<string> {
        const blockBlobClient = this.blobServiceClient
            .getContainerClient(this.containerName)
            .getBlockBlobClient(fileName);

        await blockBlobClient.upload(buffer, buffer.length, {
            blobHTTPHeaders: { blobContentType: contentType }
        });

        return blockBlobClient.url;
    }

    async deleteFile(fileName: string): Promise<void> {
        if (this.storageType === 'azure') {
            await this.deleteFromAzure(fileName);
        } else {
            await this.deleteFromS3(fileName);
        }
    }

    private async deleteFromS3(fileName: string): Promise<void> {
        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: fileName,
        });

        await this.s3Client.send(command);
    }

    private async deleteFromAzure(fileName: string): Promise<void> {
        const blockBlobClient = this.blobServiceClient
            .getContainerClient(this.containerName)
            .getBlockBlobClient(fileName);

        await blockBlobClient.delete();
    }
}