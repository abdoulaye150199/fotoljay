import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProductService, Product } from '../../../core/product';
import { AuthService } from '../../../core/auth';

@Component({
  selector: 'app-product-list',
  imports: [CommonModule],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css'
})
export class ProductList implements OnInit {
  products: Product[] = [];
  approvedProducts: Product[] = [];
  sellerProducts: Product[] = [];
  isLoading = false;
  errorMessage = '';
  showApprovedProductsModal = false;
  isLoadingApprovedProducts = false;
  showSellerProductsModal = false;
  isLoadingSellerProducts = false;
  selectedProduct: Product | null = null;
  showContactModal: boolean = false;

  showContact(product: Product) {
    this.selectedProduct = product;
    this.showContactModal = true;
  }

  closeContactModal() {
    this.selectedProduct = null;
    this.showContactModal = false;
  }

  constructor(
    private productService: ProductService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadProducts();
  }

  async loadProducts() {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      // If user is authenticated and is a seller, show only their products
      // Otherwise show all validated products
      const currentUser = this.authService.currentUser;
      if (currentUser && this.authService.hasRole('VENDEUR')) {
        // Show only seller's products
        this.products = await this.productService.getProducts({ sellerId: currentUser.id });
      } else {
        // Show all validated products for buyers and non-authenticated users
        this.products = await this.productService.getProducts({ status: 'VALIDE' });
      }
    } catch (error: any) {
      this.errorMessage = error.message || 'Erreur lors du chargement des produits.';
    } finally {
      this.isLoading = false;
    }
  }

  viewProduct(product: Product) {
    this.router.navigate(['/products', product.id]);
  }

  canEdit(product: Product): boolean {
    const currentUser = this.authService.currentUser;
    return currentUser?.id === product.sellerId || this.authService.hasRole('ADMIN');
  }

  canDelete(product: Product): boolean {
    const currentUser = this.authService.currentUser;
    return currentUser?.id === product.sellerId || this.authService.hasRole('ADMIN');
  }

  async deleteProduct(product: Product) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      return;
    }

    try {
      await this.productService.deleteProduct(product.id);
      this.products = this.products.filter(p => p.id !== product.id);
    } catch (error: any) {
      alert('Erreur lors de la suppression: ' + error.message);
    }
  }

  editProduct(product: Product) {
    // TODO: Navigate to edit page or open modal
    alert('Fonctionnalité d\'édition à implémenter');
  }

  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated;
  }

  get canCreateProduct(): boolean {
    return this.authService.isAuthenticated && this.authService.hasAnyRole('VENDEUR', 'ADMIN');
  }

  createProduct() {
    this.router.navigate(['/products/new']);
  }

  async toggleApprovedProductsModal() {
    if (!this.showApprovedProductsModal) {
      // Charger les produits approuvés seulement quand on ouvre la modale
      await this.loadApprovedProducts();
    }
    this.showApprovedProductsModal = !this.showApprovedProductsModal;
  }

  closeApprovedProductsModal() {
    this.showApprovedProductsModal = false;
  }

  async loadApprovedProducts() {
    this.isLoadingApprovedProducts = true;
    try {
      // Charger les produits approuvés (status = VALIDE)
      this.approvedProducts = await this.productService.getProducts({ status: 'VALIDE' });
      console.log('Produits approuvés chargés:', this.approvedProducts);
    } catch (error: any) {
      console.error('Erreur chargement produits approuvés:', error);
      // En cas d'erreur, utiliser les produits déjà chargés filtrés localement
      this.approvedProducts = this.products.filter(p => p.status === 'VALIDE');
    } finally {
      this.isLoadingApprovedProducts = false;
    }
  }

  getValidatedProducts(): Product[] {
    return this.approvedProducts;
  }

  getValidatedCount(): number {
    return this.products.filter(p => p.status === 'VALIDE').length;
  }

  async toggleSellerProductsModal() {
    if (!this.showSellerProductsModal) {
      // Charger les produits du vendeur seulement quand on ouvre la modale
      await this.loadSellerProducts();
    }
    this.showSellerProductsModal = !this.showSellerProductsModal;
  }

  closeSellerProductsModal() {
    this.showSellerProductsModal = false;
  }

  async loadSellerProducts() {
    this.isLoadingSellerProducts = true;
    try {
      const currentUser = this.authService.currentUser;
      if (currentUser) {
        // Charger les produits du vendeur connecté
        this.sellerProducts = await this.productService.getProducts({ sellerId: currentUser.id });
      }
    } catch (error: any) {
      console.error('Erreur chargement produits vendeur:', error);
      // En cas d'erreur, utiliser les produits déjà chargés filtrés localement
      const currentUser = this.authService.currentUser;
      if (currentUser) {
        this.sellerProducts = this.products.filter(p => p.sellerId === currentUser.id);
      }
    } finally {
      this.isLoadingSellerProducts = false;
    }
  }

  getSellerValidatedProducts(): Product[] {
    return this.sellerProducts.filter(p => p.status === 'VALIDE');
  }

  getSellerSoldCount(): number {
    return this.sellerProducts.filter(p => p.status === 'VENDU').length;
  }

  getSellerTotalCount(): number {
    return this.sellerProducts.length;
  }

  async markAsSold(product: Product) {
    try {
      const updatedProduct = await this.productService.markAsSold(product.id);
      // Mettre à jour le produit dans la liste
      const index = this.sellerProducts.findIndex(p => p.id === product.id);
      if (index !== -1) {
        this.sellerProducts[index] = updatedProduct;
      }
      // Recharger les produits pour mettre à jour les compteurs
      await this.loadProducts();
      this.snackBar.open('✅ Produit vendu avec succès', 'Fermer', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['success-snackbar']
      });
    } catch (error: any) {
      this.snackBar.open('Erreur lors du marquage comme vendu: ' + error.message, 'Fermer', {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
      });
    }
  }
}
