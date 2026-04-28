import type { Product, ProductInput, ProductRepository } from '../domain/product.js';

export class CreateProductUseCase {
  constructor(private readonly products: ProductRepository) {}

  execute(input: ProductInput): Promise<Product> {
    return this.products.create(input);
  }
}
