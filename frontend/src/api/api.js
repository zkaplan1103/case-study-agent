
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
    
    // Console logging for chatbot reasoning analysis
    console.group('ChatBot Response Analysis');
    console.log('Response Content:', data.message?.content);
    
    if (data.reasoning && data.reasoning.length > 0) {
      console.group('Reasoning Process');
      data.reasoning.forEach((step, index) => {
        console.log(`Step ${index + 1}:`, step.content);
        if (step.tool) {
          console.log(`  Tool Used: ${step.tool}`);
        }
      });
      console.groupEnd();
    }
    
    if (data.message?.metadata?.toolsUsed && data.message.metadata.toolsUsed.length > 0) {
      console.log('Tools Used:', data.message.metadata.toolsUsed.join(', '));
    }
    
    if (data.message?.metadata?.reasoning && data.message.metadata.reasoning.length > 0) {
      console.group('Metadata Reasoning');
      data.message.metadata.reasoning.forEach((reason, index) => {
        console.log(`${index + 1}. ${reason}`);
      });
      console.groupEnd();
    }
    
    if (data.products && data.products.length > 0) {
      console.log('Products Found:', data.products.length);
      console.log('Product Details:', data.products);
    }
    
    if (data.error) {
      console.warn('Response Error:', data.error);
    }
    
    console.log('Full Response Data:', data);
    console.groupEnd();
    
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
