import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AdminProductForm from './AdminProductForm';
import { AuthContext } from '../../context/auth';
import { adminProductService, type RawProduct } from '../../services/adminProductService';

const mockProduct: RawProduct = {
  id: 'p1',
  name: { pt: 'Nome PT', en: 'Name EN', es: 'Nombre ES', zh: '名称', ja: '名前' },
  description: { pt: 'Descrição PT', en: 'Description EN', es: 'Descripción ES', zh: '描述', ja: '説明' },
  imageUrl: '',
  variants: [
    { id: 'v1', sku: 'SKU-1', attributes: { modelo: 'Padrão' }, prices: { brlCents: 1000, usdCents: 200 }, stock: 5, active: true },
  ],
  active: true,
};

const renderForm = (initialPath: string) =>
  render(
    <AuthContext.Provider value={{ token: 'test-token', isAuthenticated: true, login: () => {}, logout: async () => {} }}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/manage/products/new" element={<AdminProductForm />} />
          <Route path="/manage/products/:id/edit" element={<AdminProductForm />} />
          <Route path="/manage/products" element={<div>Products List</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );

describe('AdminProductForm', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    localStorage.setItem('arateki-lang', 'pt');
    localStorage.setItem('arateki-theme', 'dark');
  });

  it('renders create mode with empty inputs for all 5 languages and USD price', () => {
    renderForm('/manage/products/new');

    expect(screen.getByRole('heading', { name: /Novo Produto/i })).toBeInTheDocument();

    for (const suf of ['PT', 'EN', 'ES', 'ZH', 'JA']) {
      expect(screen.getByLabelText(`Nome (${suf})`)).toHaveValue('');
      expect(screen.getByLabelText(`Descrição (${suf})`)).toHaveValue('');
    }

    expect(screen.getByLabelText(/Preço USD/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Preço BRL/i)).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /Criar Produto/i })).toBeInTheDocument();
  });

  it('renders edit mode and populates fields from getProduct', async () => {
    vi.spyOn(adminProductService, 'getProduct').mockResolvedValue(mockProduct);

    renderForm('/manage/products/p1/edit');

    expect(screen.getByText(/Carregando formulário/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByLabelText('Nome (PT)')).toHaveValue('Nome PT');
    });

    expect(screen.getByLabelText('Nome (EN)')).toHaveValue('Name EN');
    expect(screen.getByLabelText('Nome (ZH)')).toHaveValue('名称');
    expect(screen.getByLabelText('Descrição (JA)')).toHaveValue('説明');
    expect(screen.getByRole('heading', { name: /Editar Produto/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Salvar Alterações/i })).toBeInTheDocument();
    expect(adminProductService.getProduct).toHaveBeenCalledWith('test-token', 'p1');
  });

  it('submits create with payload covering all 5 languages and USD price', async () => {
    const createSpy = vi.spyOn(adminProductService, 'createProduct').mockResolvedValue(mockProduct);

    renderForm('/manage/products/new');

    for (const suf of ['PT', 'EN', 'ES', 'ZH', 'JA']) {
      fireEvent.change(screen.getByLabelText(`Nome (${suf})`), { target: { value: `N-${suf}` } });
      fireEvent.change(screen.getByLabelText(`Descrição (${suf})`), { target: { value: `Descrição válida ${suf}` } });
    }

    fireEvent.change(screen.getByLabelText('SKU'), { target: { value: 'SKU-NEW' } });
    fireEvent.change(screen.getByLabelText('Modelo'), { target: { value: 'Std' } });
    fireEvent.change(screen.getByLabelText(/Preço BRL/i), { target: { value: '1500' } });
    fireEvent.change(screen.getByLabelText(/Preço USD/i), { target: { value: '300' } });
    fireEvent.change(screen.getByLabelText('Estoque'), { target: { value: '7' } });

    fireEvent.click(screen.getByRole('button', { name: /Criar Produto/i }));

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledTimes(1);
    });

    const payload = createSpy.mock.calls[0]?.[1];
    expect(payload?.name).toEqual({ pt: 'N-PT', en: 'N-EN', es: 'N-ES', zh: 'N-ZH', ja: 'N-JA' });
    expect(payload?.description).toEqual({
      pt: 'Descrição válida PT',
      en: 'Descrição válida EN',
      es: 'Descrição válida ES',
      zh: 'Descrição válida ZH',
      ja: 'Descrição válida JA',
    });
    expect(payload?.variants[0]).toMatchObject({
      sku: 'SKU-NEW',
      attributes: { modelo: 'Std' },
      prices: { brlCents: 1500, usdCents: 300 },
      stock: 7,
    });
  });

  it('shows inline error banner when backend rejects (e.g. description < 2 chars)', async () => {
    vi.spyOn(adminProductService, 'createProduct').mockRejectedValue(new Error('400 description too short'));

    renderForm('/manage/products/new');

    for (const suf of ['PT', 'EN', 'ES', 'ZH', 'JA']) {
      fireEvent.change(screen.getByLabelText(`Nome (${suf})`), { target: { value: 'N' } });
      fireEvent.change(screen.getByLabelText(`Descrição (${suf})`), { target: { value: 'a' } });
    }
    fireEvent.change(screen.getByLabelText('SKU'), { target: { value: 'SKU' } });
    fireEvent.change(screen.getByLabelText('Modelo'), { target: { value: 'M' } });
    fireEvent.change(screen.getByLabelText(/Preço BRL/i), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText(/Preço USD/i), { target: { value: '20' } });
    fireEvent.change(screen.getByLabelText('Estoque'), { target: { value: '1' } });

    fireEvent.click(screen.getByRole('button', { name: /Criar Produto/i }));

    await waitFor(() => {
      expect(screen.getByText(/Erro ao salvar produto/i)).toBeInTheDocument();
    });
  });
});
