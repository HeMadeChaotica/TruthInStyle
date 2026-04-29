export const SECTION_REGISTRY = [
  { key: 'the.assurer', path: '/the-assurer', title: 'THE.ASSURER', home: true, hasEye: true, eyeActive: true },
  { key: 'the.summation', path: '/the-summation', title: 'THE.SUMMATION', hasEye: true, eyeActive: false },
  { key: 'hopewood', path: '/hopewood', title: 'HOPEWOOD', hasEye: true, eyeActive: false },
  { key: 'remember.me', path: '/remember-me', title: 'REMEMBER.ME', hasEye: true, eyeActive: false },
  { key: '525,600', path: '/525600', title: '525,600', hasEye: true, eyeActive: false },
  { key: 'clock.it', path: '/clock-it', title: 'CLOCK.IT', hasEye: true, eyeActive: false },
  { key: 'thicc.fitt', path: '/thicc-fitt', title: 'THICC.FITT', hasEye: true, eyeActive: false },
  { key: 'its.getting.THICC', path: '/its-getting-thicc', title: 'ITS.GETTING.THICC', hasEye: false, eyeActive: false },
  { key: 'da.eater', path: '/da-eater', title: 'DA.EATER', hasEye: true, eyeActive: false },
  { key: 'the.work', path: '/the-work', title: 'THE.WORK', hasEye: true, eyeActive: false }
];

export const ROUTE_MAP = SECTION_REGISTRY.reduce((acc, section) => {
  acc[section.path] = section;
  return acc;
}, { '/': { key: 'opening', path: '/', title: 'CHAOTICA' } });

export const CONTROL_PANEL_ORDER = [
  'control-day-changer',
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
