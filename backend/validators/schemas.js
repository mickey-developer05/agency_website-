const schemas = {
  login: {
    email: { type: 'string', required: true, pattern: /^\S+@\S+\.\S+$/ },
    password: { type: 'string', required: true }
  },
  adminLogin: {
    username: { type: 'string', required: true },
    password: { type: 'string', required: true }
  },
  registration: {
    fullName: { type: 'string', required: true, minLength: 2 },
    companyName: { type: 'string', required: true, minLength: 2 },
    email: { type: 'string', required: true, pattern: /^\S+@\S+\.\S+$/ },
    password: { type: 'string', required: true, minLength: 10 },
    confirmPassword: { type: 'string', required: true }
  },
  project: {
    name: { type: 'string', required: true, minLength: 2 },
    client: { type: 'string', required: false },
    stage: { type: 'string', required: false },
    progress: { type: 'number', required: false },
    value: { type: 'number', required: false },
    date: { type: 'string', required: false }
  },
  invoice: {
    amount: { type: 'number', required: true, min: 0 },
    client: { type: 'string', required: true },
    project: { type: 'string', required: true },
    status: { type: 'string', required: false },
    clientEmail: { type: 'string', required: false, pattern: /^\S+@\S+\.\S+$/ }
  },
  client: {
    name: { type: 'string', required: true },
    email: { type: 'string', required: true, pattern: /^\S+@\S+\.\S+$/ },
    company: { type: 'string', required: true }
  },
  aiSettings: {
    provider: { type: 'string', required: false }
  },
  aiGenerate: {
    feature: { type: 'string', required: true }
  },
  settings: {
    agencyName: { type: 'string', required: false }
  },
  meeting: {
    title: { type: 'string', required: true },
    startTime: { type: 'string', required: true },
    description: { type: 'string', required: false }
  }
};

module.exports = schemas;
