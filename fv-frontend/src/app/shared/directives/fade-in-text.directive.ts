import { Directive, ElementRef, OnInit, inject } from '@angular/core';

@Directive({
  selector: '[appFadeInText]',
  standalone: true,
})
export class FadeInTextDirective implements OnInit {
  private readonly el = inject(ElementRef);

  ngOnInit(): void {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          this.el.nativeElement.classList.add('fadeInText');
          observer.unobserve(this.el.nativeElement);
        }
      }
    }, { threshold: 0.1 });
    observer.observe(this.el.nativeElement);
  }
}
