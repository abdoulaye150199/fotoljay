import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-auth-form',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './auth-form.html',
  styleUrl: './auth-form.css'
})
export class AuthForm implements OnInit {
  isLogin = true;
  email = '';
  password = '';
  username = '';
  phone = '';
  isLoading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Check route data to determine mode
    const mode = this.route.snapshot.data['mode'];
    this.isLogin = mode !== 'register';
  }

  toggleMode() {
    this.isLogin = !this.isLogin;
    this.errorMessage = '';
  }

  async onSubmit() {
    if (!this.email || !this.password) {
      this.errorMessage = 'Veuillez remplir tous les champs requis.';
      return;
    }

    if (!this.isLogin && !this.username) {
      this.errorMessage = 'Le nom d\'utilisateur est requis pour l\'inscription.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      if (this.isLogin) {
        await this.authService.login(this.email, this.password);
      } else {
        await this.authService.register(this.email, this.password, this.username, this.phone);
      }

      // Redirect to dashboard after successful login
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      this.errorMessage = error.message || 'Une erreur est survenue.';
    } finally {
      this.isLoading = false;
    }
  }
}
