// File: data-santri.js

const rawSantriData = `
1A  21331  Januari
2A	11844	Adelio Daffa Syahrizha
2A	11853	Ahmad Ahsanur Rizqi
2A	11855	Ahmad Arkan Sya'bani
2A	11859	Ahmad Darwis
2A	11860	Ahmad Ghozi El Muntazhor
2A	11867	Aldan 'Izzul Islam
2A	11883	Arkana El Sabilly
2A	11893	Athaya Auza'i Mubarak
2A	11915	Dama Arza Evannova
2A	11916	Danar Nizam Daniswara
2A	11921	Devgan Jadid Sahlvatico
2A	11947	Fariq Imtiyas Aufaa Kamil
2A	11955	Fawwaz Elfareza Zuhri
2A	11956	Firaas Izzulhaq
2A	11963	Gilang Omar Fardad
2A	11976	Jaladri Arif Wirasena
2A	11985	Kemal Mubarak Siregar
2A	11986	Khairil Nizam
2A	11994	M. Fathan Alfarisi Harahap
2A	12004	Mirza Nasyath Ahza Attaillah
2A	12013	Muhammad Ahsani Taqwim
2A	12022	Muhammad Ayyub Al Fatih
2A	12138	Muhammad Farros Linggar Cahyono
2A	12028	Muhammad Fathir Alfalah
2A	12029	Muhammad Gibran Rafassya
2A	12074	Narendra Gerrardi Kusumah
2A	12075	Narendra Wibawa
2A	12077	Naufal Zhafran Purnama
2A	12108	Rijal Abdul'aziz
2A	12109	Rizki Chandra Dewantara
2B	11862	Ahmad Miqdad
2B	11866	Alano Faaiq Alfeno
2B	11880	Arfandhika Fakhrul Islam
2B	11898	Aydin Rafif
2B	11918	Danish Alzahid Dinasti
2B	11930	Dzaky Salman Al Farisi
2B	11961	Ghani Arif Witjaksono
2B	11967	Haidarrafid Satria Ardhana
2B	11974	Iqbal Zulfikar Al Hanif
2B	11977	Jangky Dausat
2B	11991	Kumara Banyu Argani
2B	12001	Mekha Ilham Lutfianto
2B	12014	Muhammad Aiman Naim
2B	12017	Muhammad Alvi Mumtaz Brillian Hafizh
2B	12139	Muhammad Dede Afkar
2B	12036	Muhammad Karel Ashiddiq
2B	12038	Muhammad Mahdi Hafidz
2B	12062	Muhammad Naufal Rasyid Arafi
2B	12072	Nahsif Ilman Hazim Purwono
2B	12076	Naufal Fahmi Darsono
2B	12078	Nawwaf Bahy Rafif
2B	12079	Nazhif Fahreza Zuhairy
2B	12084	Nizar Adhyatma Aryanda
2B	12093	Rafa Agitananda Az Zayyan
2B	12094	Rafa Faeyza Fa'iz
2B	12098	Rais Abqari Ash Shidqi
2B	12111	Rizqi Satria Putra Surya
2B	12125	Umar Ubaidillah Tsaqif
2B	12127	Wildan Faiz Mahendra
2B	12128	William Ramadhan Al Ghazali
2B	12134	Zia El Ibrahim Aqeela Putra Wijaya
2C	11837	Abid Fadhil Prasraya
2C	11846	Aditya Siddiq Ismoyo
2C	11848	Adyatma Abdi Danendra
2C	11865	Akram Saifuddin
2C	11889	Athala Maulana Syarief
2C	11896	Avicena Nafa Ghasani
2C	11909	Benhati Damaifajar Hayumarghi
2C	11924	Dhiyauddin Hanif Al Awwab
2C	11926	Dyandra Fajri Putra Ramadhan
2C	11941	Faiq Fauzil Adhim (Tahfidz)
2C	11942	Fairuz Azzam Mahfuzh (Tahfidz)
2C	11944	Fajar Cahya Rabbani
2C	11958	Furqon Ardhan Muthohar Rakasiwi
2C	11973	Ikhwan Labib Rozaqi
2C	12019	Muhammad Arkhan Attaqi (Tahfidz)
2C	12023	Muhammad Daffa Naufal Alaika (Tahfidz)
2C	12056	Muhammad Tsabit Arrafat
2C	12065	Muzakki Fairuzzaman (Tahfidz)
2C	12069	Nabil Ahmad Bashori
2C	12081	Neymar Tsaqif Hikmatyar (Tahfidz)
2C	12082	Nirio Nur Firdausiy Ahla
2C	12085	Novda Dama Santosa
2C	12097	Raihan Fatih
2C	12105	Rayyan Nafiz Ananta
2C	12106	Reyhan Mohammad Kenzie
2C	12107	Rifqi Maliki (Tahfidz)
2C	12117	Satriya Alvaro Putra
2C	12129	Yasykur Slamet 'abqariy (Tahfidz)
2C	12133	Zhafran Dhiaurrahman Hakim (Tahfidz)
2D	11840	Achmad Adi Darwis Elfaza (Tahfidz)
2D	11872	Alizufar Raffasya Sukriyana
2D	11884	Arsya Navarelo Al Islam
2D	11904	Azzam Amirudin Syamil
2D	11923	Dhika Muldan Mustari
2D	11934	El Faza Miracle Akram
2D	11954	Fauzil Habibi Irawan
2D	11959	Gagas Revolusi Bangsa
2D	11960	Galang Afkar Artyanto (Tahfidz)
2D	11962	Gilang Asytar Artyanto (Tahfidz)
2D	11979	Jawdan Hafidz Mumtazan
2D	11980	Juhdan Yusuf Ghaisan
2D	11984	Kayyis Hazim
2D	11988	Kim Kayana Omar Naveed
2D	11989	Kindi Abdullah Maulana
2D	11995	Mahardika Panji Wardhana
2D	11999	Maulana Yusuf Akbar Nuraga
2D	12000	Mawla Azmat Khan Al-Husayni
2D	12015	Muhammad Alif Al-Fatih (Tahfidz)
2D	12021	Muhamad Athoya Zain
2D	12026	Muhammad Faiz Ibnu Zakaria (Tahfidz)
2D	12027	Muhammad Farros Prasetyaning Pribadi
2D	12032	Muhammad Herdiansyah Al Faqih
2D	12039	Muhammad Mahdi Hanafi (Tahfidz)
2D	12040	Muhammad Muhdi Hafidz (Tahfidz)
2D	12066	Naazira Parsa
2D	12086	Oktaviano Aji Bagaskara
2D	12087	Pandu Arya Al-ghifari
2D	12110	Rizqi Ahmad Altaf Zafar (Tahfidz)
2D	12113	Rois Faraz Hanafie Triyono
2D	12122	Syafiq Faisal Hasan
2D	12131	Zabran Muhammad Athif
2E	11851	Aftah Munsyi' Alfikra
2E	11856	Ahmad Daffa Fahri Al Farabi
2E	11858	Ahmad Dahlan Harahap
2E	11861	Ahmad Mekail Zabriski
2E	11868	Alfarizqi Zaidan Nugroho
2E	11869	Alfian Atha Ramadhan
2E	11882	Arkan Fawazzi Kesturi
2E	11894	Ausath Amna
2E	11919	Danish Asshidiqie Pribadi
2E	11936	Evrizal Fasich Ilmi
2E	11948	Fasta Nirunabi Satriani Hadi Wijaya
2E	12141	Ganteng Sholih Sugiharto
2E	11966	Haidar Ali Mursyid
2E	11968	Halvens Asgafo Mohamad Ilfa Baraka
2E	11982	Karel Kavindra Agastya Putra Pradipta
2E	11996	Mahardika Prabhu Nusantara Pri Atmaji
2E	12007	Muadz Zidan Rahman
2E	12035	Muhammad Iqbal Sheehan Azizy
2E	12037	Muhammad Kholil Abdurohman
2E	12041	Muhammad Najib
2E	12044	Muhammad Raesa Fathan
2E	12047	Muhammad Rauf Janitra Handoko
2E	12052	Muhammad Sakhi Choirul Fata
2E	12057	Muhammad Vano Al Tsaqib
2E	12061	Muhammad Zhafran Al Farisi
2E	12064	Muzaffar Al Qashid
2E	12088	Prabu Yustisio Hakim Arisda
2E	12096	Rafi Ahnaf Juffri
2E	12102	Ranu Biruni
2E	12103	Rashya Hafiz Fadian
2E	12126	Vino Sebastian Adam
2F	11839	Abrisam Janitra Abimanyu
2F	11847	Adlan Muhammad Askari Arfa
2F	11874	Althaf Dinajed Rafsanjani
2F	11879	Arfan Satria Pratama
2F	11887	Assalum Dana Al Ukhra
2F	11891	Athallah Faris Kudus
2F	11900	Azka Maydan
2F	11907	Bahtiar Abid Sakhi
2F	11912	Cahya Ibnu Safarudin
2F	11913	Ciptaning Radito
2F	11914	Daffa Dzakka Al Ghani
2F	11917	Danendra Izzat Arfian
2F	11928	Dzaky Ammar Murad
2F	11932	Dzikri Fadillah Akbar
2F	11933	Edgar Atharizz Narottama Indrahayu
2F	11935	Emilio Valdano Danadyaksa
2F	11943	Faiz Azkan Niyafi
2F	11975	Irawan Atmojo Wibowo
2F	11978	Januar Putra Wijaya
2F	11981	Junnah Roghib Arroyyan Shopuanudin
2F	11990	Kumara Argani Azfar Husna
2F	12033	Muhammad Ihsan Faza
2F	12034	Muhammad Ilyas Al-Farizi
2F	12046	Muhammad Raihan Fakhri
2F	12055	Muhammad Syafiiq Azmi
2F	12068	Nabihan Sakhi Zaidan
2F	12089	R. Fahri Evano Isya Kholik
2F	12090	Radhi Ghiyast Mumtaz
2F	12118	Senggang Cakradara Rizky
2F	12124	Umar Muhtar
2F	12135	Zidniy Nuril Haq
2G	11838	Abieyacssa Ayubie Sunbastian
2G	11863	Ahnaf Hilmi Fahreza
2G	11870	Alfian Raffly Darmawan
2G	11886	Arzaki Azhar Nipdapratama
2G	11892	Athallah Izzat Rian Rasyaf Resyaban
2G	11905	Azzam Fakhriza Ilmi
2G	11908	Basyarajad Zayyan
2G	11922	Devin Agathon Muhammad Abnar Rajendra
2G	11929	Dzaky Anthony Akbar (Tahfidz)
2G	11940	Faheem Muhammad Akhtar
2G	11993	Leonard Fathaan Abqary Amrudin
2G	11997	Mahesa Arundaya Al-Abrar
2G	12003	Mirza Ahza Rais
2G	12018	Muhammad Alzamsyah Putra
2G	12020	Muhammad Arrayan Edgar Alvaro
2G	12031	Muhammad Hayfa Reza
2G	12137	Muhammad Jiddan Irfansyah
2G	12042	Muhammad Naufal Alfaris
2G	12050	Muhammad Rizky Wijaya
2G	12053	Muhammad Satria Ramadhan
2G	12059	Muhammad Zain Khan Abidin
2G	12140	Muwafaqi Amru Ahmad (Tahfidz)
2G	12083	Nizamul Haq Az Zuhri (keluar)
2G	12092	Radith Putra Andita
2G	12104	Rasya Muhammad Athaya Ardiansyah
2G	12112	Rizqy Fathu Ramadhan
2G	12132	Zavier Alvaro
2H	11835	Abdul Ghani Irfan Rafif (Tahfidz)
2H	11836	Abid Fadhil Abyah (Tahfidz)
2H	11843	Achmad Hanif Al Faris
2H	11850	Afif Akhsanul Muttaqin
2H	11857	Ahmad Dahlan Asy'ari (Tahfidz)
2H	11890	Athallah Azmi Ghaisan Muhammad (Tahfidz)
2H	11901	Azka Rafisqy Faeyza
2H	11902	Azmi Zulfadli Syafiq (Tahfidz)
2H	11903	Azri Labibul Khawarizmi (Tahfidz)
2H	11927	Dzaky Abbasy Ghaisan
2H	11931	Dzar Al Ghifari (Tahfidz)
2H	11937	Fadhil Atha Maulana
2H	11938	Fadil Abdul Natsir
2H	11952	Fatihan Al Ghifari RA (Tahfidz)
2H	11953	Fauzan Wildan Al-Insan
2H	12142	Hideaki Akhtar Yusuf
2H	11971	Hisyam Nabil Pasha (Tahfidz)
2H	11972	Ibadillah Kaiazmi Mubarak (Tahfidz)
2H	11983	Kashvi Jabbar Azana (Tahfidz)
2H	11987	Khawarizmi Fakhrulhaq (Tahfidz)
2H	12012	Muhammad Aghna Ilman Rafa (Tahfidz)
2H	12008	Muhammad Aziz Al Fatih Siregar
2H	12009	Muhammad Daffa Frananda Al Hafidz
2H	12010	Muhammad Naufal Alif (Tahfidz)
2H	12011	Muhammad Syafiq Yaqdhan
2H	12070	Nabil Hanafi Amarray
2H	12071	Nadif Adicandra
2H	12101	Ramadhan Dafa Rusydi
2H	12114	Royyan Abdurrahman Ibtisam (Tahfidz)
2H	12116	Sakhi Arkan Elfariza (Tahfidz)
3B	11535	Ahmad Azzam Huluq
3B	11541	Ahnaf Azizan Sasmito
3B	11544	Ajnata Haziq Abisatya Hayu Wardana (Tahfidz)
3B	11555	Arkan Araafi Ardian
3B	11559	Ashraf 'Ifathurrosydan (Tahfidz)
3B	11565	Aysar Sahwahita Darwisyi
3B	11573	Bilal Jibril
3B	11574	Bintang Revoluna Al Mahdi
3B	11577	Daffa Adyatama Abdullah
3B	11582	Devga Aulia
3B	11585	Dwi Rizky Fausta
3B	11586	Elka Maulana Iskandar (Tahfidz)
3B	11587	Fabiansyah Jumany Rizki
3B	11590	Fahmi Ahnaf Baihaqi (Tahfidz)
3B	11608	Firaz Tsaqeffano (Tahfidz)
3B	11647	Kanka Emiliano Al Arafat
3B	11670	Mirza Ghaisan Ramadhan
3B	11673	Mohammad Azzam Azinuddin
3B	11675	Mohammad Ihsan Kamil
3B	11684	Muhammad Alfan Arrasyid
3B	11693	Muhammad Atha Elhanani
3B	11702	Muhammad Dzaki Rian Putra (Tahfidz)
3B	11716	Muhammad Hafiz Ziyad
3B	11723	Muhammad Kafi
3B	11728	Muhammad Naufal Rasyiid Jaya
3B	11749	Muhammad Zaim Aditya
3B	11752	Muhammad Zidane Al Barraa
3B	11755	Narendra Alfarizqi Gayatra
3B	11763	Noersy Arkana Mahammada
3B	11769	Raden Hafi Muhadzdzib Hassan
3B	11810	Syabil Angkasa Putra Solissa
3B	11815	Thoriq Bil Furqon Lesmana
4C	11515	Abdilla Rousan Fikri Akbar
4C	11219	Ahmad Badir Hamam Zadisa
4C	11226	Ahmad Maududi Faqih
4C	11231	Ahmad Shiddiq Al Kariem
4C	11260	Arroyan Ulya Anwar (Tahfidz)
4C	11285	Chalis Zabadi Putra
4C	11310	Fahri Mirza Hanafi (Tahfidz)
4C	11319	Faqih Najwan Madani
4C	11349	Ibad Naufal Uthman
4C	11356	Isa Azatta Fadhlan Faiq
4C	11359	Juanda Pranata Ritonga
4C	11360	Juhdan Lintang Fahmi Habibi
4C	11373	M. Muttaqin Ar Rasyiid (Tahfidz)
4C	11379	Muh. Rifat Zehavi Yasmin
4C	11440	Muhamad Naufal Farisqi
4C	11385	Muhammad Al Fatih
4C	11394	Muhammad Azam Tawakkal
4C	11401	Muhammad Difa Ahnaf
4C	11407	Muhammad Fairuz Nafis Azzahir
4C	11418	Muhammad Fayyadh Irsyad
4C	11421	Muhammad Hilmi Rabbani Abdullah (Tahfidz)
4C	11435	Muhammad Kimi As Shidiqi
4C	11447	Muhammad Noval
4C	11451	Muhammad Rafha Noorzakki
4C	11453	Muhammad Rusyda Aiqona
4C	11455	Muhammad Tsaqib Arsalan Zain
4C	11465	Nasywa Tifatur Rasyid
4C	11470	Nico Ghulam Mustaqim
4C	11486	Raka Haidar Altaf
4C	11498	Shidiq Dwi Nur Rahman
4C	11499	Sholih Muhammad Faiq Ali Syahada
4C	11514	Zhafir Abhinaya Diera Riyadie
5D	10877	Abdillah Adlan Wicaksana
5D	10887	Ahmad Ali Daffa
5D	10891	Ahmad Muflih Satrio (Tahfidz)
5D	10897	Akhmad Ravi Dhanissworo
5D	10910	Arib Muhammad Hisyam (Tahfidz)
5D	10923	Athalla Aryaputra Widodo
5D	10949	Fachri Bagus Wibowo
5D	10952	Fairuz Fawwazul Akmal (Tahfidz)
5D	10956	Fa'iq Abiyyu Zuhri (Tahfidz)
5D	10959	Faiz Akmal Saifudin
5D	10963	Fakhri Luqman Affanny
5D	10984	Fikri Aziz Avrilian
5D	10991	Gusti Aditya
5D	11003	Intifadhah Al-Aqsha Anas
5D	11006	Izzudin Nawaf Hasan
5D	11016	Lintang Abdullah
5D	11032	Mirza Rafi Susanto
5D	11034	Mochammad Hilmy Izzudin Arrasyid
5D	11046	Muhammad Affan Fahrurrozi
5D	11061	Muhammad Bintang Al Hafidz (Tahfidz)
5D	11076	Muhammad Haedar Rizky Anwar
5D	11081	Muhammad Iqbal Azzahir
5D	11088	Muhammad Mannan Arrahmi
5D	11089	Muhammad Mufassyah Dewandaru (Tahfidz)
5D	11101	Muhammad Razzan Syahid
5D	11115	Muhammad Zahran Istaz Solichin
5D	11122	Nabil Abiyu Khairi
5D	11138	Nehan Kaysan Fikri Susilo (Tahfidz)
5D	11144	Pandya Aqila Rianto
5D	11163	Rasyiq Asyrafa Baihaqi
5D	11185	Yaafi Ramadhan Yugastian
5D	11186	Yafa Ghani Arrasyid
`;
