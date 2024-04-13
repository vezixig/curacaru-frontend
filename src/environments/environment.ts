export const environment = {
  auth0: {
    domain: 'dev-7tgtetd5qydtostt.eu.auth0.com',
    clientId: '9d7Kn4iWGujaoODgiDwTNN1DzHRZaWPo',
    callbackUri: 'http://localhost:4200',
    authorizationParams: {
      audience: 'https://localhost:7077',
      redirect_uri: 'http://localhost:4200',
    },
    api: {
      serverUrl: 'https://localhost:7077',
    },
  },
  production: false,
  version: 'DEV',
};
