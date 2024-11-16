"use client";
import { useState, useEffect } from "react"; // Keep this import
import ReactMarkdown from 'react-markdown'; // Add this import for rendering markdown
import { remark } from 'remark'; // Add this import for processing markdown
import remarkGfm from 'remark-gfm'; // Add this import for GitHub Flavored Markdown (GFM) support

const questions = [
  "What is your age? (e.g., 25)",
  "What is your annual income? (e.g., $50,000)",
  "What are your monthly expenses? (e.g., $2,500)",
  "What are your current assets? (e.g., Savings: $5,000, Checking: $2,000)",
  "What are your current debts? (e.g., Student Loans: $20,000)",
  "What are your financial goals? (e.g., Buy a house in 5 years, Retire at 65)",
  "What is your risk tolerance? (e.g., Moderate)",
];

export default function Home() {
  const [response, setResponse] = useState<string | null>(null); // State to hold the response
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0); // State for current question index
  const [answers, setAnswers] = useState<string[]>(Array(questions.length).fill("")); // State to hold answers
  const [inputValue, setInputValue] = useState<string>(""); // State for input value
  const [additionalQuestion, setAdditionalQuestion] = useState<string>(""); // State for additional question input

  const handleNext = () => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = inputValue; // Save the current input value
    setAnswers(newAnswers);
    setInputValue(""); // Clear the input field
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      generateAnswer();
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value); // Update input value state
  };

  const handleInputKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleNext(); // Call handleNext when Enter is pressed
    }
  };

  const generateAnswer = async () => {
    setResponse("Loading..."); // Clear the response and show loading text
    const userInput = answers.join(", "); // Combine answers into a single prompt
    const res = await fetch('/api/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: userInput }),
    });

    if (res.ok) {
      const data = await res.json();
      setResponse(data.text); // Set the response from the API
    } else {
      console.error("Error generating answer");
    }
  };

  const handleAdditionalQuestionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAdditionalQuestion(event.target.value); // Update additional question state
  };

  const handleAdditionalQuestionSubmit = async () => {
    // Logic to handle the additional question submission
    const res = await fetch('/api/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: additionalQuestion }),
    });

    if (res.ok) {
      const data = await res.json();
      setResponse(data.text); // Update response with additional advice
      setAdditionalQuestion(""); // Clear the additional question input
    } else {
      console.error("Error generating additional advice");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      {currentQuestionIndex < questions.length - 1 ? (
        <div>
          <p>{questions[currentQuestionIndex]}</p>
          <input 
            type="text" 
            onChange={handleInputChange} 
            onKeyPress={handleInputKeyPress} // Add key press handler
            value={inputValue} // Bind input value to state
            className="border border-gray-300 rounded p-2 text-black" // Add styling for input
          />
          <button 
            onClick={handleNext} 
            className="mt-2 bg-blue-500 text-white rounded p-2 hover:bg-blue-600" // Match submit button styling
          >
            Next
          </button>
        </div>
      ) : (
        <div>
          {/* Conditionally render the submit button */}
          {response === null && (
            <button 
              onClick={generateAnswer} 
              className="mt-2 bg-blue-500 text-white rounded p-2 hover:bg-blue-600"
            >
              Submit
            </button>
          )}
        </div>
      )}
      
      {response && (
        <div className="flex items-center justify-center min-h-screen">
          <div className="mt-4 p-6 rounded-lg shadow-md max-w-2xl w-full">
            <ReactMarkdown 
              children={response} 
              remarkPlugins={[remarkGfm]} // Enable GFM for tables
              components={{
                p: ({ children }) => <p style={{ margin: '1em 0' }}>{children}</p>, // Custom paragraph styling
              }}
            /> {/* Render the response as markdown with table support */}
          </div>
        </div>
      )}

      {/* New input field for additional questions */}
      {response && (
        <div className="mt-4">
          <input 
            type="text" 
            value={additionalQuestion} 
            onChange={handleAdditionalQuestionChange} 
            placeholder="Ask additional questions..." 
            className="border border-gray-300 rounded p-2 text-black" // Add styling for input
          />
          <button 
            onClick={handleAdditionalQuestionSubmit} 
            className="mt-2 bg-blue-500 text-white rounded p-2 hover:bg-blue-600"
          >
            Ask
          </button>
        </div>
      )}
    </div>
  );
}