import type { Product, ProductRepository } from '../domain/product.js';

export class ListAdminProductsUseCase {
  constructor(private readonly products: ProductRepository) {}

  async execute(): Promise<Product[]> {
    return this.products.listAll();
  }
}
