export interface QuizResponseEntity {
    sys_id: number;
    title: string;
    createdById: number;
    startsAt: Date;
    endsAt: Date;
    duration: number;
    rules: string[];
    createdAt: Date;
    updatedAt: Date;
    questionStatuses: string[];
}