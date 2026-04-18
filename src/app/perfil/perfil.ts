import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileService } from '../services/profile.service';
import { AuthService } from '../services/auth.service';
import { Nav } from '../shared/nav/nav';

@Component({
  selector: 'app-perfil',
  imports: [CommonModule, FormsModule, Nav],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
})
export class Perfil implements OnInit {
  profile = inject(ProfileService);
  auth = inject(AuthService);

  editing = signal(false);
  toastMsg = signal<string | null>(null);
  toastPos = signal(true);

  // Edit form state
  editName = '';
  editDob = '';
  editBio = '';
  editInterests: string[] = [];
  editAvatar = '';

  readonly achievements = [
    { id: 'first_login', label: 'Primer Paso',      icon: '👣', desc: 'Iniciaste sesión' },
    { id: 'first_quiz',  label: 'Estudiante',        icon: '📖', desc: 'Completaste un quiz' },
    { id: 'first_mov',   label: 'Contable',          icon: '📊', desc: 'Registraste un movimiento' },
    { id: 'board_lap',   label: 'Una Vuelta',        icon: '🎲', desc: 'Jugaste en el tablero' },
    { id: 'level_3',     label: 'Nivel 3',           icon: '⭐', desc: 'Alcanzaste nivel 3' },
    { id: 'rich',        label: 'Acaudalado',        icon: '💰', desc: 'Más de 5,000 monedas' },
  ];

  ngOnInit() {
    this.loadEditForm();
  }

  loadEditForm() {
    const p = this.profile.profile();
    if (!p) return;
    this.editName      = p.name;
    this.editDob       = p.dob;
    this.editBio       = p.bio;
    this.editInterests = [...p.interests];
    this.editAvatar    = p.avatar;
  }

  openEdit() {
    this.loadEditForm();
    this.editing.set(true);
  }

  saveEdit() {
    if (!this.editName.trim()) { this.toast('El nombre no puede estar vacío', false); return; }
    this.profile.update({
      name: this.editName.trim(),
      dob:  this.editDob,
      bio:  this.editBio.trim(),
      interests: this.editInterests,
      avatar: this.editAvatar,
    });
    this.auth.updateName(this.editName.trim());
    this.editing.set(false);
    this.toast('✅ Perfil actualizado correctamente', true);
  }

  toggleInterest(interest: string) {
    if (this.editInterests.includes(interest)) {
      this.editInterests = this.editInterests.filter(i => i !== interest);
    } else if (this.editInterests.length < 5) {
      this.editInterests = [...this.editInterests, interest];
    }
  }

  isUnlocked(id: string): boolean {
    return this.profile.profile()?.achievementsUnlocked.includes(id) ?? false;
  }

  toast(msg: string, pos: boolean) {
    this.toastMsg.set(msg);
    this.toastPos.set(pos);
    setTimeout(() => this.toastMsg.set(null), 3000);
  }

  formatDate(d: string): string {
    if (!d) return 'No indicada';
    return new Intl.DateTimeFormat('es-EC', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(d + 'T12:00'));
  }

  calcAge(dob: string): number | null {
    if (!dob) return null;
    const diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  }

  get joinedFormatted(): string {
    const d = this.profile.profile()?.joinedAt;
    if (!d) return '';
    return new Intl.DateTimeFormat('es-EC', { month: 'long', year: 'numeric' }).format(new Date(d));
  }
}
