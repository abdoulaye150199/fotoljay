import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService, Product } from '../../../core/product';
import { AuthService } from '../../../core/auth';

@Component({
  selector: 'app-product-detail',
  imports: [CommonModule],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css'
})
export class ProductDetail implements OnInit {
  product: Product | null = null;
  isLoading = false;
  errorMessage = '';
  selectedProduct: Product | null = null;
  showContactModal: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadProduct(id);
    }
  }

  async loadProduct(id: string) {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      this.product = await this.productService.getProductById(id);
    } catch (error: any) {
      this.errorMessage = error.message || 'Erreur lors du chargement du produit.';
    } finally {
      this.isLoading = false;
    }
  }

  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated;
  }

  canEdit(): boolean {
    if (!this.product) return false;
    const currentUser = this.authService.currentUser;
    return currentUser?.id === this.product.sellerId || this.authService.hasRole('ADMIN');
  }

  canDelete(): boolean {
    if (!this.product) return false;
    const currentUser = this.authService.currentUser;
    return currentUser?.id === this.product.sellerId || this.authService.hasRole('ADMIN');
  }

  async deleteProduct() {
    if (!this.product) return;

    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      return;
    }

    try {
      await this.productService.deleteProduct(this.product.id);
      this.router.navigate(['/products']);
    } catch (error: any) {
      alert('Erreur lors de la suppression: ' + error.message);
    }
  }

  editProduct() {
    // TODO: Navigate to edit page
    alert('Fonctionnalité d\'édition à implémenter');
  }

  showContact(product: Product) {
    this.selectedProduct = product;
    this.showContactModal = true;
  }

  closeContactModal() {
    this.selectedProduct = null;
    this.showContactModal = false;
  }

  goBack() {
    this.router.navigate(['/products']);
  }
}
