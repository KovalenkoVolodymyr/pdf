import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { QUESTIONS } from "@/types/questions";
import type { AIResponse, UserAnswers } from "@/types/questions";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const PROMPT = `I want you to read through the attached architectural plan, and provide me yes or no answers to the following questions. For each answer, provide a detailed reasoning (300-500 characters) that includes specific references to the plan and technical details supporting your answer.

Questions:
${QUESTIONS.map((q, i) => `${i}. ${q}`).join("\n")}

Please respond ONLY with valid JSON in the following format (use question numbers as keys):
{
  "0": {"answer": "yes", "reasoning": "detailed explanation with specific references"},
  "1": {"answer": "no", "reasoning": "detailed explanation with specific references"},
  "2": {"answer": "yes", "reasoning": "detailed explanation with specific references"}
}

IMPORTANT:
- Use numbers 0-7 as keys, matching the question numbers above
- Each reasoning should be 300-500 characters long
- Include specific details from the plan to support your answer`;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const pdfFile = formData.get("pdf") as File;
    const userAnswersString = formData.get("userAnswers") as string;

    if (!pdfFile) {
      return NextResponse.json(
        { error: "No PDF file provided" },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Service not properly configured. Please contact support." },
        { status: 500 }
      );
    }

    const userAnswers: UserAnswers = JSON.parse(userAnswersString);

    let file;
    let response;

    try {
      // Upload the PDF file to OpenAI
      file = await openai.files.create({
        file: pdfFile,
        purpose: "user_data",
      });
    } catch (uploadError) {
      console.error("Error uploading file:", uploadError);

      const error = uploadError as { status?: number; code?: string; message?: string };

      if (error?.status === 429 || error?.code === "insufficient_quota") {
        return NextResponse.json(
          {
            error: "Service quota exceeded. Please try again later or contact support.",
            errorType: "quota_exceeded"
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        {
          error: error?.message || "Failed to upload file. Please try again.",
          errorType: "upload_error"
        },
        { status: 500 }
      );
    }

    try {
      // Send request to OpenAI with the uploaded file
      response = await openai.responses.create({
        model: "gpt-4o",
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_file",
                file_id: file.id,
              },
              {
                type: "input_text",
                text: PROMPT,
              },
            ],
          },
        ],
      });
    } catch (apiError) {
      console.error("Error calling OpenAI API:", apiError);

      // Clean up file before returning error
      try {
        await openai.files.delete(file.id);
      } catch (deleteError) {
        console.error("Error deleting file after API error:", deleteError);
      }

      const error = apiError as { status?: number; code?: string; message?: string };

      if (error?.status === 429 || error?.code === "insufficient_quota") {
        return NextResponse.json(
          {
            error: "Service quota exceeded. Please try again later or contact support.",
            errorType: "quota_exceeded"
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        {
          error: error?.message || "Failed to analyze PDF. Please try again.",
          errorType: "api_error"
        },
        { status: 500 }
      );
    }

    // Parse the AI response
    let aiAnswers: AIResponse;
    try {
      // Extract JSON from the response
      const outputText = response.output_text || "";
      const jsonMatch = outputText.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        aiAnswers = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No valid JSON found in response");
      }
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);

      // Clean up file before returning error
      try {
        await openai.files.delete(file.id);
      } catch (deleteError) {
        console.error("Error deleting file after parse error:", deleteError);
      }

      return NextResponse.json(
        {
          error: "Failed to parse AI response. Please try again.",
          errorType: "parse_error"
        },
        { status: 500 }
      );
    }

    // Clean up: delete the uploaded file
    try {
      await openai.files.delete(file.id);
    } catch (deleteError) {
      console.error("Error deleting file:", deleteError);
      // Continue even if deletion fails
    }

    return NextResponse.json({
      userAnswers,
      aiAnswers,
    });
  } catch (error) {
    console.error("Error in validate API:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
