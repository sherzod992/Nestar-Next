import { useMemo } from "react";
import {
  ApolloClient,
  ApolloLink,
  InMemoryCache,
  from,
  NormalizedCacheObject,
} from "@apollo/client";
import { createUploadLink } from "apollo-upload-client";
import { onError } from "@apollo/client/link/error";
import { getJwtToken } from "../libs/auth";
import { TokenRefreshLink } from "apollo-link-token-refresh";
import { sweetErrorAlert } from "../libs/sweetAlert";
import { socketVar } from "./store";

let apolloClient: ApolloClient<NormalizedCacheObject>;

function getHeaders() {
	const headers = {} as HeadersInit;
	const token = getJwtToken();
	// @ts-ignore
	if (token) headers['Authorization'] = `Bearer ${token}`;
	return headers;
}

const tokenRefreshLink = new TokenRefreshLink({
	accessTokenField: 'accessToken',
	isTokenValidOrUndefined: () => {
		return true;
	}, // @ts-ignore
	fetchAccessToken: () => {
		// execute refresh token
		return null;
	},
});

// Custom WebSocket client
class LoggingWebSocket {
	private socket: WebSocket;

	constructor(url: string) {
		this.socket = new WebSocket(`${url}?token=${getJwtToken()}`);
		socketVar(this.socket);

		this.socket.onopen = () => {
			console.log('🔗 WebSocket 연결 성공!');
		};

		this.socket.onmessage = (msg) => {
			try {
				const data = JSON.parse(msg.data);
				console.log('📨 WebSocket 메시지 수신:', data);
			} catch (e) {
				console.log('📨 WebSocket 원시 메시지:', msg.data);
			}
		};

		this.socket.onerror = (error) => {
			console.error('❌ WebSocket 오류:', error);
		};

		this.socket.onclose = (event) => {
			console.log('🔌 WebSocket 연결 종료:', event.code, event.reason);
		};
	}

	send(data: string | ArrayBuffer | SharedArrayBuffer | Blob | ArrayBufferView) {
		if (this.socket.readyState === WebSocket.OPEN) {
			this.socket.send(data);
		} else {
			console.warn('⚠️ WebSocket이 연결되지 않았습니다. 메시지 전송 실패.');
		}
	}

	close() {
		this.socket.close();
	}
}

function createIsomorphicLink() {
	if (typeof window !== 'undefined') {
		const authLink = new ApolloLink((operation, forward) => {
			operation.setContext(({ headers = {} }) => ({
				headers: {
					...headers,
					...getHeaders(),
				},
			}));
			console.warn('requesting.. ', operation);
			return forward(operation);
		});

		// @ts-ignore
		const link = new createUploadLink({
			uri: process.env.REACT_APP_API_GRAPHQL_URL,
		});

		// WebSocket 구독 링크는 현재 사용하지 않음 (채팅은 별도 WebSocket 사용)
		// const wsLink = new WebSocketLink({
		// 	uri: process.env.REACT_APP_API_WS ?? 'ws://127.0.0.1:3007/graphql',
		// 	options: {
		// 		reconnect: true,
		// 		connectionParams: () => ({
		// 			Authorization: `Bearer ${getJwtToken()}`
		// 		}),
		// 	},
		// });

		const errorLink = onError(({ graphQLErrors, networkError }) => {
			if (graphQLErrors?.length) {
				graphQLErrors.forEach(({ message, locations, path }) => {
					console.log(`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`);
					
					// Agar message undefined bo'lsa, ishlatmaslik
					if (message && !message.includes("input")) {
						sweetErrorAlert(message);
					}
				});
			}

			if (networkError) {
				console.log(`[Network error]: ${networkError}`);
				// @ts-ignore
				if (networkError?.statusCode === 401) {
					// Token xatosi bo'lsa shu yerda ishlov beriladi
				}
			}
		});

		// 일반 HTTP 링크만 사용 (WebSocket 구독 없음)
		return from([errorLink, tokenRefreshLink, authLink.concat(link)]);
	}
}

function createApolloClient() {
	return new ApolloClient({
		ssrMode: typeof window === 'undefined',
		link: createIsomorphicLink(),
		cache: new InMemoryCache(),
		resolvers: {},
	});
}

export function initializeApollo(initialState = null) {
	const _apolloClient = apolloClient ?? createApolloClient();
	if (initialState) _apolloClient.cache.restore(initialState);
	if (typeof window === 'undefined') return _apolloClient;
	if (!apolloClient) apolloClient = _apolloClient;

	return _apolloClient;
}

export function useApollo(initialState: any) {
	return useMemo(() => initializeApollo(initialState), [initialState]);
}