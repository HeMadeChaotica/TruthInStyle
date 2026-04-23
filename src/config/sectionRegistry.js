export const SECTION_REGISTRY = [
  { key: 'control.panel', title: 'CONTROL.PANEL', nav: false },
  { key: 'the.assurer', path: '/the-assurer', title: 'THE.ASSURER', nav: false, home: true },
  { key: 'the.summation', path: '/the-summation', title: 'THE.SUMMATION', nav: true },
  { key: 'hopewood', path: '/hopewood', title: 'HOPEWOOD', nav: true },
  { key: 'remember.me', path: '/remember-me', title: 'REMEMBER.ME', nav: true },
  { key: '525,600', path: '/525600', title: '525,600', nav: true },
  { key: 'clock.it', path: '/clock-it', title: 'CLOCK.IT', nav: true },
  { key: 'thicc.fitt', path: '/thicc-fitt', title: 'THICC.FITT', nav: true },
  { key: 'da.eater', path: '/da-eater', title: 'DA.EATER', nav: true }
];

export const CONTROL_PANEL_ORDER = [
  'control-home',
  'control-back',
  'control-the-summation',
  'control-hopewood',
  'control-thicc-fitt',
  'control-da-eater',
  'control-remember-me',
  'control-525600',
  'control-clock-it',
  'control-the-work'
];

export const ROUTE_MAP = {
  '/': 'opening',
  '/the-assurer': 'the.assurer',
  '/the-summation': 'the.summation',
  '/hopewood': 'hopewood',
  '/remember-me': 'remember.me',
  '/525600': '525,600',
  '/clock-it': 'clock.it',
  '/thicc-fitt': 'thicc.fitt',
  '/da-eater': 'da.eater',
  '/the-work': 'the.work'
};
