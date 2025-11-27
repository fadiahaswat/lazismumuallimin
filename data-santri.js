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
