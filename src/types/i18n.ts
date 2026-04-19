import React from 'react';

export type TranslationType = {
  nav: { manifesto: string; product: string; network: string; waitlist: string; faq: string; contact: string };
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
};
