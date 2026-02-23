import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-5039eff7/health", (c) => {
  return c.json({ status: "ok" });
});

// Get all tasks
app.get("/make-server-5039eff7/tasks", async (c) => {
  try {
    const tasks = await kv.getByPrefix("task:");
    return c.json({ tasks: tasks || [] });
  } catch (error) {
    console.log(`Error fetching tasks: ${error}`);
    return c.json({ error: "Failed to fetch tasks", details: String(error) }, 500);
  }
});

// Create a new task
app.post("/make-server-5039eff7/tasks", async (c) => {
  try {
    const { text } = await c.req.json();
    
    if (!text || typeof text !== 'string' || text.trim() === '') {
      return c.json({ error: "Task text is required" }, 400);
    }
    
    const taskId = `task:${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const task = {
      id: taskId,
      text: text.trim(),
      completed: false,
      createdAt: new Date().toISOString()
    };
    
    await kv.set(taskId, task);
    return c.json({ task });
  } catch (error) {
    console.log(`Error creating task: ${error}`);
    return c.json({ error: "Failed to create task", details: String(error) }, 500);
  }
});

// Update a task
app.put("/make-server-5039eff7/tasks/:id", async (c) => {
  try {
    const taskId = c.req.param("id");
    const { text, completed } = await c.req.json();
    
    const existingTask = await kv.get(taskId);
    if (!existingTask) {
      return c.json({ error: "Task not found" }, 404);
    }
    
    const updatedTask = {
      ...existingTask,
      text: text !== undefined ? text : existingTask.text,
      completed: completed !== undefined ? completed : existingTask.completed,
      updatedAt: new Date().toISOString()
    };
    
    await kv.set(taskId, updatedTask);
    return c.json({ task: updatedTask });
  } catch (error) {
    console.log(`Error updating task: ${error}`);
    return c.json({ error: "Failed to update task", details: String(error) }, 500);
  }
});

// Delete a task
app.delete("/make-server-5039eff7/tasks/:id", async (c) => {
  try {
    const taskId = c.req.param("id");
    
    const existingTask = await kv.get(taskId);
    if (!existingTask) {
      return c.json({ error: "Task not found" }, 404);
    }
    
    await kv.del(taskId);
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error deleting task: ${error}`);
    return c.json({ error: "Failed to delete task", details: String(error) }, 500);
  }
});

Deno.serve(app.fetch);