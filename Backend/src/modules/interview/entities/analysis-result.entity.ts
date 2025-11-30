export interface AnalysisResultEntity {
    recognized_speech: string;
    analysis: {
        clarity_score: number;
        conciseness: boolean;
        filler_words: object;
        poor_sentence_starters: string[];
        relevancy_score: number;
        repetition: number;
        weaknesses: string[];
        word_count: number;
        tone: string;
        repetition_summary: string;
        strengths: string[];
        suggested_answer: string;
    };
    summary: {
        overall_score: number;
        rating: string;
    };
}
