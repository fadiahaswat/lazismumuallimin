// state.js

export let currentUser = null;

export function setCurrentUser(user) {
    currentUser = user;
}

export const donasiData = {
    type: null,
    subType: null,
    nominal: 0,
    nominalAsli: 0,
    nominalTotal: 0,
    kodeUnik: 0,
    donaturTipe: 'santri',
    isAlumni: false,
    alumniTahun: '',
    namaSantri: '',
    nisSantri: '',
    rombelSantri: '',
    nama: '',
    hp: '',
    email: '',
    alamat: '',
    doa: '',
    metode: null,
    nik: ''
};

export const riwayatData = {
    allData: [],
    isLoaded: false,
    currentPage: 1,
    itemsPerPage: 10,
    isLoading: false
};

export let timeFilterState = 'all';
export function setTimeFilterState(val) { timeFilterState = val; }

export const newsState = {
    page: 1,
    category: '',
    search: '',
    posts: [],
    isLoading: false,
    hasMore: true,
    isLoaded: false
};
