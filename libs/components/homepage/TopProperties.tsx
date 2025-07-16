import React, { useState } from 'react';
import { Stack, Box } from '@mui/material';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import WestIcon from '@mui/icons-material/West';
import EastIcon from '@mui/icons-material/East';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper';
import TopPropertyCard from './TopPropertyCard';
import { PropertiesInquiry } from '../../types/property/property.input';
import { Property } from '../../types/property/property';


import { useMutation, useQuery } from '@apollo/client';
import { GET_PROPERTIES } from '../../../apollo/user/query';
import { T } from '../../types/common';
import { LIKE_TARGET_PROPERTY } from '../../../apollo/user/mutation';
import { Message } from '../../enums/common.enum';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../sweetAlert';

interface TopPropertiesProps {
	initialInput: PropertiesInquiry;
}

const TopProperties = (props: TopPropertiesProps) => {
	const { initialInput } = props;
	const device = useDeviceDetect();
	const [topProperties, setTopProperties] = useState<Property[]>([]);

	/** APOLLO REQUESTS **/
// LIKE_TARGET_PROPERTY mutatsiyasini ishlatish uchun hook chaqiryapmiz
const [likeTargetProperty] = useMutation(LIKE_TARGET_PROPERTY); //datani doistruct qilamiz

// GET_PROPERTIES query orqali backenddan property ro‘yxatini olyapmiz
const {
	loading: getPropertiesLoading, // ma’lumotlar yuklanayotganini bildiradi (true/false)
	data: getPropertiesData, // backenddan kelgan property ro‘yxati
	error: getPropertiesError, // xatolik yuz bersa shu yerga tushadi
	refetch: getPropertiesRefetch, // queryni qaytadan ishga tushirish uchun funksiya
} = useQuery(GET_PROPERTIES, {
	fetchPolicy: 'cache-and-network', // avval cache'dan, keyin serverdan olib keladi
	variables: { input: initialInput }, // queryga yuboriladigan input (filter, page va h.k.)
	notifyOnNetworkStatusChange: true, // tarmoq holati o‘zgarsa komponent qayta render bo‘ladi
	onCompleted: (data: T) => {
		// query muvaffaqiyatli tugasa, kelgan listni statega saqlaymiz
		setTopProperties(data?.getProperties?.list);
	},
});

/** HANDLERS **/

// like bosilganda ishlaydigan funksiya
const likePropertyHandler = async (user: T, id: string) => {
	try {
		// agar id yo‘q bo‘lsa, funksiyani to‘xtatamiz
		if (!id) return;

		// agar user login qilmagan bo‘lsa, xatolik chiqaramiz
		if (!user._id) throw new Error(Message.NOT_AUTHENTICATED);

		// backendga like mutation yuboramiz
		await likeTargetProperty({
			variables: { input: id }, // mutation uchun input sifatida property ID yuboramiz
		});

		// like'dan keyin yangilangan ro‘yxatni qayta olib kelamiz
		await getPropertiesRefetch({ input: initialInput });

		// muvaffaqiyatli tugaganini foydalanuvchiga bildiruvchi alert
		await sweetTopSmallSuccessAlert('success', 800);
	} catch (err: any) {
		// agar xatolik bo‘lsa, konsolga chiqaramiz
		console.log('Error, likePropertyHandler', err.message);

		// foydalanuvchiga xatolik haqida alert ko‘rsatamiz
		sweetMixinErrorAlert(err.message).then();
	}
};

	if (device === 'mobile') {
		return (
			<Stack className={'top-properties'}>
				<Stack className={'container'}>
					<Stack className={'info-box'}>
						<span>Top properties</span>
					</Stack>
					<Stack className={'card-box'}>
						<Swiper
							className={'top-property-swiper'}
							slidesPerView={'auto'}
							centeredSlides={true}
							spaceBetween={15}
							modules={[Autoplay]}
						>
							{topProperties.map((property: Property) => {
								return (
									<SwiperSlide className={'top-property-slide'} key={property?._id}>
										<TopPropertyCard property={property}likePropertyHandler={likePropertyHandler} />
									</SwiperSlide>
								);
							})}
						</Swiper>
					</Stack>
				</Stack>
			</Stack>
		);
	} else {
		return (
			<Stack className={'top-properties'}>
				<Stack className={'container'}>
					<Stack className={'info-box'}>
						<Box component={'div'} className={'left'}>
							<span>Top properties</span>
							<p>Check out our Top Properties</p>
						</Box>
						<Box component={'div'} className={'right'}>
							<div className={'pagination-box'}>
								<WestIcon className={'swiper-top-prev'} />
								<div className={'swiper-top-pagination'}></div>
								<EastIcon className={'swiper-top-next'} />
							</div>
						</Box>
					</Stack>
					<Stack className={'card-box'}>
						<Swiper
							className={'top-property-swiper'}
							slidesPerView={'auto'}
							spaceBetween={15}
							modules={[Autoplay, Navigation, Pagination]}
							navigation={{
								nextEl: '.swiper-top-next',
								prevEl: '.swiper-top-prev',
							}}
							pagination={{
								el: '.swiper-top-pagination',
							}}
						>
							{topProperties.map((property: Property) => {
								return (
									<SwiperSlide className={'top-property-slide'} key={property?._id}>
										<TopPropertyCard property={property} likePropertyHandler={likePropertyHandler}/>
									</SwiperSlide>
								);
							})}
						</Swiper>
					</Stack>
				</Stack>
			</Stack>
		);
	}
};

TopProperties.defaultProps = {
	initialInput: {
		page: 1,
		limit: 8,
		sort: 'propertyRank',
		direction: 'DESC',
		search: {},
	},
};

export default TopProperties;
