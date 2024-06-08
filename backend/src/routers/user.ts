import { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, ACCESS_KEY, SECRET_KEY, REGION } from '../config';
import { authMiddleware } from '../middlewares/auth';
import { S3Client } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { createTaskInput } from '../types';

const router = Router();
const prismaClient = new PrismaClient();

const s3Client = new S3Client({
	credentials: {
		accessKeyId: ACCESS_KEY,
		secretAccessKey: SECRET_KEY
	},
	region: REGION
});

//signin with wallet
router.post('/signin', async (req, res) => {
	//TODO: Add sign verification logic here
	const hardcodedWalletAddress = 'c3rf_IM_DUMMY_WALLET_ADDRESS_fweca6tfd#4ct';
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
			JWT_SECRET
		);

		res.json({
			token
		});
	} else {
		const user = await prismaClient.user.create({
			data: {
				address: hardcodedWalletAddress
			}
		});

		const token = jwt.sign(
			{
				userId: user.id
			},
			JWT_SECRET
		);

		res.json({
			token
		});
	}
});

router.get('/presignedUrl', authMiddleware, async (req, res) => {
	//@ts-ignore
	const userId = req.userId;
	const date: string = new Date().toDateString();

	const { url, fields } = await createPresignedPost(s3Client, {
		Bucket: 'decentralized-thumbnail-ctr-finder',
		Key: `thumbnail/${userId}/${date}/Image${Math.floor(
			Math.random() * 10
		)}.jpg`,
		Conditions: [
			['content-length-range', 0, 5 * 1024 * 1024] // 5 MB max
		],

		Expires: 3600
	});

	res.status(200).json({
		url,
		fields
	});
});

router.post('/task', authMiddleware, async (req, res) => {
	//@ts-ignore
	const userId = req.userId;
	// validate the inputs from the user;
	const body = req.body;

	const parseData = createTaskInput.safeParse(body);
	if (!parseData.success) {
		return res.status(411).json({
			message: 'Invalid inputs'
		});
	}

	const response = await prismaClient.$transaction(async (tx) => {
		const response = await prismaClient.task.create({
			data: {
				title: parseData.data.title,
				user_id: userId,
				//TODO: fix hardcoded value once frontend is setup
				amount: '1',
				signature: 'signature'
			}
		});

		await tx.option.createMany({
			data: parseData.data.options.map((option) => ({
				image_url: option.imageUrl,
				task_id: response.id
			}))
		});
		return response;
	});
	res.status(201).json({ id: response.id, message: 'task created' });
});

router.get('/task', authMiddleware, async (req, res) => {
	//@ts-ignore
	const taskId: string = req.query.taskId;
	//@ts-ignore
	const userId: string = req.userId;

	const taskDetails = await prismaClient.task.findFirst({
		where: { user_id: Number(userId), id: Number(taskId) },
		include: { options: true }
	});

	if (!taskDetails) {
		return res.status(401).json({
			message: "You don't have access to this task"
		});
	}
	//TODO: make this faster, use cache
	const response = await prismaClient.submission.findMany({
		where: {
			task_id: Number(taskId)
		},
		include: { option: true }
	});

	const result: Record<
		string,
		{ count: number; option: { imageUrl: string } }
	> = {};

	taskDetails.options.forEach((option) => {
		result[option.id] = {
			count: 0,
			option: { imageUrl: option.image_url }
		};
	});

	response.forEach((res) => {
		result[res.option_id].count++;
	});

	res.status(200).json({
		result,
		taskDetails,
		message: 'Task Retrieved successfully.'
	});
});

export default router;
