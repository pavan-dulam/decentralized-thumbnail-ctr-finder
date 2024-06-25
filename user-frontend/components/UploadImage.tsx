'use client';

import { useState } from 'react';
import axios from 'axios';
import { BACKEND_URL, CLOUDFRONT_URL } from '@/config';

export async function UploadImage({
	onImageAdded,
	image
}: {
	onImageAdded: (image: string) => void;
	image?: string;
}) {
	const [uploading, setUploading] = useState(false);

	async function onFileSelect(e: any) {
		setUploading(true);
		try {
			const file = e.target.files[0];
			const response = await axios.get(
				`${BACKEND_URL}/v1/user/presignedUrl`,
				{
					headers: {
						Authorization: localStorage.getItem('token')
					}
				}
			);

			const preSignedUrl = response.data.preSignedUrl;
			const formData = new FormData();

			formData.set('bucket', response.data.fields['bucket']);
			formData.set(
				'X-Amz-Algorithm',
				response.data.fields['X-Amz-Algorithm']
			);
			formData.set(
				'X-Amz-Credential',
				response.data.fields['X-Amz-Credential']
			);
			formData.set(
				'X-Amz-Algorithm',
				response.data.fields['X-Amz-Algorithm']
			);
			formData.set('X-Amz-Date', response.data.fields['X-Amz-Date']);
			formData.set('key', response.data.fields['key']);
			formData.set('Policy', response.data.fields['Policy']);
			formData.set(
				'X-Amz-Signature',
				response.data.fields['X-Amz-Signature']
			);
			formData.set(
				'X-Amz-Algorithm',
				response.data.fields['X-Amz-Algorithm']
			);
			formData.append('file', file);

			const awsResponse = await axios.post(preSignedUrl, formData);
			onImageAdded(`${CLOUDFRONT_URL}/${response.data.fields['key']}`);
		} catch (e) {
			console.log('error:', e);
		}
		setUploading(false);
	}
	return (
		<div className='w-40 h-40 rounded border text-2xl cursor'>
			<div className='h-full flex justify-center relative w-full'>
				<div className='h-full flex justify-center w-full pt-16 text-4xl'>
					+
					<input
						className='w-full h-full bg-red-400 w-40 h-40'
						type='file'
						style={{
							opacity: 0,
							position: 'absolute',
							top: 0,
							bottom: 0,
							left: 0,
							right: 0,
							width: '100%',
							height: '100%'
						}}
						onChange={onFileSelect}
					/>
				</div>
			</div>
		</div>
	);
}
