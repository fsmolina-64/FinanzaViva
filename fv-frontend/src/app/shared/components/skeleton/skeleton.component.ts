import { Component, input } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  template: `
    <div [class]="'animate-skeleton bg-elevated rounded-2xl ' + className()">
      &nbsp;
    </div>
  `
})
export class SkeletonComponent {
  className = input('h-4 w-full');
}
