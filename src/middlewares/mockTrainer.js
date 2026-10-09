//to test creating a course since login is not working yet
//i will delete it once the register login is working
export function mockTrainer(req, res, next) {
    req.user = {
        id: "6ac7ac976a758ae778b39271",
        role: "trainer"
    };

    next();
}