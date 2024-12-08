import { Router } from 'express';
import { HelloWorld } from '../handlers/main';

const mainRouter = Router();

mainRouter.get('/', HelloWorld)

export default mainRouter;