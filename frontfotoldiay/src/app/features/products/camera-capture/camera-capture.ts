import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService, Product } from '../../../core/product';
import { AuthService } from '../../../core/auth';

@Component({
  selector: 'app-camera-capture',
  imports: [CommonModule, FormsModule],
  templateUrl: './camera-capture.html',
  styleUrl: './camera-capture.css'
})
export class CameraCapture {
  title = '';
  description = '';
  priceCfa: number | null = null;
  capturedImage: string | null = null;
  isLoading = false;
  errorMessage = '';

  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;

  constructor(
    private productService: ProductService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.initializeCamera();
  }

  ngOnDestroy() {
    this.stopCamera();
  }

  async initializeCamera() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Use back camera if available
      });

      this.videoElement = document.querySelector('video');
      if (this.videoElement && this.stream) {
        this.videoElement.srcObject = this.stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      this.errorMessage = 'Impossible d\'accéder à la caméra.';
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  capturePhoto() {
    if (!this.videoElement) return;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = this.videoElement.videoWidth;
    canvas.height = this.videoElement.videoHeight;
    context.drawImage(this.videoElement, 0, 0);

    this.capturedImage = canvas.toDataURL('image/jpeg', 0.8);
    this.stopCamera();
  }

  retakePhoto() {
    this.capturedImage = null;
    this.initializeCamera();
  }

  async createProduct() {
    if (!this.authService.isAuthenticated) {
      this.errorMessage = 'Veuillez vous connecter pour ajouter un produit.';
      return;
    }

    if (!this.title.trim() || !this.description.trim()) {
      this.errorMessage = 'Le titre et la description sont requis.';
      return;
    }

    if (!this.capturedImage) {
      this.errorMessage = 'Veuillez capturer une photo.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      // First, verify token is still valid by making a simple authenticated request
      await this.authService.verifyToken();

      // Convert captured image to file
      const blob = this.dataURLToBlob(this.capturedImage);
      const file = new File([blob], 'product-photo.jpg', { type: 'image/jpeg' });

      // Create product with photo
      const productData = {
        title: this.title.trim(),
        description: this.description.trim(),
        priceCfa: this.priceCfa || undefined,
        photoFile: file
      };

      const product = await this.productService.createProduct(productData);

      // Success: redirect to products list
      this.router.navigate(['/products']);
    } catch (error: any) {
      if (error.message === 'Session expirée. Veuillez vous reconnecter.') {
        this.errorMessage = 'Votre session a expiré. Veuillez vous reconnecter.';
        // Optionally, redirect to login after a delay
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      } else {
        this.errorMessage = error.message || 'Erreur lors de la création du produit.';
      }
    } finally {
      this.isLoading = false;
    }
  }

  private dataURLToBlob(dataURL: string): Blob {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }

  cancel() {
    this.router.navigate(['/products']);
  }
}
