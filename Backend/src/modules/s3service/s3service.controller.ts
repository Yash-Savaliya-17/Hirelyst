import { Controller, HttpCode, HttpStatus, Post, Get, Query, UploadedFile, UseInterceptors, Body, Logger } from "@nestjs/common";
import { S3Service } from "./s3service.service";
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('s3')
export class S3Controller {
    private readonly logger = new Logger(S3Controller.name);

    constructor(private readonly s3Service: S3Service) { }


    @Get('presigned-url')
    async getPresignedUrl(
        @Query('key') key: string,
        @Query('expiresIn') expiresIn: string
    ): Promise<{ url: string }> {
        const url = await this.s3Service.generatePresignedUrl(key, parseInt(expiresIn || '3600'));
        return { url };
    }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(
        @UploadedFile() file: Express.Multer.File,
        @Body('fileName') fileName: string
    ): Promise<{ url: string }> {
        this.logger.log(`📤 Uploading file: ${fileName || file.originalname} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
        
        const fileUrl = await this.s3Service.uploadFile(
            fileName || file.originalname,
            file.buffer,
            file.mimetype
        );
        
        this.logger.log(`✅ Upload successful: ${fileName} → ${fileUrl}`);
        return { url: fileUrl };
    }
}