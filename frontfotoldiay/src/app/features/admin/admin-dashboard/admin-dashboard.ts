import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProductService, Product } from '../../../core/product';
import { AuthService } from '../../../core/auth';

@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
export class AdminDashboard implements OnInit {
  products: Product[] = [];
  approvedProducts: Product[] = [];
  isLoading = false;
  errorMessage = '';
  activeTab: 'pending' | 'all' = 'pending';
  showApprovedProductsModal = false;
  isLoadingApprovedProducts = false;

  constructor(
    private productService: ProductService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadProducts();
  }

  async loadProducts() {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      this.products = await this.productService.getProducts();
      console.log('Produits chargés:', this.products);
      console.log('Produits en attente:', this.pendingCount);
    } catch (error: any) {
      this.errorMessage = error.message || 'Erreur lors du chargement des produits.';
      console.error('Erreur chargement produits:', error);
    } finally {
      this.isLoading = false;
    }
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

  get filteredProducts(): Product[] {
    if (this.activeTab === 'pending') {
      return this.products.filter(p => p.status === 'EN_ATTENTE');
    }
    return this.products;
  }

  setActiveTab(tab: 'pending' | 'all') {
    this.activeTab = tab;
  }

  get pendingCount(): number {
    return this.products.filter(p => p.status === 'EN_ATTENTE').length;
  }

  getValidatedCount(): number {
    return this.products.filter(p => p.status === 'VALIDE').length;
  }

  async approveProduct(product: Product) {
    const reason = prompt('Raison de l\'approbation (optionnel) :');
    try {
      await this.productService.updateProductStatus(product.id, 'VALIDE', reason || undefined);
      product.status = 'VALIDE';
      alert('Produit approuvé avec succès !');
    } catch (error: any) {
      alert('Erreur lors de l\'approbation: ' + error.message);
    }
  }

  async rejectProduct(product: Product) {
    const reason = prompt('Raison du rejet (requis) :');
    if (!reason || reason.trim() === '') {
      alert('Une raison est requise pour rejeter un produit.');
      return;
    }
    try {
      await this.productService.updateProductStatus(product.id, 'REJETE', reason);
      product.status = 'REJETE';
      alert('Produit rejeté avec succès !');
    } catch (error: any) {
      alert('Erreur lors du rejet: ' + error.message);
    }
  }

  async setVip(product: Product) {
    const action = product.isVip ? 'retirer le statut VIP' : 'marquer comme VIP';
    if (!confirm(`Êtes-vous sûr de vouloir ${action} ce produit ?`)) {
      return;
    }

    try {
      await this.productService.setVip(product.id, !product.isVip);
      product.isVip = !product.isVip;
      alert(`Produit ${product.isVip ? 'marqué comme VIP' : 'retiré du statut VIP'} avec succès !`);
    } catch (error: any) {
      alert('Erreur lors de la modification VIP: ' + error.message);
    }
  }

  async deleteProduct(product: Product) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer définitivement ce produit ? Cette action est irréversible.')) {
      return;
    }

    try {
      await this.productService.deleteProduct(product.id);
      this.products = this.products.filter(p => p.id !== product.id);
      alert('Produit supprimé avec succès !');
    } catch (error: any) {
      alert('Erreur lors de la suppression: ' + error.message);
    }
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

  getValidatedProducts(): Product[] {
    return this.approvedProducts;
  }

  viewProduct(product: Product) {
    this.closeApprovedProductsModal();
    this.router.navigate(['/products', product.id]);
  }
}
