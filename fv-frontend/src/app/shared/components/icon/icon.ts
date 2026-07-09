import { Component, input } from '@angular/core';

export type IconName =
    | 'mail'
    | 'lock'
    | 'user'
    | 'eye'
    | 'eye-off'
    | 'alert-triangle'
    | 'check'
    | 'loader';

@Component({
    selector: 'app-icon',
    standalone: true,
    host: { 'aria-hidden': 'true' },
    templateUrl: './icon.html',
    styleUrl: './icon.css'
})
export class IconComponent {
    name = input.required<IconName>();
    size = input<number>(18);
}