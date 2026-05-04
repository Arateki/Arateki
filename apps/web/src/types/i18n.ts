import React from 'react';

export type TranslationType = {
  nav: { manifesto: string; product: string; network: string; waitlist: string; faq: string; contact: string; store: string };
  hero: { title: string; subtitle: string; desc: string };
  manifesto: {
    title: string;
    items: { title: string; desc: string; icon: React.ReactNode }[]
  };
  safra: {
    tag: string;
    title: string;
    desc: string;
    features: { title: string; desc: string }[];
    priceLabel: string;
    price: string;
    cta: string
  };
  raiznet: {
    title: string;
    desc: string;
    nodes: { title: string; desc: string }[]
  };
  waitlist: { title: string; desc: string; placeholder: string; button: string; registering: string; successMessage: string };
  faq: { title: string; items: { q: string; a: React.ReactNode }[] };
  footer: { rights: string; contact: string; address: string; social: string };
  store: {
    title: string;
    subtitle: string;
    priceLabel: string;
    buyButton: string;
    addToCart: string;
    outOfStock: string;
    notifyMe: {
      title: string;
      desc: string;
      success: string;
      button: string;
    }
  };
  checkout: {
    backToStore: string;
    steps: [string, string, string];
    contact: { title: string; subtitle: string; name: string; email: string; phone: string; next: string };
    delivery: { title: string; subtitle: string; cep: string; street: string; number: string; complement: string; neighborhood: string; city: string; state: string; shippingLabel: string; next: string; back: string };
    payment: { title: string; subtitle: string; pix: string; pixDesc: string; card: string; cardDesc: string; pixInfo: string; cardInfo: string; confirm: string; processing: string; back: string };
    summary: { title: string; qty: string; subtotal: string; shipping: string; total: string };
    confirmation: { title: string; emailSent: string; orderNumber: string; trackingInfo: string; continueShopping: string };
  };
  admin: {
    common: {
      brand: string;
      selectLanguage: string;
      toggleTheme: string;
      loading: string;
      back: string;
      save: string;
      saving: string;
      edit: string;
      active: string;
      inactive: string;
      empty: string;
      error: string;
    };
    layout: {
      dashboard: string;
      orders: string;
      products: string;
      settings: string;
      logout: string;
      comingSoon: string;
    };
    login: {
      title: string;
      login: string;
      password: string;
      submit: string;
      submitting: string;
      error: string;
    };
    orders: {
      title: string;
      loading: string;
      loadError: string;
      updateError: string;
      updated: string;
      empty: string;
      customer: string;
      date: string;
      status: string;
      total: string;
      statuses: Record<'pending' | 'paid' | 'processing' | 'shipped' | 'cancelled', string>;
    };
    products: {
      title: string;
      loading: string;
      loadError: string;
      empty: string;
      newProduct: string;
      noImage: string;
      sku: string;
    };
    productForm: {
      newTitle: string;
      editTitle: string;
      loading: string;
      loadError: string;
      saveError: string;
      basicInfo: string;
      name: string;
      description: string;
      variants: string;
      addVariant: string;
      sku: string;
      model: string;
      defaultModel: string;
      priceBrl: string;
      priceUsd: string;
      stock: string;
      media: string;
      uploadImage: string;
      fileTooLarge: string;
      imageError: string;
      imageRecommended: string;
      activateProduct: string;
      createProduct: string;
      saveChanges: string;
      previewAlt: string;
    };
  };
};
