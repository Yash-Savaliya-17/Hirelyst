import {Injectable} from '@nestjs/common';
import {PrismaService} from "../../shared/prisma/prisma.service";
import axios from "axios";
import {ConfigService} from "@nestjs/config";
import * as FormData from "form-data";

@Injectable()
export class ResumeService {
    constructor(
        private prisma: PrismaService,
        private config: ConfigService
    ) {
    }

    async getAtsScore(file: Express.Multer.File, jobDescription: string) {
        try {
            const form = new FormData();
            form.append("resume", file.buffer, file.originalname); // Correct way to append file buffer
            form.append("job_description", jobDescription); // Hardcoded job description for now
            const response = await axios.post(
                this.config.get("RESUME_ATS_SERVER") + "/ats-score",
                form,
                {
                    headers: {
                        ...form.getHeaders(), // Include the necessary multipart headers
                    },
                },
            );
            return response.data;
        } catch (error) {
            console.log(error);
        }
    }

    async parseResume(file: Express.Multer.File) {

    }
}
