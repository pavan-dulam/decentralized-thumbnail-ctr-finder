'use client';

import { useState } from 'react';

export const UploadImage = () => {
	const [image, setImage] = useState('');
	return (
		<div className='w-40 h-40 rounded border text-2xl cursor'>
			<div className='h-full flex justify-center'>
				<div className='h-full flex justify-center flex-col'>
					+
					<input
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
						onSelect={(file) => {
							console.log('file=', file);
						}}
					/>
				</div>
			</div>
		</div>
	);
};
