
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export const sendChatMessage = async (message, sessionId = 'default') => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        sessionId
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      role: 'assistant',
      content: data.message?.content || 'Sorry, I encountered an error processing your request.',
      timestamp: data.message?.timestamp || new Date().toISOString(),
      metadata: data.message?.metadata || {},
      products: data.products || []
    };
  } catch (error) {
    console.error('API Error:', error);
    throw new Error(`Failed to get AI response: ${error.message}`);
  }
};

export const checkHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
};
