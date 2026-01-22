
import { GoogleGenAI, Type } from "@google/genai";
import { Question } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const DEFAULT_QUESTIONS: Question[] = [
  {
    id: 1,
    question: "Đường trung bình của tam giác là đoạn thẳng nối...",
    options: [
      "Đỉnh và trung điểm cạnh đối diện",
      "Trung điểm hai cạnh của tam giác",
      "Hai đỉnh của tam giác",
      "Trọng tâm và một đỉnh"
    ],
    correctAnswer: 1,
    explanation: "Đường trung bình của tam giác nối trung điểm hai cạnh của tam giác đó.",
    triangleParams: { 
      sideA: 10, sideB: 10, sideC: 12, midsegmentLength: 6, baseLength: 12,
      labels: { v1: 'A', v2: 'B', v3: 'C', m1: 'M', m2: 'N' }
    }
  },
  {
    id: 2,
    question: "Nếu cạnh đáy BC = 14cm, đường trung bình MN tương ứng sẽ dài bao nhiêu?",
    options: ["7cm", "14cm", "28cm", "10cm"],
    correctAnswer: 0,
    explanation: "Đường trung bình bằng nửa cạnh đáy tương ứng: 14 / 2 = 7cm.",
    triangleParams: { 
      sideA: 10, sideB: 10, sideC: 14, midsegmentLength: 7, baseLength: 14,
      labels: { v1: 'A', v2: 'B', v3: 'C', m1: 'M', m2: 'N' }
    }
  },
  {
    id: 3,
    question: "Trong tam giác PQR, nếu EF là đường trung bình (E thuộc PQ, F thuộc PR) và QR = 20cm thì EF bằng?",
    options: ["10cm", "20cm", "40cm", "5cm"],
    correctAnswer: 0,
    explanation: "EF = 1/2 QR = 1/2 * 20 = 10cm.",
    triangleParams: { 
      sideA: 12, sideB: 12, sideC: 20, midsegmentLength: 10, baseLength: 20,
      labels: { v1: 'P', v2: 'Q', v3: 'R', m1: 'E', m2: 'F' }
    }
  }
];

export const generateMathQuestions = async (difficulty: 'easy' | 'medium' | 'hard'): Promise<Question[]> => {
  const prompt = `Tạo 10 câu hỏi trắc nghiệm toán học lớp 8 về bài "Đường trung bình của tam giác". 
  Độ khó: ${difficulty}. 
  Yêu cầu cực kỳ quan trọng:
  - Nếu câu hỏi nhắc đến các đỉnh (ví dụ: ABC, PQR, DEF) hoặc trung điểm (MN, EF, HK), bạn PHẢI cung cấp chúng trong phần "labels" của triangleParams.
  - Các giá trị sideA, sideB, sideC và midsegmentLength phải logic với nội dung câu hỏi.
  - Câu hỏi đa dạng: cả lý thuyết và tính toán thực tế.
  - Phản hồi dưới dạng JSON chính xác.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.INTEGER },
              question: { type: Type.STRING },
              options: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING } 
              },
              correctAnswer: { type: Type.INTEGER },
              explanation: { type: Type.STRING },
              triangleParams: {
                type: Type.OBJECT,
                properties: {
                  sideA: { type: Type.NUMBER },
                  sideB: { type: Type.NUMBER },
                  sideC: { type: Type.NUMBER },
                  midsegmentLength: { type: Type.NUMBER },
                  baseLength: { type: Type.NUMBER },
                  labels: {
                    type: Type.OBJECT,
                    properties: {
                      v1: { type: Type.STRING },
                      v2: { type: Type.STRING },
                      v3: { type: Type.STRING },
                      m1: { type: Type.STRING },
                      m2: { type: Type.STRING }
                    }
                  }
                }
              }
            },
            required: ["id", "question", "options", "correctAnswer", "explanation"]
          }
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Failed to fetch from Gemini, using expanded defaults:", error);
    return DEFAULT_QUESTIONS;
  }
};
