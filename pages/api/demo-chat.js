// Demo API endpoint that doesn't require OpenAI credits
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Get the last user message
    const lastUserMessage = messages.find(msg => msg.role === 'user');
    if (!lastUserMessage) {
      return res.status(400).json({ error: 'No user message found' });
    }

    const userMessage = lastUserMessage.content.toLowerCase();

    // Generate mock responses based on common questions
    let reply = "Hello! I'm a demo AI assistant. This is a sample response to show how the AI platform works. ";
    
    if (userMessage.includes('hello') || userMessage.includes('hi')) {
      reply += "Nice to meet you! I'm here to help with your questions. Try asking me about anything - from coding to creative writing to problem solving.";
    } else if (userMessage.includes('what') && userMessage.includes('ai')) {
      reply += "AI (Artificial Intelligence) is technology that enables computers to perform tasks that typically require human intelligence, like understanding language, recognizing patterns, and making decisions.";
    } else if (userMessage.includes('how') && userMessage.includes('work')) {
      reply += "I work by processing your input, understanding the context, and generating relevant responses using advanced language models trained on vast amounts of text data.";
    } else if (userMessage.includes('help') || userMessage.includes('assist')) {
      reply += "I'd be happy to help! I can assist with explanations, creative writing, problem solving, coding questions, and much more. What would you like to know?";
    } else if (userMessage.includes('weather') || userMessage.includes('time')) {
      reply += "I don't have access to real-time data in this demo, but I can help you understand concepts, write content, solve problems, or have a conversation about almost any topic!";
    } else {
      reply += "That's an interesting question! In the full version, I'd provide a detailed, personalized response. For now, this demo shows the basic interaction. Sign up to experience the full AI capabilities!";
    }

    reply += "\n\n💡 This is a demo response. Sign up for unlimited access to real AI conversations!";

    return res.status(200).json({ 
      reply,
      usage: { 
        prompt_tokens: userMessage.length,
        completion_tokens: reply.length,
        total_tokens: userMessage.length + reply.length
      }
    });

  } catch (error) {
    console.error('Error in demo chat API:', error);
    return res.status(500).json({ 
      error: 'Demo temporarily unavailable',
      details: error.message 
    });
  }
}
