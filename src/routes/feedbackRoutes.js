import express from 'express' 
import { createFeedback, deleteFeedback, getMyFeedbacks , updateFeedback , getAllFeedbacks} from '../controllers/feedbackController.js';
import { authenticate, authorize } from '../middlewares/Auth.js';
import { ownCourse } from '../middlewares/ownCourse.js';


const router = express.Router();

router.post('/' ,authenticate ,authorize("admin","trainer"), createFeedback)
router.put('/:id' ,authenticate ,authorize("admin","trainer"), updateFeedback)
router.delete('/:id' ,authenticate ,authorize("admin","trainer"), deleteFeedback)
router.get('/me' ,authenticate , authorize('learner') , getMyFeedbacks)
router.get('/' ,authenticate , authorize('admin') , getAllFeedbacks)

export default router
