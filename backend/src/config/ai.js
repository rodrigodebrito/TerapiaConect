module.exports = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    defaultModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    fallbackModel: process.env.OPENAI_FALLBACK_MODEL || 'gpt-3.5-turbo',
  }
} 