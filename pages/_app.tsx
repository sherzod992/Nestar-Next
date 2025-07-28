import type { AppProps } from 'next/app';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import React, { useState, useEffect } from 'react';
import { light } from '../scss/MaterialTheme';
import { ApolloProvider } from '@apollo/client';
import { useApollo } from '../apollo/client';
import { appWithTranslation } from 'next-i18next';
import { socketVar } from '../apollo/store';
import { getJwtToken } from '../libs/auth';
import '../scss/app.scss';
import '../scss/pc/main.scss';
import '../scss/mobile/main.scss';

const App = ({ Component, pageProps }: AppProps) => {
	// @ts-ignore
	const [theme, setTheme] = useState(createTheme(light));
	const client = useApollo(pageProps.initialApolloState);

	// WebSocket 연결 초기화
	useEffect(() => {
		if (typeof window !== 'undefined') {
			const token = getJwtToken();
			if (token && process.env.REACT_APP_API_WS) {
				try {
					const wsUrl = process.env.REACT_APP_API_WS;
					const socket = new WebSocket(`${wsUrl}?token=${token}`);
					
					socket.onopen = () => {
						console.log('🔗 WebSocket 연결 성공!');
					};

					socket.onerror = (error) => {
						console.error('❌ WebSocket 연결 오류:', error);
					};

					socket.onclose = (event) => {
						console.log('🔌 WebSocket 연결 종료:', event.code, event.reason);
					};

					// 전역 상태에 WebSocket 저장
					socketVar(socket);

					// 컴포넌트 언마운트 시 연결 종료
					return () => {
						if (socket.readyState === WebSocket.OPEN) {
							socket.close();
						}
					};
				} catch (error) {
					console.error('❌ WebSocket 초기화 오류:', error);
				}
			}
		}
	}, []);

	return (
		<ApolloProvider client={client}>
			<ThemeProvider theme={theme}>
				<CssBaseline />
				<Component {...pageProps} />
			</ThemeProvider>
		</ApolloProvider>
	);
};

export default appWithTranslation(App);
