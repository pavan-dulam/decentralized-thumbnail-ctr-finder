import { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../middlewares/auth';
const router = Router();

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

export default router;
