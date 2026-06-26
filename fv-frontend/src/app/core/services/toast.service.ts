import { Injectable, signal } from '@angular/core';

export interface Toast {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
    toasts = signal<Toast[]>([]);

    success(message: string, duration = 3000): void { this._add(message, 'success', duration); }
    error(message: string, duration = 4000): void { this._add(message, 'error', duration); }
    warning(message: string, duration = 3500): void { this._add(message, 'warning', duration); }
    info(message: string, duration = 3000): void { this._add(message, 'info', duration); }

    dismiss(id: string): void {
        this.toasts.update(t => t.filter(toast => toast.id !== id));
    }

    private _add(message: string, type: Toast['type'], duration: number): void {
        const id = crypto.randomUUID();
        this.toasts.update(t => [...t, { id, type, message }]);
        setTimeout(() => this.dismiss(id), duration);
    }
}