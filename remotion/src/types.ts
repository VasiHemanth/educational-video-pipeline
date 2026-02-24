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
        tech_terms?: string[];
        action_verbs?: string[];
        concepts?: string[];
    };
    duration_seconds: number;
}

export interface VideoContent {
    topic: string;
    question_number: string;
    question_text: string;
    hook_text?: string;
    cta_text?: string;
    tech_terms?: string[];
    domain?: string;
    answer_sections: AnswerSection[];
}

export interface VideoProps {
    content: VideoContent;
    diagrams: DiagramInfo[];
    config?: {
        animStyle?: string;
        pauseFrames?: number;
        useHook?: boolean;
        bgMusicPath?: string | null;
    };
    fps?: number;
}
