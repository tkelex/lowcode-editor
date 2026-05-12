export function createRuntimeHarness(overrides = {}) {
  const messages = [];
  const navigations = [];
  const confirmations = [];
  const componentCalls = [];
  const propsUpdates = [];
  const stylesUpdates = [];
  const errors = [];
  const context = {
    component: {
      id: 1,
      name: 'Button',
      props: {},
      desc: '按钮',
    },
    eventName: 'click',
    eventData: {},
    args: ['native-event'],
    components: [],
    componentRefs: {
      2: {
        open: (...args) => componentCalls.push(args),
      },
    },
    allowCustomJS: false,
    getAuthToken: () => 'current-token',
    updateComponentProps: (componentId, props) => propsUpdates.push({ componentId, props }),
    updateComponentStyles: (componentId, styles) => stylesUpdates.push({ componentId, styles }),
    ...overrides.context,
  };
  const adapters = {
    showMessage: (content, type) => messages.push({ content, type }),
    navigate: (url, options) => navigations.push({ url, options }),
    showConfirm: (options) => confirmations.push(options),
    onError: (error) => errors.push(error),
    normalizeHttpUrlOptions: {
      apiBaseUrl: 'http://localhost:3000/api',
    },
    ...overrides.adapters,
  };

  return {
    adapters,
    componentCalls,
    confirmations,
    context,
    errors,
    messages,
    navigations,
    propsUpdates,
    stylesUpdates,
  };
}
