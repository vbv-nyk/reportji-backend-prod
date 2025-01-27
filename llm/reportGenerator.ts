
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory, SchemaType } from "@google/generative-ai";
import util from "util"
import fs from 'fs'
import express, { Request, Response } from "express"
import { reportGeneratorPrompt } from "./reportGeneratorPrompt";



// Ensure your API key is correctly set here
const genAI = new GoogleGenerativeAI("");

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
        `
    }
    const elementDefinitionSchema = {
        type: SchemaType.OBJECT,
        properties: {
            type: elementEnumTypeSchema,
            content: { type: SchemaType.STRING, description: "The actual content of the section."}
        }
    }

    const elementType = {
        type: SchemaType.OBJECT,
        properties: {
            type: elementEnumTypeSchema,
            element: elementDefinitionSchema,
        }
    }
    const contentSchema = {
        name: {
            type: SchemaType.STRING,
            description: "The name of the chapter."
        },
        elements: {
            type: SchemaType.ARRAY,
            items: elementType
        }
    }
    const chapterSchema = {
        type: SchemaType.OBJECT,
        properties: contentSchema
    }

    const reportSchema = {
        type: SchemaType.ARRAY,
        items: chapterSchema
    }
    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-exp",
        systemInstruction: reportGeneratorPrompt,
        safetySettings: [{
            "category": HarmCategory.HARM_CATEGORY_HARASSMENT,
            "threshold": HarmBlockThreshold.BLOCK_NONE,
        },
        {
            "category": HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            "threshold": HarmBlockThreshold.BLOCK_NONE,
        },
        {
            "category": HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            "threshold": HarmBlockThreshold.BLOCK_NONE,
        },
        {
            "category": HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            "threshold": HarmBlockThreshold.BLOCK_NONE,
        }],
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: SchemaType.OBJECT,
                properties: {
                    response: reportSchema,
                },
                required: ["response"],
            }
        }
    });


    return model;
}

const model = initializeModel()

const planSummariserAgent = async (userPrompt: string) => {
    const chat = model.startChat();
    let result = await chat.sendMessage(userPrompt);
    const response = result.response;
    return response.text();
}

export default planSummariserAgent;
