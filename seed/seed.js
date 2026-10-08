import dotenv from "dotenv";
import mongoose from "mongoose";

import Course from "../src/models/course.js";
import Module from "../src/models/module.js";
import Resource from "../src/models/resource.js";

dotenv.config();

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected for seed");

        await Resource.deleteMany({});
        await Module.deleteMany({});
        await Course.deleteMany({});

        console.log("Existing data cleared");

        const courses = await Course.insertMany([
            {
                title: "JavaScript Fundamentals",
                description: "Learn the fundamentals of JavaScript and modern programming concepts.",
                objectives: [
                    "Understand JavaScript basics",
                    "Work with variables, functions and arrays",
                    "Manipulate objects and data"
                ],
                level: "beginner",
                category: "JavaScript",
                estimatedDuration: 20,
                Status: "published",
                publishedAt: new Date()
            },

            {
                title: "Node.js and Express API Development",
                description: "Build REST APIs with Node.js, Express and MongoDB.",
                objectives: [
                    "Understand Node.js fundamentals",
                    "Create REST APIs with Express",
                    "Connect an API to MongoDB"
                ],
                level: "intermediate",
                category: "Backend Development",
                estimatedDuration: 30,
                Status: "published",
                publishedAt: new Date()
            },

            {
                title: "Introduction to MongoDB",
                description: "Discover document databases and learn how to work with MongoDB.",
                objectives: [
                    "Understand NoSQL databases",
                    "Create and manage MongoDB documents",
                    "Use Mongoose with Node.js"
                ],
                level: "beginner",
                category: "Database",
                estimatedDuration: 15,
                Status: "draft"
            }
        ]);

        console.log(`${courses.length} courses created`);


        const modules = await Module.insertMany([
            {
                title: "JavaScript Basics",
                description: "Introduction to variables, data types and operators.",
                order: 1,
                estimatedDuration: 6,
                status: "published",
                course: courses[0]._id
            },

            {
                title: "Functions and Arrays",
                description: "Learn how to create functions and manipulate arrays.",
                order: 2,
                estimatedDuration: 7,
                status: "published",
                course: courses[0]._id
            },

            {
                title: "Express Fundamentals",
                description: "Build your first Express server and understand routing.",
                order: 1,
                estimatedDuration: 8,
                status: "published",
                course: courses[1]._id
            },

            {
                title: "REST APIs with Express",
                description: "Create REST endpoints and handle HTTP requests.",
                order: 2,
                estimatedDuration: 10,
                status: "published",
                course: courses[1]._id
            }
        ]);

        console.log(`${modules.length} modules created`);

        const resources = await Resource.insertMany([
            {
                title: "JavaScript Variables PDF",
                type: "pdf",
                url: "https://example.com/javascript-variables.pdf",
                description: "Introduction to variables and data types in JavaScript.",
                originalFileName: "javascript-variables.pdf",
                fileSize: 1024,
                estimatedDuration: 30,
                displayOrder: 1,
                module: modules[0]._id
            },

            {
                title: "JavaScript Basics Video",
                type: "video",
                url: "https://example.com/javascript-basics",
                description: "Video explaining the basic concepts of JavaScript.",
                estimatedDuration: 45,
                displayOrder: 2,
                module: modules[0]._id
            },

            {
                title: "Functions Exercise",
                type: "document",
                url: "https://example.com/functions-exercise.pdf",
                description: "Practice exercises about JavaScript functions and arrays.",
                originalFileName: "functions-exercise.pdf",
                fileSize: 2048,
                estimatedDuration: 40,
                displayOrder: 1,
                module: modules[1]._id
            },

            {
                title: "Express Introduction",
                type: "video",
                url: "https://example.com/express-introduction",
                description: "Introduction to Express and server-side JavaScript.",
                estimatedDuration: 50,
                displayOrder: 1,
                module: modules[2]._id
            },

            {
                title: "REST API Guide",
                type: "pdf",
                url: "https://example.com/rest-api-guide.pdf",
                description: "Guide to building REST APIs with Express.",
                originalFileName: "rest-api-guide.pdf",
                fileSize: 3072,
                estimatedDuration: 60,
                displayOrder: 1,
                module: modules[3]._id
            }
        ]);

        console.log(`${resources.length} resources created`);


        console.log("Seed completed successfully");

        await mongoose.connection.close();
        console.log("MongoDB connection closed");


    } catch (error) {
        console.error("Seed failed:", error.message);
        process.exit(1);
    }
}
seed();