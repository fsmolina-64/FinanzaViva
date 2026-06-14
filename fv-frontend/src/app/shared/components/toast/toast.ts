import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../../core/services/toast.service';

@Component({
    selector: 'app-toast',
    imports: [CommonModule],
    templateUrl: './toast.html',
    styleUrl: './toast.css'
})
export class ToastComponent {
    toastService = inject(ToastService);

    getIcon(type: Toast['type']): string {
        const icons: Record<Toast['type'], string> = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        return icons[type];
    }
}