export type FontStyle = 'playfair' | 'cormorant' | 'dm-serif';
export type BgStyle = 'pure-black' | 'grain' | 'subtle-gradient';

export interface MotivationReelProps {
    /** The main quote text. Use \n for line breaks. */
    quote: string;
    /** Optional caption (for metadata, not rendered on screen) */
    caption?: string;
    /** Watermark text displayed bottom-left */
    watermark?: string;
    /** Font style for the quote */
    fontStyle?: FontStyle;
    /** Background style */
    bgStyle?: BgStyle;
    /** Path to background audio */
    audioSrc?: string;
    /** Audio volume (0-1), default 0.2 */
    audioVolume?: number;
}
