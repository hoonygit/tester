import { GoogleGenAI, Type } from "@google/genai";
import type { WeatherData } from '../types';
import { METRIC_ENGLISH } from '../constants';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const fetchWeatherData = async (region: string, metrics: string[], startDate: string, endDate: string): Promise<WeatherData> => {
  try {
    const englishMetrics = metrics.map(m => METRIC_ENGLISH[m]);
    
    const properties: { [key: string]: any } = {
        date: { type: Type.STRING, description: "The date for the data point in 'YYYY-MM-DD' format." }
    };
    const requiredFields = ['date'];

    metrics.forEach(metric => {
        const englishMetric = METRIC_ENGLISH[metric];
        
        properties[metric] = { 
            type: Type.NUMBER,
            description: `The current value for ${englishMetric}. Should be a realistic number.`
        };
        requiredFields.push(metric);
        
        const avgMetricKey = `${metric}_5yr_avg`;
        properties[avgMetricKey] = {
            type: Type.NUMBER,
            description: `The 5-year historical average value for ${englishMetric} on this specific date. This value should vary day-by-day, reflecting the historical seasonal trend, not be a single constant for the whole period.`
        };
        requiredFields.push(avgMetricKey);
    });

    const responseSchema = {
      type: Type.ARRAY,
      description: `An array of daily weather data points for the period from ${startDate} to ${endDate}. Each point includes current values and 5-year averages.`,
      items: {
        type: Type.OBJECT,
        properties: properties,
        required: requiredFields
      }
    };

    const prompt = `You are an expert meteorological data analyst for Jeju Island, South Korea. Your task is to provide realistic weather data in a specific JSON format.

Generate a JSON object containing an array of weather data points based on these parameters:
- Region: "${region}"
- Metrics: "${englishMetrics.join(', ')}"
- Period: from "${startDate}" to "${endDate}"

The JSON response must be an array of objects, and it must strictly adhere to the provided schema.
- For the given period from ${startDate} to ${endDate}, provide one data point for each day. If the period is a single day (start and end dates are the same), provide a single data point in the array.
- For each requested metric (e.g., "${metrics[0]}"), you must provide two values for each data point:
  1. The current/recent value, using the metric name as the key (e.g., "${metrics[0]}").
  2. The 5-year historical average for that same day, using the key format "${metrics[0]}_5yr_avg".
- The date for each data point must be formatted as 'YYYY-MM-DD' and fall within the requested date range.
- The values for each metric should be realistic for the given region, metric, and date, showing natural daily variation.
- The 5-year average values should be plausible and generally smoother than the daily current values.
- CRUCIAL: The 5-year average values must NOT be a single constant value for the entire period. They must reflect the specific historical average for EACH INDIVIDUAL DATE in the series, showing slight, realistic variations from day to day as expected for that time of year.
- Do not include any text, explanations, or markdown formatting outside of the JSON array.
`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
        },
    });

    const jsonString = response.text;
    const data = JSON.parse(jsonString);

    // Ensure data is sorted by date
    data.sort((a: { date: string; }, b: { date: string; }) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return data as WeatherData;
  } catch (error) {
    console.error("Error fetching weather data from Gemini API:", error);
    throw new Error("Failed to fetch weather data. Please check your API key and network connection.");
  }
};