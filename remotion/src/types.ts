export interface DiagramInfo {
    section_id: string;
    excalidrawPath: string;
    pngPath: string;
}

export interface AnswerSection {
    id: string;
    title: string;
    text: string;
    keywords: {
        gcp_services?: string[];
        action_verbs?: string[];
        concepts?: string[];
    };
    duration_seconds: number;
}

export interface VideoContent {
    topic: string;
    question_number: string;
    question_text: string;
    answer_sections: AnswerSection[];
}

export interface VideoProps {
    content: VideoContent;
    diagrams: DiagramInfo[];
    fps?: number;
}
