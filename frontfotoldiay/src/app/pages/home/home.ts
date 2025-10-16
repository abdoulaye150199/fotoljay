import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ProductService, Product } from '../../core/product';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [RouterModule, CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {
  products: Product[] = [];
  isLoading = false;
  errorMessage = '';

  constructor(private productService: ProductService) {}

  async ngOnInit() {
    await this.loadProducts();
  }

  async loadProducts() {
    this.isLoading = true;
    this.errorMessage = '';
    try {
      // Only show validated products on homepage
      const validatedProducts = await this.productService.getProducts({ status: 'VALIDE' });
      // Take first 8 validated products for display
      this.products = validatedProducts.slice(0, 8);
    } catch (error) {
      this.errorMessage = 'Erreur lors du chargement des produits';
      console.error('Error loading products:', error);
    } finally {
      this.isLoading = false;
    }
  }
}
