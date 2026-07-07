import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UserService } from './user.service';

@Injectable({ providedIn: 'root' })
export class AvatarIdentityService {
  constructor(private userService: UserService) { }

  clearAvatarUrl(profile: { displayName: string; bio: string | null }): Observable<unknown> {
    return this.userService.updateProfile({
      displayName: profile.displayName,
      bio: profile.bio ?? '',
      avatarUrl: '',
    });
  }
}
