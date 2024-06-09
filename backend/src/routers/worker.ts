import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { WORKER_JWT_SECRET } from '../config';
import { workerAuthMiddleware } from '../middlewares/auth';

const router = Router();
const prismaClient = new PrismaClient();

//signin with wallet
router.post('/signin', async (req, res) => {
	//TODO: Add sign verification logic here
	const hardcodedWalletAddress =
		'c3rf_IM_DUMMY_WORKER_WALLET_ADDRESS_fweca6tfd#4ct';
	const existingUser = await prismaClient.user.findFirst({
		where: {
			address: hardcodedWalletAddress
		}
	});

	if (existingUser) {
		const token = jwt.sign(
			{
				userId: existingUser.id
			},
			WORKER_JWT_SECRET
		);

		res.json({
			token
		});
	} else {
		const user = await prismaClient.worker.create({
			data: {
				address: hardcodedWalletAddress,
				pending_amount: 0,
				locked_amount: 0
			}
		});

		const token = jwt.sign(
			{
				userId: user.id
			},
			WORKER_JWT_SECRET
		);

		res.json({
			token
		});
	}
});

router.get('/nextTask', workerAuthMiddleware, async (req, res) => {
	//@ts-ignore
	const userId = req.userId;

	const task = await prismaClient.task.findFirst({
		where: {
			done: false,
			submissions: {
				none: {
					worker_id: userId
				}
			}
		},
		select: { title:true,options: true }
	});

	if (!task) {
		res.status(411).json({
			message: 'No more tasks left to review.'
		});
	} else {
		res.status(200).json({
			message: 'Tasks retrieved successfully.',
			data: task
		});
	}
});
export default router;
