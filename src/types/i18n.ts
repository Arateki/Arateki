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
  faq: { title: string; items: { q: string; a: string }[] };
  footer: { rights: string; contact: string; address: string; social: string };
  checkout: {
    backToStore: string;
    steps: [string, string, string];
    contact: { title: string; subtitle: string; name: string; email: string; phone: string; next: string };
    delivery: { title: string; subtitle: string; cep: string; street: string; number: string; complement: string; neighborhood: string; city: string; state: string; shippingLabel: string; next: string; back: string };
    payment: { title: string; subtitle: string; pix: string; pixDesc: string; card: string; cardDesc: string; pixInfo: string; cardInfo: string; confirm: string; processing: string; back: string };
    summary: { title: string; qty: string; subtotal: string; shipping: string; total: string };
    confirmation: { title: string; emailSent: string; orderNumber: string; trackingInfo: string; continueShopping: string };
  };
};
