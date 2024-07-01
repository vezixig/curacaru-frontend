import { Injectable } from '@angular/core';
import { BaseRepository } from './base.repository';
import { Product } from '@curacaru/models/product';

/**
 * Repository for product related requests
 */
@Injectable({
  providedIn: 'root',
})
export class ProductsRepository extends BaseRepository {
  getProductsList() {
    return this.client.get<Product[]>(`${this.apiUrl}/products`);
  }
}
