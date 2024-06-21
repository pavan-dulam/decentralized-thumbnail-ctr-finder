import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import {
	WORKER_JWT_SECRET,
	TOTAL_SUBMISSIONS,
	TOTAL_DECIMALS
} from '../config';
import { workerAuthMiddleware } from '../middlewares/auth';
import { getNextTask } from '../db';
import { createSubmissionInput } from '../types';

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
	const userId: string = req.userId;

	const task = await getNextTask(Number(userId));

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

router.post('/submission', workerAuthMiddleware, async (req, res) => {
	//@ts-ignore
	const userId: string = req.userId;
	const body = req.body;
	const parsedBody = createSubmissionInput.safeParse(body);
	if (parsedBody.success) {
		const task = await getNextTask(Number(userId));

		if (!task || task?.id !== Number(parsedBody.data.taskId)) {
			return res.status(411).json({
				message: 'Incorrect task id'
			});
		}

		const amount = Number(task.amount) / TOTAL_SUBMISSIONS;
		const submission = await prismaClient.$transaction(async (tx) => {
			const submission = await tx.submission.create({
				data: {
					option_id: Number(parsedBody.data.selection),
					worker_id: Number(userId),
					task_id: Number(parsedBody.data.taskId),
					amount
				}
			});
			await tx.worker.update({
				where: {
					id: Number(userId)
				},
				data: { pending_amount: { increment: amount } }
			});
			return submission;
		});

		const nextTask = await getNextTask(Number(userId));

		return res.status(200).json({
			nextTask,
			amount
		});
	} else {
		return res.status(411).json({
			message: 'Invalid inputs'
		});
	}
});

router.post('/balance', workerAuthMiddleware, async (req, res) => {
	//@ts-ignore
	const userId: number = req.userId;
	const worker = await prismaClient.worker.findFirst({
		where: { id: userId }
	});

	return res.status(200).json({
		message: 'Balance fetched successfully.',
		data: {
			pendingAmount: worker?.pending_amount,
			lockedAmount: worker?.pending_amount
		}
	});
});

router.post('/payout', workerAuthMiddleware, async (req, res) => {
	//@ts-ignore
	const userId: number = req.userId;
	const worker = await prismaClient.worker.findFirst({
		where: { id: userId }
	});

	if (!worker) {
		return res.status(403).json({ message: 'User not found.' });
	}
	const address = worker.address;
	const txId = '0xDummyTxId';

	//! vulnerable: table should be locked
	await prismaClient.$transaction(async (tx) => {
		await tx.worker.update({
			where: {
				id: userId
			},
			data: {
				pending_amount: { decrement: worker.pending_amount },
				locked_amount: { increment: worker.pending_amount }
			}
		});

		await tx.payouts.create({
			data: {
				user_id: userId,
				amount: worker.pending_amount,
				status: 'Processing',
				signature: txId
			}
		});
	});

	//TODO: this is incomplete route, add solana logic here send txid to solana blockchain

	res.status(200).json({
		message: 'Precessing the payout.',
		data: {
			amount: worker.pending_amount
		}
	});
});

export default router;
