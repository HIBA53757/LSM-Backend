import dotenv from "dotenv";
import mongoose from "mongoose";

import Course from "../src/models/course.js";
import Module from "../src/models/module.js";
import Resource from "../src/models/resource.js";
import User from "../src/models/User.js";

dotenv.config();

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected for seed");

        await Resource.deleteMany({});
        await Module.deleteMany({});
        await Course.deleteMany({});

        let trainer = await User.findOne({
            role: "trainer"
        });

        if (!trainer) {
            trainer = await User.create({
                email: "hiba@gmail.com",
                password: "password123",
                role: "trainer",
                accountStatus: "active"
            });

            console.log("Trainer created");
        }

        const courses = await Course.insertMany([
            {
                title: "JavaScript Fundamentals",
                description:
                    "Learn the fundamentals of JavaScript and modern programming concepts.",
                objectives: [
                    "Understand JavaScript basics",
                    "Work with variables, functions and arrays",
                    "Manipulate objects and data"
                ],
                level: "beginner",
                category: "JavaScript",
                estimatedDuration: 20,
                status: "published",
                trainer: trainer._id,
                publishedAt: new Date()
            },
            {
                title: "Node.js and Express API Development",
                description:
                    "Build REST APIs with Node.js, Express and MongoDB.",
                objectives: [
                    "Understand Node.js fundamentals",
                    "Create REST APIs with Express",
                    "Connect an API to MongoDB"
                ],
                level: "intermediate",
                category: "Backend Development",
                estimatedDuration: 30,
                status: "published",
                trainer: trainer._id,
                publishedAt: new Date()
            },
            {
                title: "Introduction to MongoDB",
                description:
                    "Discover document databases and learn how to work with MongoDB.",
                objectives: [
                    "Understand NoSQL databases",
                    "Create and manage MongoDB documents",
                    "Use Mongoose with Node.js"
                ],
                level: "beginner",
                category: "Database",
                estimatedDuration: 15,
                status: "draft",
                trainer: trainer._id
            }
        ]);

        const modules = await Module.insertMany([
            {
                title: "JavaScript Basics",
                description:
                    "Introduction to variables, data types and operators.",
                position: 1,
                estimatedDuration: 6,
                status: "published",
                course: courses[0]._id
            },

            {
                title: "Functions and Arrays",
                description:
                    "Learn how to create functions and manipulate arrays.",
                position: 2,
                estimatedDuration: 7,
                status: "published",
                course: courses[0]._id
            },

            {
                title: "Express Fundamentals",
                description:
                    "Build your first Express server and understand routing.",
                position: 1,
                estimatedDuration: 8,
                status: "published",
                course: courses[1]._id
            },

            {
                title: "REST APIs with Express",
                description:
                    "Create REST endpoints and handle HTTP requests.",
                position: 2,
                estimatedDuration: 10,
                status: "published",
                course: courses[1]._id
            }
        ]);


        const resources = await Resource.insertMany([
            {
                title: "JavaScript Variables PDF",
                type: "pdf",
                description:
                    "Introduction to variables and data types in JavaScript.",
                file: {
                    originalName: "javascript-variables.pdf",
                    filename: "javascript-variables.pdf",
                    path: "uploads/javascript-variables.pdf",
                    size: 1024,
                    mimetype: "application/pdf"
                },
                position: 1,
                status: "published",
                module: modules[0]._id
            },

            {
                title: "JavaScript Basics Video",
                type: "video",
                url: "https://example.com/javascript-basics",
                description:
                    "Video explaining the basic concepts of JavaScript.",
                position: 2,
                status: "published",
                module: modules[0]._id
            },

            {
                title: "Functions Exercise",
                type: "article",
                content:
                    "Practice exercises about JavaScript functions and arrays.",
                description:
                    "Practice exercises about JavaScript functions and arrays.",
                position: 1,
                status: "published",
                module: modules[1]._id
            },

            {
                title: "Express Introduction",
                type: "video",
                url: "https://example.com/express-introduction",
                description:
                    "Introduction to Express and server-side JavaScript.",
                position: 1,
                status: "published",
                module: modules[2]._id
            },

            {
                title: "REST API Guide",
                type: "pdf",
                description:
                    "Guide to building REST APIs with Express.",
                file: {
                    originalName: "rest-api-guide.pdf",
                    filename: "rest-api-guide.pdf",
                    path: "uploads/rest-api-guide.pdf",
                    size: 3072,
                    mimetype: "application/pdf"
                },
                position: 1,
                status: "published",
                module: modules[3]._id
            }
        ]);

        console.log("Seed completed successfully");

        await mongoose.connection.close();
        console.log("MongoDB connection closed");
    } catch (error) {
        console.error("Seed failed:", error.message);
        await mongoose.connection.close();
        process.exit(1);
    }
}

seed();