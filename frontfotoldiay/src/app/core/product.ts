import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

export interface Product {
  id: string;
  title: string;
  description: string;
  priceCfa?: number;
  sellerId: string;
  seller: {
    id: string;
    email: string;
    username?: string;
    displayName?: string;
    phone?: string;
  };
  status: 'EN_ATTENTE' | 'VALIDE' | 'REJETE' | 'VENDU' | 'SUPPRIME';
  isVip: boolean;
  vipUntil?: string;
  photos: Photo[];
  views: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  expiresAt?: string;
  lastRepublishAt?: string;
}

export interface Photo {
  id: string;
  productId: string;
  url: string;
  filename: string;
  mimeType?: string;
  size?: number;
  capturedWithCamera: boolean;
  createdAt: string;
}

export interface CreateProductData {
  title: string;
  description: string;
  priceCfa?: number;
  photoFile?: File;
}

export interface UpdateProductData {
  title?: string;
  description?: string;
  priceCfa?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  constructor(private apiService: ApiService) {}

  async getProducts(filters?: { status?: string; isVip?: boolean; sellerId?: string }): Promise<Product[]> {
    let url = '/products';
    if (filters) {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.isVip !== undefined) params.append('isVip', filters.isVip.toString());
      if (filters.sellerId) params.append('sellerId', filters.sellerId);
      if (params.toString()) url += '?' + params.toString();
    }
    return this.apiService.get<Product[]>(url);
  }

  async getProductById(id: string): Promise<Product> {
    return this.apiService.get<Product>(`/products/${id}`);
  }

  async createProduct(data: CreateProductData): Promise<Product> {
    if (data.photoFile) {
      // Send as FormData for file upload
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      if (data.priceCfa !== undefined) {
        formData.append('priceCfa', data.priceCfa.toString());
      }
      formData.append('photo', data.photoFile);

      // Don't override headers, let apiService set Authorization
      return this.apiService.post<Product>('/products', formData, {
        skipRedirectOn401: true
      });
    } else {
      // Fallback to JSON if no photo (though photo should be required)
      return this.apiService.post<Product>('/products', {
        title: data.title,
        description: data.description,
        priceCfa: data.priceCfa
      }, { skipRedirectOn401: true });
    }
  }

  async updateProduct(id: string, data: UpdateProductData): Promise<Product> {
    return this.apiService.put<Product>(`/products/${id}`, data);
  }

  async deleteProduct(id: string): Promise<void> {
    return this.apiService.delete<void>(`/products/${id}`);
  }

  async republishProduct(id: string): Promise<Product> {
    return this.apiService.patch<Product>(`/products/${id}/republish`);
  }

  async updateProductStatus(id: string, status: string, reason?: string): Promise<Product> {
    return this.apiService.patch<Product>(`/products/${id}/status`, { status, reason });
  }

  async setVip(id: string, isVip: boolean): Promise<Product> {
    return this.apiService.patch<Product>(`/products/${id}/vip`, { isVip });
  }

  async markAsSold(id: string): Promise<Product> {
    return this.apiService.patch<Product>(`/products/${id}/sell`);
  }

  async getProductPhotos(productId: string): Promise<Photo[]> {
    return this.apiService.get<Photo[]>(`/products/${productId}/photos`);
  }

  async uploadPhoto(productId: string, file: File): Promise<Photo> {
    return this.apiService.uploadFile<Photo>(`/products/${productId}/photos`, file, undefined, { skipRedirectOn401: true });
  }

  async deletePhoto(photoId: string): Promise<void> {
    return this.apiService.delete<void>(`/photos/${photoId}`);
  }
}
