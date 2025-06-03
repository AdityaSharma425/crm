const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper function to clean response text
const cleanResponseText = (text) => {
  // Remove markdown code block formatting
  return text.replace(/```json\n?|\n?```/g, '').trim();
};

// Convert natural language to rules
const naturalLanguageToRules = async (prompt) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const result = await model.generateContent(
      `You are a CRM expert that converts natural language descriptions into customer segment rules. 
      Convert this description into segment rules in JSON format. The response should be a valid JSON object with the following structure:
      {
        "rules": [
          {
            "field": "fieldName",
            "operator": "operatorName",
            "value": "value"
          }
        ],
        "ruleLogic": "AND"
      }
      
      Available fields are: name, email, phone, totalSpent, visitCount, tags
      Available operators are: equals, not_equals, contains, not_contains, greater_than, less_than, in, not_in
      
      Description to convert: ${prompt}`
    );
    
    const response = await result.response;
    const text = response.text();
    // console.log('Raw AI Response:', text); // Debug log
    const cleanedText = cleanResponseText(text);
    // console.log('Cleaned Response:', cleanedText); // Debug log
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error('Error in naturalLanguageToRules:', error);
    console.error('Error details:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.data);
    }
    throw error;
  }
};

// Generate message suggestions
const generateMessageSuggestions = async (campaignObjective, audienceDescription) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const result = await model.generateContent(
      `You are a marketing expert that generates personalized message suggestions for customer campaigns. 
      Generate 3 message suggestions for a campaign with objective: "${campaignObjective}" targeting audience: "${audienceDescription}". 
      Return the suggestions in JSON format with the following structure:
      {
        "messages": [
          "message1",
          "message2",
          "message3"
        ]
      }`
    );
    
    const response = await result.response;
    const text = response.text();
    console.log('Raw AI Response:', text); // Debug log
    const cleanedText = cleanResponseText(text);
    console.log('Cleaned Response:', cleanedText); // Debug log
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error('Error in generateMessageSuggestions:', error);
    console.error('Error details:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.data);
    }
    throw error;
  }
};


module.exports = {
  naturalLanguageToRules,
  generateMessageSuggestions,
}; 