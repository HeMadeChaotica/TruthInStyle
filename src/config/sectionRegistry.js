export const SECTION_REGISTRY = [
  { key: 'opening', path: '/opening', title: 'CHAOTICA', nav: false },
  { key: 'control.panel', path: '/control-panel', title: 'CONTROL.PANEL', nav: true },
  { key: 'the.assurer', path: '/the-assurer', title: 'THE.ASSURER', nav: false, home: true },
  { key: 'the.summation', path: '/the-summation', title: 'THE.SUMMATION', nav: true },
  { key: 'hopewood', path: '/hopewood', title: 'HOPEWOOD', nav: true },
  { key: 'remember.me', path: '/remember-me', title: 'REMEMBER.ME', nav: true },
  { key: '525,600', path: '/525-600', title: '525,600', nav: true },
  { key: 'clock.it', path: '/clock-it', title: 'CLOCK.IT', nav: true },
  { key: 'thicc.fitt', path: '/thicc-fitt', title: 'THICC.FITT', nav: true },
  { key: 'da.eater', path: '/da-eater', title: 'DA.EATER', nav: true },
  { key: 'the.work', path: '/the-work', title: 'THE WORK', nav: true }
];

export const CONTROL_PANEL_ORDER = [
  'day changer',
  'home',
  'back',
  'the.summation',
  'hopewood',
  'thicc.fitt',
  'da.eater',
  'remember.me',
  '525,600',
  'clock.it',
  'the work'
];

export const ROUTE_MAP = {
  '/': 'opening',
  '/opening': 'opening',
  '/the-assurer': 'the.assurer',
  '/the-summation': 'the.summation',
  '/hopewood': 'hopewood',
  '/remember-me': 'remember.me',
  '/525-600': '525,600',
  '/clock-it': 'clock.it',
  '/thicc-fitt': 'thicc.fitt',
  '/da-eater': 'da.eater',
  '/the-work': 'the.work'
};
