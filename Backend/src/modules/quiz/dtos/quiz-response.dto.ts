import {IsEnum, IsNotEmpty, IsString,} from 'class-validator';

export enum QuizStatus {
    UNATTEMPTED = 'UNATTEMPTED',
    MARKED_FOR_REVIEW = 'MARKED_FOR_REVIEW',
    SAVED_AND_MARKED_FOR_REVIEW = 'SAVED_AND_MARKED_FOR_REVIEW',
    SAVED = 'SAVED',
}

export class QuizResponseDto {
    @IsEnum(QuizStatus)
    @IsNotEmpty()
    status: QuizStatus;

    @IsString()
    @IsNotEmpty()
    response: string;
}
