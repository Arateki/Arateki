import type { ProductListOptions, ProductRepository, ProductView } from '../domain/product.js';
import { toProductView } from '../domain/product.js';

export class ListProductsUseCase {
  constructor(private readonly products: ProductRepository) {}

  async execute(options: ProductListOptions): Promise<ProductView[]> {
    const products = await this.products.listActive();
    return products.map(product => toProductView(product, options));
  }
}
