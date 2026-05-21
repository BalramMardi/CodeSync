import express from "express";
import { createRoom } from "../controllers/roomController.js";

const router = express.Router();

router.get("/create-room", createRoom);

export default router;