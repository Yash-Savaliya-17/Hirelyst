import { Module } from "@nestjs/common";
import { S3Service } from "./s3service.service";
import { S3Controller } from "./s3service.controller";

@Module({
    providers: [S3Service],
    controllers: [S3Controller]
})

export class S3Module { }