import type { Product, ProductRepository } from '../domain/product.js';

export class GetAdminProductUseCase {
  constructor(private readonly products: ProductRepository) {}

  async execute(id: string): Promise<Product | null> {
    return this.products.findById(id);
  }
}
