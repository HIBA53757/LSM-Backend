import express from 'express' 
import { createFeedback } from '../controllers/feedbackController.js';
import { authenticate, authorize } from '../middlewares/Auth.js';


const router = express.Router();

router.post('/' ,authenticate , authorize('learner') , createFeedback)

export default router
