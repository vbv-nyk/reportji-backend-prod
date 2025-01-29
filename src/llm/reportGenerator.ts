import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
  SchemaType,
} from "@google/generative-ai";
import util from "util";
import cors from "cors";
import fs from "fs";
import express from "express";
import { reportGeneratorPrompt } from "./reportGeneratorPrompt.js";

// Ensure your API key is correctly set here
const genAI = new GoogleGenerativeAI("AIzaSyDB8bdAUIGfaSXa8raurIdnKJBefFwT230");

function initializeModel() {
  const elementEnumTypeSchema = {
    type: SchemaType.STRING,
    enum: ["0", "1", "2", "3", "4", "5", "6"],
    description: `
            The following are the different tags present in our language.
            case 0:
              return title
            case 1:
              return subtitle;
            case 2:
              return heading;
            case 3:
              return author;
            case 4:
              return date;
            case 5:
              return paragraphs;
            case 6:
              return code;
            case 7:
              return items;
            case 8:
              return figures;
            case 9:
              return citations;
            case ElementType.DIFFERENCES:
              return ;
            case ElementType.INVALID:
              return ;
        `,
  };
  const elementDefinitionSchema = {
    type: SchemaType.OBJECT,
    properties: {
      type: elementEnumTypeSchema,
      content: {
        type: SchemaType.STRING,
        description:
          "The actual content of the section. Should be atleast 300 words when the returned type is paragraphs.",
      },
    },
    required: ["content"],
  };

  const elementType = {
    type: SchemaType.OBJECT,
    properties: {
      type: elementEnumTypeSchema,
      element: elementDefinitionSchema,
    },
    required: ["type", "element"],
  };
  const chapterSchema = {
    type: SchemaType.OBJECT,
    properties: {
      name: {
        type: SchemaType.STRING,
        description: "The name of the chapter.",
      },
      elements: {
        type: SchemaType.ARRAY,
        items: elementType,
      },
    },
    required: ["name", "elements"]
  };

  const reportSchema = {
    type: SchemaType.ARRAY,
    items: chapterSchema,
  };
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
    systemInstruction: reportGeneratorPrompt,
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: reportSchema,
    },
  });

  return model;
}

const model = initializeModel();

const generateReportWithLLM = async (props: { userPrompt: string }) => {
  const { userPrompt } = props;
  const chat = model.startChat();
  try {
    console.log("Receieved request", userPrompt);
    let result = await chat.sendMessage(userPrompt);
    console.log("Generated the report");
    const response = result.response;
    return response.text()
  } catch (e) {
    console.log(e)
    return "Error generating report";
  }
};

export default generateReportWithLLM;
