import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './features/shared/navbar/navbar';
import { Footer } from './features/shared/footer/footer';
import { SplashScreen } from './features/shared/splash-screen/splash-screen';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Footer, SplashScreen],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('front_fotal_jay');
}
