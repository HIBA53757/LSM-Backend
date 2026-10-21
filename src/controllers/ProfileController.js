import User from "../models/User.js"
import { NotFoundError } from "../utils/errors.js";

export async function me(req, res, next) {
    try{
        const user = await User.findById(req.user.id)

        if(!user){
            throw new NotFoundError()
        }

        res.status(200).json({
            success: true,
            data: {
                user
            }
        })
    }catch(error){
        next(error)
    }
}