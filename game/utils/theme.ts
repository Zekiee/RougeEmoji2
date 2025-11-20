export const COLORS = {
  // Vibrant "Nintendo-like" Palette
  primary: 0xe60012, // Nintendo Red
  primaryDark: 0xbf000f,
  
  secondary: 0x00b4d8, // Cyan/Blue
  secondaryDark: 0x0077b6,
  
  success: 0x2ec4b6, // Teal/Green
  successDark: 0x208b81,
  
  warning: 0xffba08, // Golden Yellow
  warningDark: 0xf48c06,
  
  danger: 0xff4d6d, // Pinkish Red
  dangerDark: 0xc9184a,

  dark: 0x2b2d42, // Dark Blue-Grey
  light: 0xf8f9fa, // Off-white
  
  white: 0xffffff,
  black: 0x000000,
  
  // Game Specific
  energy: 0xff9f1c, // Orange
  block: 0x48cae4, // Light Blue
  
  text: {
    main: '#2b2d42',
    light: '#f8f9fa',
    muted: '#8d99ae',
    highlight: '#e60012'
  },

  card: {
    bg: 0xffffff,
    border: 0xe5e5e5,
  },
  
  ui: {
      panelBg: 0xffffff,
      shadow: 0x8d99ae
  }
};

export const TEXT_STYLES = {
  title: { fontFamily: 'Nunito', fontSize: '64px', fontStyle: '900', color: COLORS.text.main },
  heading: { fontFamily: 'Nunito', fontSize: '32px', fontStyle: '900', color: COLORS.text.main },
  body: { fontFamily: 'Nunito', fontSize: '18px', fontStyle: 'bold', color: COLORS.text.main },
  
  // Specifics
  buttonText: { fontFamily: 'Nunito', fontSize: '24px', fontStyle: '900', color: '#ffffff' },
  cardName: { fontFamily: 'Nunito', fontSize: '18px', fontStyle: '900', color: '#2b2d42' },
  cardDesc: { fontFamily: 'Nunito', fontSize: '14px', fontStyle: 'bold', color: '#6c757d' },
};
