import { Injectable, OnModuleInit } from "@nestjs/common";
import { PutObjectAclCommand, PutObjectCommand, S3Client, CreateBucketCommand, HeadBucketCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

@Injectable()
export class S3Service implements OnModuleInit {

    private readonly s3Client: S3Client;
    private readonly bucketName: string;
    private readonly isMinIO: boolean;

    constructor() {
        this.isMinIO = process.env.USE_MINIO === 'true';
        
        if (this.isMinIO) {
            // MinIO configuration
            this.s3Client = new S3Client({
                endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
                region: process.env.MINIO_REGION || 'us-east-1', // MinIO doesn't care about region, but AWS SDK requires it
                credentials: {
                    accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
                    secretAccessKey: process.env.MINIO_SECRET_KEY || 'minioadmin123'
                },
                forcePathStyle: true, // Required for MinIO
            });
        } else {
            // AWS S3 configuration
            this.s3Client = new S3Client({
                region: process.env.AWS_S3_REGION,
                credentials: {
                    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
                    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY
                }
            });
        }

        this.bucketName = this.isMinIO 
            ? process.env.MINIO_BUCKET_NAME || 'preparcbucket'
            : process.env.AWS_S3_BUCKET_NAME;
    }

    async onModuleInit() {
        if (this.isMinIO) {
            await this.ensureBucketExists();
        }
    }

    private async ensureBucketExists() {
        try {
            // Check if bucket exists
            await this.s3Client.send(new HeadBucketCommand({ Bucket: this.bucketName }));
            console.log(`Bucket ${this.bucketName} already exists`);
        } catch (error) {
            // Bucket doesn't exist, create it
            try {
                await this.s3Client.send(new CreateBucketCommand({ Bucket: this.bucketName }));
                console.log(`Created bucket ${this.bucketName}`);
            } catch (createError) {
                console.error(`Failed to create bucket ${this.bucketName}:`, createError);
            }
        }
    }


    async generatePresignedUrl(key: string, expiresIn: number): Promise<string> {

        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key
        });

        const presignedUrl = await getSignedUrl(this.s3Client, command, { expiresIn });
        return presignedUrl;

    }
}