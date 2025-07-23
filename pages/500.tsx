import React from 'react';
import { NextPage } from 'next';
import { Typography, Button, Stack } from '@mui/material';
import { useRouter } from 'next/router';
import withLayoutBasic from '../libs/components/layout/LayoutBasic';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const Custom500: NextPage = () => {
	const router = useRouter();

	const goHome = () => {
		router.push('/');
	};

	const goBack = () => {
		router.back();
	};

	return (
		<Stack 
			direction="column" 
			alignItems="center" 
			justifyContent="center" 
			minHeight="60vh"
			spacing={4}
		>
			<Typography variant="h1" component="h1" fontSize="8rem" fontWeight="bold" color="error">
				500
			</Typography>
			<Typography variant="h4" component="h2" textAlign="center">
				서버 내부 오류
			</Typography>
			<Typography variant="body1" textAlign="center" color="text.secondary" maxWidth="600px">
				일시적인 서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
			</Typography>
			<Stack direction="row" spacing={2}>
				<Button 
					variant="outlined" 
					size="large" 
					onClick={goBack}
					sx={{ px: 3, py: 1.5 }}
				>
					이전으로
				</Button>
				<Button 
					variant="contained" 
					size="large" 
					onClick={goHome}
					sx={{ px: 4, py: 1.5 }}
				>
					홈으로 돌아가기
				</Button>
			</Stack>
		</Stack>
	);
};

export default withLayoutBasic(Custom500); 