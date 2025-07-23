import React from 'react';
import { NextPage } from 'next';
import { Box, Typography, Button, Stack } from '@mui/material';
import { useRouter } from 'next/router';
import withLayoutBasic from '../libs/components/layout/LayoutBasic';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const Custom404: NextPage = () => {
	const router = useRouter();

	const goHome = () => {
		router.push('/');
	};

	return (
		<Stack 
			direction="column" 
			alignItems="center" 
			justifyContent="center" 
			minHeight="60vh"
			spacing={4}
		>
			<Typography variant="h1" component="h1" fontSize="8rem" fontWeight="bold" color="primary">
				404
			</Typography>
			<Typography variant="h4" component="h2" textAlign="center">
				페이지를 찾을 수 없습니다
			</Typography>
			<Typography variant="body1" textAlign="center" color="text.secondary" maxWidth="600px">
				요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
			</Typography>
			<Button 
				variant="contained" 
				size="large" 
				onClick={goHome}
				sx={{ px: 4, py: 1.5 }}
			>
				홈으로 돌아가기
			</Button>
		</Stack>
	);
};

export default withLayoutBasic(Custom404); 