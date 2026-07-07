import { Injectable } from '@angular/core';

interface EquippedVisual {
    icon: string;
}

const FRAME_CLASS_MAP: Record<string, string> = {
    '🥉': 'border-amber-700 shadow-amber-700/40 shadow-md',
    '🥈': 'border-muted shadow-muted/40 shadow-md',
    '🥇': 'border-warning shadow-warning/50 shadow-lg',
    '💠': 'border-primary shadow-primary/50 shadow-lg',
};

const AURA_CLASS_MAP: Record<string, string> = {
    '💙': 'aura-blue',
    '✨': 'aura-gold',
    '🔮': 'aura-legendary',
};

@Injectable({ providedIn: 'root' })
export class RewardVisualsService {
    getFrameClass(frame: EquippedVisual | null | undefined): string {
        if (!frame) return 'border-strong';
        return FRAME_CLASS_MAP[frame.icon] ?? 'border-strong';
    }

    getAuraClass(aura: EquippedVisual | null | undefined): string {
        if (!aura) return '';
        return AURA_CLASS_MAP[aura.icon] ?? '';
    }
}