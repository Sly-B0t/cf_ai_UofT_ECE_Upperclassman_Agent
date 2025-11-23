/**
 * Tool definitions for the AI chat agent
 * Tools can either require human confirmation or execute automatically
 */
import { tool, type ToolSet } from "ai";
import { z } from "zod/v3";

import type { Chat } from "./server";
import { Agent, getCurrentAgent } from "agents";
import { scheduleSchema } from "agents/schedule";
import { time } from "node:console";


function mapWeatherCode(code: number): string {
  if (code === 0) return "Clear ☀️";
  if (code === 1 || code === 2) return "Partly cloudy 🌤️";
  if (code === 3) return "Overcast ☁️";
  if (code === 45 || code === 48) return "Fog 🌫️";

  if (code >= 51 && code <= 55) return "Drizzle 🌦️";
  if (code >= 61 && code <= 65) return "Rain 🌧️";
  if (code >= 71 && code <= 75) return "Snow ❄️";

  if (code >= 80 && code <= 82) return "Rain showers 🌧️";
  if (code >= 85 && code <= 86) return "Snow showers 🌨️";

  if (code === 95) return "Thunderstorm ⛈️";

  return "Unknown weather 🌍";
}

/**
 * Weather information tool that requires human confirmation
 * When invoked, this will present a confirmation dialog to the user
 */
const getWeatherandTimeInformation = tool({
  description: "show the weather and time in a given city",
  inputSchema: z.object({
    city: z.string().describe("The city"),
    latitude: z.string().describe("latitude"),
    longitude: z.string().describe("longitude"),
    timezone: z.string().describe("Continent then Location with respect to its timezone eg America/Toronto or America/New_York spaces should be an underscore")

  }),
  execute: async ({ latitude, longitude, city,timezone }) => {
    console.log(`Getting weather for ${city}`);
    const turl = `https://worldtimeapi.org/api/timezone/${timezone}`;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;

    try {
      const res = await fetch(url);
      const tres = await fetch(turl);

      if (!res.ok || !tres.ok) {
        return `Invalid location or Time: ${city}`;
      }

      const cdata = (await res.json()) as any;
      const data = cdata.current_weather;
      const tdata = await tres.json() as any;

      const weather = mapWeatherCode(data.weathercode);
      const day = data.is_day === 1 ? "Day" : "Night";

      return `It's currently ${day}time in ${city} at ${tdata.datetime}, ${data.temperature}°C and the weather is ${weather}.`;
    } catch (err) {
      return "Failed to fetch weather.";
    }
  }
});




/**
 * Local time tool that executes automatically
 * Since it includes an execute function, it will run without user confirmation
 * This is suitable for low-risk operations that don't need oversight
 */
const getGlobalTime = tool({
  description: "get the local time for a specified location, dont call this if calling get weather",
  inputSchema: z.object({ location: z.string().describe("Continent then Location with respect to its timezone eg America/Toronto or America/New_York spaces should be an underscore")}),
  execute: async ({ location }) => {
    console.log(`Getting local time for ${location}`);
    const url = `https://worldtimeapi.org/api/timezone/${location}`;
      try {
      // Call the API
      const res = await fetch(url);

      if (!res.ok) {
        return `Invalid city or timezone: ${location}`;
      }
      // Parse JSON response
      const data = await res.json() as any;

      // Extract time
      return `Current time in ${location}: ${data.datetime}`;
    } catch (err) {
      return "Failed to fetch time from worldtimeapi.org.";
    }
  }
});

const scheduleTask = tool({
  description: "A tool to schedule a task to be executed at a later time",
  inputSchema: scheduleSchema,
  execute: async ({ when, description }) => {
    // we can now read the agent context from the ALS store
    const { agent } = getCurrentAgent<Chat>();

    function throwError(msg: string): string {
      throw new Error(msg);
    }
    if (when.type === "no-schedule") {
      return "Not a valid schedule input";
    }
    const input =
      when.type === "scheduled"
        ? when.date // scheduled
        : when.type === "delayed"
          ? when.delayInSeconds // delayed
          : when.type === "cron"
            ? when.cron // cron
            : throwError("not a valid schedule input");
    try {
      agent!.schedule(input!, "executeTask", description);
    } catch (error) {
      console.error("error scheduling task", error);
      return `Error scheduling task: ${error}`;
    }
    return `Task scheduled for type "${when.type}" : ${input}`;
  }
});

/**
 * Tool to list all scheduled tasks
 * This executes automatically without requiring human confirmation
 */
const getScheduledTasks = tool({
  description: "List all tasks that have been scheduled",
  inputSchema: z.object({}),
  execute: async () => {
    const { agent } = getCurrentAgent<Chat>();

    try {
      const tasks = agent!.getSchedules();
      if (!tasks || tasks.length === 0) {
        return "No scheduled tasks found.";
      }
      return tasks;
    } catch (error) {
      console.error("Error listing scheduled tasks", error);
      return `Error listing scheduled tasks: ${error}`;
    }
  }
});

/**
 * Tool to cancel a scheduled task by its ID
 * This executes automatically without requiring human confirmation
 */
const cancelScheduledTask = tool({
  description: "Cancel a scheduled task using its ID",
  inputSchema: z.object({
    taskId: z.string().describe("The ID of the task to cancel")
  }),
  execute: async ({ taskId }) => {
    const { agent } = getCurrentAgent<Chat>();
    try {
      await agent!.cancelSchedule(taskId);
      return `Task ${taskId} has been successfully canceled.`;
    } catch (error) {
      console.error("Error canceling scheduled task", error);
      return `Error canceling task ${taskId}: ${error}`;
    }
  }
});

/**
 * Export all available tools
 * These will be provided to the AI model to describe available capabilities
 */
export const tools = {
  getWeatherandTimeInformation,
  getGlobalTime,
  scheduleTask,
  getScheduledTasks,
  cancelScheduledTask
} satisfies ToolSet;



export const executions = {

};