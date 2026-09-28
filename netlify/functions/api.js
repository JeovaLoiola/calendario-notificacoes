const serverless = require('serverless-http');
const app = require('../../server/app');

const serverlessHandler = serverless(app, {
  provider: 'aws',
  binary: ['image/*', 'application/pdf', 'application/octet-stream']
});

module.exports.handler = async (event, context) => {
  // Impede que timers ou conexões residuais travem a resposta Lambda/Netlify com erro 502
  context.callbackWaitsForEmptyEventLoop = false;
  return serverlessHandler(event, context);
};
