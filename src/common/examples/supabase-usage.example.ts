/**
 * Exemplos de uso do SupabaseService
 * Este arquivo demonstra como utilizar o serviço em outros módulos
 */

import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../modules/database/supabase.service';

@Injectable()
export class ExampleUsageService {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Exemplo: Buscar todos os usuários
   */
  async getAllUsers() {
    const client = this.supabaseService.getClient();
    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('deleted_at', null);

    if (error) throw error;
    return data;
  }

  /**
   * Exemplo: Criar um novo fornecedor
   */
  async createSupplier(supplierData: { name: string; cnpj: string }) {
    const client = this.supabaseService.getClient();
    const { data, error } = await client
      .from('suppliers')
      .insert(supplierData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Exemplo: Usar transação
   */
  async createProductWithLog(productData: any, userId: string) {
    return this.supabaseService.transaction(async (client) => {
      // Criar produto
      const { data: product, error: productError } = await client
        .from('products')
        .insert(productData)
        .select()
        .single();

      if (productError) throw productError;

      // Criar log da ação
      const { error: logError } = await client
        .from('product_logs')
        .insert({
          product_id: product.id,
          action: 'CREATE',
          new_values: productData,
          responsible_user_id: userId,
        });

      if (logError) throw logError;

      return product;
    });
  }
}
