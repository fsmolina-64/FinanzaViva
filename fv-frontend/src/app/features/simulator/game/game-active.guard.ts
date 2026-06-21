import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';
import { Observable } from 'rxjs';
import { Game } from './game';

@Injectable({ providedIn: 'root' })
export class GameActiveGuard implements CanDeactivate<Game> {
  canDeactivate(component: Game): boolean | Observable<boolean> {
    return component.canLeave();
  }
}
