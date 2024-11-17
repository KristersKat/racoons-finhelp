"use client";
import { useState } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";

// Define the validation schema for each question type
const questionSchemas = {
  age: z.string().min(1, "Age is required").max(99, "Are you sure you're that old?").regex(/^\d+$/, "No shananigans"),
  income: z.string().min(1, "Income is required").regex(/^\$?\d+(?:,\d{3})*(?:\.\d{2})?$/, "Must be a valid currency amount"),
  expenses: z.string().min(1, "Expenses are required").regex(/^\$?\d+(?:,\d{3})*(?:\.\d{2})?$/, "Must be a valid currency amount"),
  assets: z.string().min(1, "Assets information is required"),
  debts: z.string().min(1, "Debt information is required"),
  goals: z.string().min(10, "Please provide more detail about your financial goals"),
  riskTolerance: z.string().min(1, "Risk tolerance is required")
};

const questions = [
  {
    id: "age",
    text: "What is your age? (e.g., 22)",
    validation: questionSchemas.age,
  },
  {
    id: "income",
    text: "What is your annual income? (e.g., €12,000)",
    validation: questionSchemas.income,
  },
  {
    id: "expenses",
    text: "What are your monthly expenses? (e.g., €800)",
    validation: questionSchemas.expenses,
  },
  {
    id: "assets",
    text: "What are your current assets? (e.g., Cash: €2,000, Stocks: €1,000, Other Assets (Phone) €1,000)",
    validation: questionSchemas.assets,
  },
  {
    id: "debts",
    text: "What are your current debts? (e.g., Student Loans: €10,000)",
    validation: questionSchemas.debts,
  },
  {
    id: "goals",
    text: "What are your financial goals? (e.g., Buy a house in 20 years, Retire at 60)",
    validation: questionSchemas.goals,
  },
  {
    id: "riskTolerance",
    text: "What is your risk tolerance? (e.g., Moderate)",
    prompt: "On a scale from 'piggy bank' to 'crypto YOLO' 🎲",
    validation: questionSchemas.riskTolerance,
  },
];

// Create the form schema based on the current question
function createFormSchema(questionIndex: number) {
  return z.object({
    answer: questions[questionIndex].validation,
  });
}

type FormData = {
  answer: string;
};

export default function Home() {
  const [response, setResponse] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>(Array(questions.length).fill(""));
  const [additionalQuestion, setAdditionalQuestion] = useState<string>("");
  const [additionalResponse, setAdditionalResponse] = useState<string | null>(null);
  const [isAdditionalLoading, setIsAdditionalLoading] = useState<boolean>(false)

  const form = useForm<FormData>({
    resolver: zodResolver(createFormSchema(currentQuestionIndex)),
    defaultValues: {
      answer: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = data.answer;
    setAnswers(newAnswers);
    form.reset();

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      await generateAnswer(newAnswers);
    }
  };

  const generateAnswer = async (finalAnswers: string[]) => {
    setResponse("Loading...");
    const userInput = finalAnswers.join(", ");
    try {
      const res = await fetch('/api/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userInput }),
      });

      if (!res.ok) throw new Error("Failed to generate answer");
      
      const data = await res.json();
      setResponse(data.text);
    } catch (error) {
      console.error("Error generating answer:", error);
      console.log(response);
      setResponse("Sorry, there was an error generating your financial advice. Please try again.");
    }
  };

  const handleAdditionalQuestionSubmit = async () => {
    setIsAdditionalLoading(true)
    if (!additionalQuestion.trim()) return;

    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: additionalQuestion, financial_plan: response }),
      });

      if (!res.ok) throw new Error("Failed to generate additional advice");

      const data = await res.json();
      setAdditionalResponse(data.text);
      setIsAdditionalLoading(false)
      setAdditionalQuestion("");
    } catch (error) {
      console.error("Error generating additional advice:", error);
    }
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Financial Advisor AI</CardTitle>
          <CardDescription>
            Answer a few questions to get personalized financial advice
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {currentQuestionIndex < questions.length && !response && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="answer"
                  render={({ field }) => (
                    <FormItem>
                      <p className="text-lg font-medium mb-2">
                        {questions[currentQuestionIndex].text}
                      </p>
                      <p className="text-sm text-muted-foreground mb-4 italic">
                        {questions[currentQuestionIndex].prompt}
                      </p>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Type your answer..."
                          className="flex-1"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </div>
                  <Button type="submit">
                    {currentQuestionIndex === questions.length - 1 ? "Submit" : "Next"}
                  </Button>
                </div>
              </form>
            </Form>
          )}

          {response && (
            <div className="space-y-6">
              <div className="prose dark:prose-invert max-w-none">
                <ReactMarkdown 
                  children={response} 
                  remarkPlugins={[remarkGfm]}
                />
              </div>
              
              {response != "Loading..." && (
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={additionalQuestion}
                    onChange={(e) => setAdditionalQuestion(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault(); // Prevents form submission if this input is inside a form
                        handleAdditionalQuestionSubmit();
                      }
                    }}
                    placeholder="Ask follow-up questions..."
                    className="flex-1"
                  />
                  <Button onClick={handleAdditionalQuestionSubmit}>
                    Ask
                  </Button>
                </div>
              )}
              <div className="mt-4">
                {isAdditionalLoading ? (
                    <p>Loading...</p>
                  ) : (
                    additionalResponse && (
                      <ReactMarkdown 
                        children={additionalResponse} 
                        remarkPlugins={[remarkGfm]}
                      />
                  )
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}