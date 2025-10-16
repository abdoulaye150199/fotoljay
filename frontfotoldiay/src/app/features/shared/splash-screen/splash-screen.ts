import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-splash-screen',
  imports: [CommonModule],
  templateUrl: './splash-screen.html',
  styleUrl: './splash-screen.css',
  standalone: true
})
export class SplashScreen implements OnInit {
  protected readonly isVisible = signal(true);

  ngOnInit(): void {
    // Hide splash screen after animation completes (3.5 seconds)
    setTimeout(() => {
      this.isVisible.set(false);
    }, 3500);
  }
}