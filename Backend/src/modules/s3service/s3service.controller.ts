import { Controller, HttpCode, HttpStatus, Post, Get, Query } from "@nestjs/common";
import { S3Service } from "./s3service.service";

@Controller('s3')
export class S3Controller {

    constructor(private readonly s3Service: S3Service) { }


    @Get('presigned-url')
    async getPresignedUrl(
        @Query('key') key: string,
        @Query('expiredIn') expiresIn: string
    ): Promise<{ url: string }> {
        const url = await this.s3Service.generatePresignedUrl(key, parseInt(expiresIn || '3600'));
        return { url };
    }
}