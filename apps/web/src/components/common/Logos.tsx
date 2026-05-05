
export const PrimaryLogo = ({ className = "w-64", theme = 'dark' }: { className?: string; theme?: 'light' | 'dark' }) => (
  <img 
    src={theme === 'light' ? '/03_arateki_black.svg' : '/04_arateki_white.svg'} 
    alt="Arateki"
    className={className} 
  />
);

export const HorizontalLogo = ({ className = "w-40", theme = 'dark' }: { className?: string; theme?: 'light' | 'dark' }) => (
  <img 
    src={theme === 'light' ? '/07_arateki_horizontal_black.svg' : '/08_arateki_horizontal_white.svg'} 
    alt="Arateki"
    className={className} 
  />
);
