import React, { ChangeEvent, MouseEvent, useEffect, useState } from 'react';
import { NextPage } from 'next';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { Stack, Box, Button, Pagination } from '@mui/material';
import { Menu, MenuItem } from '@mui/material';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import AgentCard from '../../libs/components/common/AgentCard';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Member } from '../../libs/types/member/member';
import { useMutation, useQuery } from '@apollo/client';
import { LIKE_TARGET_MEMBER, LIKE_TARGET_PROPERTY } from '../../apollo/user/mutation';
import { GET_AGENTS, GET_PROPERTIES } from '../../apollo/user/query';
import { T } from '../../libs/types/common';
import { Message } from '../../libs/enums/common.enum';
import { Messages } from '../../libs/config';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const AgentList: NextPage = ({ initialInput, ...props }: any) => {
	const device = useDeviceDetect();
	const router = useRouter();
	const [anchorEl2, setAnchorEl2] = useState<null | HTMLElement>(null);
	const [filterSortName, setFilterSortName] = useState('Recent');
	const [sortingOpen, setSortingOpen] = useState(false);
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const [searchFilter, setSearchFilter] = useState<any>(
		router?.query?.input ? JSON.parse(router?.query?.input as string) : initialInput,
	);
	const [agents, setAgents] = useState<Member[]>([]);
	const [total, setTotal] = useState<number>(0);
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [searchText, setSearchText] = useState<string>('');

	/** APOLLO REQUESTS **/
	// Mutation yaratamiz, LIKE_TARGET_MEMBER - bu oldindan yozilgan GraphQL mutation query
	const [likeTargetMember] = useMutation(LIKE_TARGET_MEMBER);

	// Queryni bajarish uchun useQuery chaqiramiz va natijalarni destructuring qilamiz
	const {
		loading: getAgentsLoading,      // Query bajarilayotganda true bo'ladi
		data: getAgentsData,             // Serverdan olingan ma'lumotlar shu o'zgaruvchida saqlanadi
		error: getAgentsError,           // Agar so'rovda xatolik bo'lsa, shu o'zgaruvchi mavjud bo'ladi
		refetch: getAgentsRefetch,       // Queryni qayta qo'lda bajarish uchun funktsiya
	} = useQuery(GET_AGENTS, {          // GET_AGENTS - oldindan yozilgan GraphQL query
		
		// Ma'lumot har doim tarmoqdan olinadi, brauzer yoki cache-dan emas
		fetchPolicy: 'cache-and-network',    
		
		// Queryga o'tadigan parametrlar (bu yerda qidiruv filtri)
		variables: { input: searchFilter },
		
		// Tarmoq holati o'zgarganda (loading, refetch) komponentni qayta render qiladi
		notifyOnNetworkStatusChange: true,
		
		// Query muvaffaqiyatli yakunlanganda chaqiriladigan funksiya
		onCompleted: (data: T) => {
			console.log('✅ 백엔드에서 받은 데이터:', data);
			console.log('✅ 에이전트 리스트:', data?.getAgents?.list);
			console.log('✅ 총 개수:', data?.getAgents?.metaCounter[0]?.total);
			
			// Kelgan ma'lumotlardan agentlar ro'yxatini statega yozamiz
			setAgents(data?.getAgents?.list || []);
			// Agentlar soni yoki boshqa statistikani statega o'rnatamiz
			setTotal(data?.getAgents?.metaCounter[0]?.total || 0);
		},
		
		// Query xatolik bilan yakunlanganda chaqiriladigan funksiya
		onError: (error) => {
			console.error('❌ 백엔드 요청 오류:', error);
			console.error('❌ GraphQL 오류:', error.graphQLErrors);
			console.error('❌ 네트워크 오류:', error.networkError);
			sweetMixinErrorAlert(error.message).then();
		},
	});

	/** LIFECYCLES **/
	useEffect(() => {
		// 디버깅: 환경 변수와 설정 확인
		console.log('🔍 환경 변수 확인:');
		console.log('- REACT_APP_API_GRAPHQL_URL:', process.env.REACT_APP_API_GRAPHQL_URL);
		console.log('- REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
		console.log('- REACT_APP_API_WS:', process.env.REACT_APP_API_WS);
		console.log('🔍 현재 검색 필터:', searchFilter);
		
		if (router.query.input) {
			const input_obj = JSON.parse(router?.query?.input as string);
			setSearchFilter(input_obj);
		} else
			router.replace(`/agent?input=${JSON.stringify(searchFilter)}`, `/agent?input=${JSON.stringify(searchFilter)}`);

		setCurrentPage(searchFilter.page === undefined ? 1 : searchFilter.page);
	}, [router]);

	/** HANDLERS **/
	const sortingClickHandler = (e: MouseEvent<HTMLElement>) => {
		setAnchorEl(e.currentTarget);
		setSortingOpen(true);
	};

	const sortingCloseHandler = () => {
		setSortingOpen(false);
		setAnchorEl(null);
	};

	const sortingHandler = (e: React.MouseEvent<HTMLLIElement>) => {
		switch (e.currentTarget.id) {
			case 'recent':
				setSearchFilter({ ...searchFilter, sort: 'createdAt', direction: 'DESC' });
				setFilterSortName('Recent');
				break;
			case 'old':
				setSearchFilter({ ...searchFilter, sort: 'createdAt', direction: 'ASC' });
				setFilterSortName('Oldest order');
				break;
			case 'likes':
				setSearchFilter({ ...searchFilter, sort: 'memberLikes', direction: 'DESC' });
				setFilterSortName('Likes');
				break;
			case 'views':
				setSearchFilter({ ...searchFilter, sort: 'memberViews', direction: 'DESC' });
				setFilterSortName('Views');
				break;
		}
		setSortingOpen(false);
		setAnchorEl2(null);
	};

	const paginationChangeHandler = async (event: ChangeEvent<unknown>, value: number) => {
		searchFilter.page = value;
		await router.push(`/agent?input=${JSON.stringify(searchFilter)}`, `/agent?input=${JSON.stringify(searchFilter)}`, {
			scroll: false,
		});
		setCurrentPage(value);
	};

	const likeMemberHandler = async (user: any, id: string) => {
		try {
			if (!id) return;
			if (!user._id) throw new Error(Messages.error2);

			await likeTargetMember({
				variables: { input: id },
			});

			await getAgentsRefetch({ input: searchFilter });

			await sweetTopSmallSuccessAlert('success', 800);
		} catch (err: any) {
			console.log('Error, likePropertyHandler', err.message);
			sweetMixinErrorAlert(err.message).then();
		}
	};

	if (device === 'mobile') {
		return <h1>AGENTS PAGE MOBILE</h1>;
	} else {
		// 로딩 상태 표시
		if (getAgentsLoading) {
			return (
				<Stack className={'agent-list-page'} justifyContent="center" alignItems="center" sx={{ minHeight: '50vh' }}>
					<div>로딩 중...</div>
				</Stack>
			);
		}

		// 에러 상태 표시
		if (getAgentsError) {
			return (
				<Stack className={'agent-list-page'} justifyContent="center" alignItems="center" sx={{ minHeight: '50vh' }}>
					<div>에러가 발생했습니다: {getAgentsError.message}</div>
				</Stack>
			);
		}

		return (
			<Stack className={'agent-list-page'}>
				<Stack className={'container'}>
					<Stack className={'filter'}>
						<Box component={'div'} className={'left'}>
							<input
								type="text"
								placeholder={'Search for an agent'}
								value={searchText}
								onChange={(e: any) => setSearchText(e.target.value)}
								onKeyDown={(event: any) => {
									if (event.key == 'Enter') {
										setSearchFilter({
											...searchFilter,
											search: { ...searchFilter.search, text: searchText },
										});
									}
								}}
							/>
						</Box>
						<Box component={'div'} className={'right'}>
							<span>Sort by</span>
							<div>
								<Button onClick={sortingClickHandler} endIcon={<KeyboardArrowDownRoundedIcon />}>
									{filterSortName}
								</Button>
								<Menu anchorEl={anchorEl} open={sortingOpen} onClose={sortingCloseHandler} sx={{ paddingTop: '5px' }}>
									<MenuItem onClick={sortingHandler} id={'recent'} disableRipple>
										Recent
									</MenuItem>
									<MenuItem onClick={sortingHandler} id={'old'} disableRipple>
										Oldest
									</MenuItem>
									<MenuItem onClick={sortingHandler} id={'likes'} disableRipple>
										Likes
									</MenuItem>
									<MenuItem onClick={sortingHandler} id={'views'} disableRipple>
										Views
									</MenuItem>
								</Menu>
							</div>
						</Box>
					</Stack>
					<Stack className={'card-wrap'}>
						{agents?.length === 0 ? (
							<div className={'no-data'}>
								<img src="/img/icons/icoAlert.svg" alt="" />
								<p>No Agents found!</p>
							</div>
						) : (
							agents.map((agent: Member) => {
								return <AgentCard agent={agent} key={agent._id} likeMemberHandler={likeMemberHandler} />;
							})
						)}
					</Stack>
					<Stack className={'pagination'}>
						<Stack className="pagination-box">
							{agents.length !== 0 && Math.ceil(total / searchFilter.limit) > 1 && (
								<Stack className="pagination-box">
									<Pagination
										page={currentPage}
										count={Math.ceil(total / searchFilter.limit)}
										onChange={paginationChangeHandler}
										shape="circular"
										color="primary"
									/>
								</Stack>
							)}
						</Stack>

						{agents.length !== 0 && (
							<span>
								Total {total} agent{total > 1 ? 's' : ''} available
							</span>
						)}
					</Stack>
				</Stack>
			</Stack>
		);
	}
};

AgentList.defaultProps = {
	initialInput: {
		page: 1,
		limit: 10,
		sort: 'createdAt',
		direction: 'DESC',
		search: {},
	},
};

export default withLayoutBasic(AgentList);
