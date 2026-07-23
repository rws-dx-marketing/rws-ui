// One entry per UTC offset (offsets in minutes) for the event detail "View in my
// timezone" picker. Deliberately fixed-offset (not DST/IANA aware) so conversions
// are simple offset arithmetic. Labels use a single short representative region per
// offset — the script only uses `offset`, so the label is purely cosmetic.
export const timezones = [
	{ label: '(GMT-11:00) Midway', offset: -660 },
	{ label: '(GMT-10:00) Hawaii', offset: -600 },
	{ label: '(GMT-09:00) Alaska', offset: -540 },
	{ label: '(GMT-08:00) Pacific Time', offset: -480 },
	{ label: '(GMT-07:00) Mountain Time', offset: -420 },
	{ label: '(GMT-06:00) Central Time', offset: -360 },
	{ label: '(GMT-05:00) Eastern Time', offset: -300 },
	{ label: '(GMT-04:00) Atlantic Time', offset: -240 },
	{ label: '(GMT-03:30) Newfoundland', offset: -210 },
	{ label: '(GMT-03:00) Buenos Aires', offset: -180 },
	{ label: '(GMT-01:00) Azores', offset: -60 },
	{ label: '(GMT) London, Lisbon', offset: 0 },
	{ label: '(GMT+01:00) Berlin, Paris', offset: 60 },
	{ label: '(GMT+02:00) Athens, Cairo', offset: 120 },
	{ label: '(GMT+03:00) Moscow, Nairobi', offset: 180 },
	{ label: '(GMT+03:30) Tehran', offset: 210 },
	{ label: '(GMT+04:00) Dubai', offset: 240 },
	{ label: '(GMT+04:30) Kabul', offset: 270 },
	{ label: '(GMT+05:00) Karachi', offset: 300 },
	{ label: '(GMT+05:30) Mumbai, New Delhi', offset: 330 },
	{ label: '(GMT+05:45) Kathmandu', offset: 345 },
	{ label: '(GMT+06:00) Dhaka', offset: 360 },
	{ label: '(GMT+06:30) Yangon', offset: 390 },
	{ label: '(GMT+07:00) Bangkok', offset: 420 },
	{ label: '(GMT+08:00) Beijing, Hong Kong', offset: 480 },
	{ label: '(GMT+09:00) Tokyo, Seoul', offset: 540 },
	{ label: '(GMT+09:30) Adelaide', offset: 570 },
	{ label: '(GMT+10:00) Sydney', offset: 600 },
	{ label: '(GMT+11:00) New Caledonia', offset: 660 },
	{ label: '(GMT+12:00) Auckland', offset: 720 },
	{ label: '(GMT+13:00) Nukualofa', offset: 780 },
]

export default timezones
