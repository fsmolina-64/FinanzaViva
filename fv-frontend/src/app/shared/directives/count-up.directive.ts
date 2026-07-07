import { Directive, ElementRef, Input, OnChanges, SimpleChanges, inject } from '@angular/core';

@Directive({
  selector: '[appCountUp]',
})
export class CountUpDirective implements OnChanges {
  @Input('appCountUp') value = 0;
  @Input() countUpDuration = 700;
  @Input() countUpSuffix = '';

  private el = inject(ElementRef<HTMLElement>);
  private frame: number | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['value']) return;
    const from = changes['value'].previousValue ?? 0;
    this.animate(from, this.value);
  }

  private animate(from: number, to: number): void {
    if (this.frame) cancelAnimationFrame(this.frame);
    const start = performance.now();
    const duration = this.countUpDuration;

    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(from + (to - from) * eased);
      this.el.nativeElement.textContent = `${current}${this.countUpSuffix}`;
      if (progress < 1) this.frame = requestAnimationFrame(step);
    };

    this.frame = requestAnimationFrame(step);
  }
}
