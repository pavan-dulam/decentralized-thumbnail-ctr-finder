import { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, ACCESS_KEY, SECRET_KEY, REGION } from '../config';
import { authMiddleware } from '../middlewares/auth';
import { S3Client } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';

const router = Router();
const s3Client = new S3Client({
	credentials: {
		accessKeyId: ACCESS_KEY,
		secretAccessKey: SECRET_KEY
	},
	region: REGION
});
const prismaClient = new PrismaClient();

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

export default router;
