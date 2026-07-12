class ContentService {
  async generate(input = {}) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`[Content Writer Content]\nThis is a simulated marketing campaign content piece. Topic: ${input.topic || 'Advanced Cloud Deployments'}. Audience: B2B Decision Makers. Tone: Professional and Authoritative. Once API keys are connected, this endpoint will generate custom articles and copywriting assets.`);
      }, 1500);
    });
  }
}

module.exports = new ContentService();
