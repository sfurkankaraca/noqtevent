# Spotify eşleştirme raporu

Bu dosya `scripts/supply-import/enrich-spotify.mjs` her koşuda ÜZERİNE YAZILIR (birikmez) — yalnız EN SON koşunun şüpheli/eşleşmeyen satırlarını gösterir.

Son çalıştırma: 2026-08-02T10:40:12.417Z (APPLY — yazıldı)

- Taranan sanatçı (spotify_artist_id boş): 494
- Otomatik eşleşen (uygulandı): 383
- Şüpheli (elle çözülmeli): 110
- Spotify'da hiç sonuç bulunamayan: 1

## Şüpheli eşleşmeler (110)

Panel linkine tıklayıp sanatçı formundaki "Spotify'dan doldur" arama kutusuyla doğru adayı seçip Uygula'ya basman yeterli.

### 7 Kocalı Hürmüz
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/64a1f475-e192-47d6-a239-9713dc161e1b
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "Erdal Güney" — popülerlik 50, 53.175 takipçi — https://open.spotify.com/artist/77PSs92ix6empuwnNuiwot
  - "Kıraç" — popülerlik 58, 722.945 takipçi — https://open.spotify.com/artist/4XYD8wP6f1sfLtWfrY1luF
  - "yirmi7" — popülerlik 52, 285.170 takipçi — https://open.spotify.com/artist/1vnJ4IgK3BOqkGQ38RqAvs

### Aleyna Aydın
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/49121473-871f-4ef0-ab6e-1f795cd68290
- Neden şüpheli: 2 AYNI isimli aday ve popülerlik farkı yetersiz (Δ=1, eşik=15)
- Spotify adayları:
  - "Aleyna Aydın" — popülerlik 1, 59 takipçi — https://open.spotify.com/artist/7kgW8uMiaVIAPCZkGTR6SE
  - "Umut Kaya" — popülerlik 49, 146.508 takipçi — https://open.spotify.com/artist/0yXr7HHsbJlVaU8kBhRcny
  - "Aleyna Aydın" — popülerlik 0, 11 takipçi — https://open.spotify.com/artist/1x4LwEMkBMX3FDHQ6Z7CZm

### Antalya Kum Heykel Festivali
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/8ac76afa-da36-49be-80a8-783023d759f3
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "Anatolia Sound" — popülerlik 49, 5.992 takipçi — https://open.spotify.com/artist/3tdHYzpltDAMb9CIuDRvSB
  - "Anatolian Rock Echoes" — popülerlik 41, 24.859 takipçi — https://open.spotify.com/artist/22mgK7Pga6o2pFr15yIFOF
  - "Ankara Echoes" — popülerlik 68, 76.150 takipçi — https://open.spotify.com/artist/18SuKvcITcf0mACwhitMeM

### Arctic Monkeys Tribute
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/019927a0-0e6d-4912-800c-667918160206
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "Arctic Monkeys" — popülerlik 87, 35.162.919 takipçi — https://open.spotify.com/artist/7Ln80lUS6He07XvHI8qqHH
  - "Arctic Monkeys Tribute Band" — popülerlik 0, 388 takipçi — https://open.spotify.com/artist/2hv9oBOxgWSFnZJPW6UL58
  - "Dolu Kadehi Ters Tut" — popülerlik 66, 3.310.041 takipçi — https://open.spotify.com/artist/0PhqM7UAxtvWYi5j4MwxSl

### Arem Özgüç - Armağan Aydın
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/2ff662ff-dc40-42d5-8037-e3b28d48f6cb
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "Arem Ozguc" — popülerlik 65, 106.600 takipçi — https://open.spotify.com/artist/5JJc8is4VzgOz8ZanDj18J
  - "Armağan Arslan" — popülerlik 32, 12.522 takipçi — https://open.spotify.com/artist/05Nugk9zeWH6WIYgPY1dBL
  - "Arman Aydin" — popülerlik 65, 65.366 takipçi — https://open.spotify.com/artist/4xklx5DAtVru5uf3vSXTgf

### Armağan Çağlayan
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/e6d7058d-e792-4293-a7ff-e6a097f110d0
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "Armağan Arslan" — popülerlik 32, 12.522 takipçi — https://open.spotify.com/artist/05Nugk9zeWH6WIYgPY1dBL
  - "Çağla" — popülerlik 58, 219.088 takipçi — https://open.spotify.com/artist/6z5LOKPoOll2mbBqsQrMqp
  - "Armağan Oruç" — popülerlik 39, 55.593 takipçi — https://open.spotify.com/artist/51q7Es8Chlm17m1HgcEoaZ

### Atakan Uysal
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/3729bf77-9c50-4e10-9f9d-955fc63b251e
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "Volkan Gunduz" — popülerlik 0, 218 takipçi — https://open.spotify.com/artist/43aa1mq70HznHpeg6YafjQ
  - "Atakan Ilgazdağ" — popülerlik 38, 13.479 takipçi — https://open.spotify.com/artist/2lazK6SUncqFuhbdlAPm4L
  - "Yüzyüzeyken Konuşuruz" — popülerlik 64, 3.019.174 takipçi — https://open.spotify.com/artist/7gobcoscOfsY0nOeqqFzvU

### Attila Szaniszló
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/16ffc689-074e-457d-a71a-e4db30663ba0
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "Attila Fias" — popülerlik 39, 4.198 takipçi — https://open.spotify.com/artist/3V1CgXZe3cFkJ9VDSeFKkl
  - "Attila Zoller" — popülerlik 11, 1.856 takipçi — https://open.spotify.com/artist/50bsdKkUBCPSIAirpRXmEV
  - "Attila Szabó" — popülerlik 27, 42 takipçi — https://open.spotify.com/artist/2rZVdjgYc5yku4YC3mOCH1

### Az Acılı
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/0c40a2ba-415d-487f-a430-9be8e9d83024
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "Azer Bülbül" — popülerlik 62, 1.525.954 takipçi — https://open.spotify.com/artist/2E7qpjo4NUBhV8tEUdPVkJ
  - "ACIOĞLU" — popülerlik 58, 28.962 takipçi — https://open.spotify.com/artist/7mfxvSBJMLHtKwCeo0vy6k
  - "Kıraç" — popülerlik 58, 722.945 takipçi — https://open.spotify.com/artist/4XYD8wP6f1sfLtWfrY1luF

### Barış Balkır
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/c1f4ff56-b194-4d7f-82c9-85135ac99616
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "Barış Çakır" — popülerlik 33, 5.241 takipçi — https://open.spotify.com/artist/4UXic6o2WzSQJwgMzAP32J
  - "Barış Akarsu" — popülerlik 53, 1.030.896 takipçi — https://open.spotify.com/artist/0rHmlPHC63IGBTrtQEdDw6
  - "Barış Manço" — popülerlik 62, 3.224.225 takipçi — https://open.spotify.com/artist/3eVuump9qyK0YCQQo4mKbc

### Barry Cant Swim
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/73c75725-41d4-4c53-8904-dcb419958522
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "Barry Can't Swim" — popülerlik 65, 319.958 takipçi — https://open.spotify.com/artist/0vTVU0KH0CVzijsoKGsTPl
  - "Oceanvs Orientalis" — popülerlik 45, 112.417 takipçi — https://open.spotify.com/artist/3gNEIgLeknpwkNViU8WAhg
  - "BARRISO" — popülerlik 33, 65 takipçi — https://open.spotify.com/artist/75Gc1fyHbpVDyL8u0RqI4a

### Baturay Özdemir
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/8db51428-2930-44b4-80cd-c72fbd92db87
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "Mavi Gri" — popülerlik 58, 1.707.401 takipçi — https://open.spotify.com/artist/4otJVkrLLqDF8OxFJOigme
  - "Buray" — popülerlik 62, 2.143.616 takipçi — https://open.spotify.com/artist/1qZ684TB9E1BjH58btdtYd
  - "Barış Manço" — popülerlik 62, 3.224.225 takipçi — https://open.spotify.com/artist/3eVuump9qyK0YCQQo4mKbc

### BERENALP
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/c364b4c7-83cd-437e-9178-cc7ae85787fe
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "Berliner Philharmoniker" — popülerlik 73, 289.470 takipçi — https://open.spotify.com/artist/6uRJnvQ3f8whVnmeoecv5Z
  - "Gael Garcia Bernal" — popülerlik 59, 25.006 takipçi — https://open.spotify.com/artist/09oR0uKhqwScsKa2eUK97p
  - "Berk Baysal" — popülerlik 50, 80.007 takipçi — https://open.spotify.com/artist/54R13HT0PZ7sa6xMm9YpDS

### Binnur Kaya
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/1c9e6860-c040-46a5-82b1-42783f9b9759
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "Umut Kaya" — popülerlik 49, 146.508 takipçi — https://open.spotify.com/artist/0yXr7HHsbJlVaU8kBhRcny
  - "Kayra" — popülerlik 59, 451.310 takipçi — https://open.spotify.com/artist/5UqZ7BXoccyvTHyXLk1Pk3
  - "Kayahan" — popülerlik 53, 414.756 takipçi — https://open.spotify.com/artist/71wTGSTWEPSLnfe7tA2wkX

### Çağla Şıkel
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/931e53cd-dd90-460b-b120-5b3069b9751f
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "Çağla Şıkel Altuğ" — popülerlik 0, 32 takipçi — https://open.spotify.com/artist/7MPmFnUt78jEm2QZlIuTXD
  - "Çağla" — popülerlik 58, 219.088 takipçi — https://open.spotify.com/artist/6z5LOKPoOll2mbBqsQrMqp
  - "Çağrı Çelik" — popülerlik 50, 60.009 takipçi — https://open.spotify.com/artist/7wqnPyXma7EKSYt4CVzNjq

### Çağrı Sertel Trio
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/224e585b-5075-4fb4-bf7f-98fbefd01e68
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "Çağrı Sertel" — popülerlik 24, 7.623 takipçi — https://open.spotify.com/artist/76Ldoh2j78nY2ThwAuFkBT
  - "Sertaç Özgümüş" — popülerlik 42, 8.395 takipçi — https://open.spotify.com/artist/34zyQFJoKEfOyCBLmb1WjT
  - "Taksim Trio" — popülerlik 32, 50.534 takipçi — https://open.spotify.com/artist/5rWGIr699je11ELP9xW5T2

### Can Ozan
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/2bd6527b-c06d-40dd-8d0e-18d6a383f078
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "Canozan" — popülerlik 62, 816.481 takipçi — https://open.spotify.com/artist/4MUb8ilmrxyePXwSkG31lC
  - "Dolu Kadehi Ters Tut" — popülerlik 66, 3.310.041 takipçi — https://open.spotify.com/artist/0PhqM7UAxtvWYi5j4MwxSl
  - "Kendimden Hallice" — popülerlik 54, 413.043 takipçi — https://open.spotify.com/artist/7sAmHLY4Fs2rweYwdcQtft

### Cem İşçiler
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/fbf34e5f-5862-4c40-85c8-e61982704443
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "Çimen Show" — popülerlik 0, 975 takipçi — https://open.spotify.com/artist/7v5qhU8coYAk2PTztPQ4T4
  - "Cem Karaca" — popülerlik 56, 2.075.128 takipçi — https://open.spotify.com/artist/1lIbZfJvMQRqzhtCQsg5EI
  - "Cem Yıldız" — popülerlik 50, 31.733 takipçi — https://open.spotify.com/artist/3SASCp3Mzy7lT50cZn11yr

### Ceyhun Güneş
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/7c65dc96-25d9-4111-9d8a-149590a280c2
- Neden şüpheli: 3 AYNI isimli aday ve popülerlik farkı yetersiz (Δ=6, eşik=15)
- Spotify adayları:
  - "Ceyhun Güneş" — popülerlik 5, 1.511 takipçi — https://open.spotify.com/artist/2gsIJX4bhdRW1qlqKgsdtt
  - "Ceyhun Güneş" — popülerlik 11, 89 takipçi — https://open.spotify.com/artist/4O53E408aOvQL75kw3cboU
  - "Ceyhun Güneş" — popülerlik 3, 63 takipçi — https://open.spotify.com/artist/7DS75sC0g9C47x1ozlWs49

### Cihat Tamer
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/77a7628a-c489-4ab2-9415-8c04c6f144ea
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "Cihat Aşkın" — popülerlik 42, 40.437 takipçi — https://open.spotify.com/artist/70Pd24dGHmi567doblj8zN
  - "Cihan Mürtezaoğlu" — popülerlik 50, 217.960 takipçi — https://open.spotify.com/artist/6qphxvmoZkBRhPV3Ohb6j2
  - "Ceza" — popülerlik 62, 5.417.781 takipçi — https://open.spotify.com/artist/28Qbi9jTj2eej21P2mImZI

### Cristina Aguilera
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/d19621da-f076-4343-9c2a-9c31e2f83b0d
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "Christina Aguilera" — popülerlik 80, 9.873.754 takipçi — https://open.spotify.com/artist/1l7ZsJRRS8wlW3WfJfPfNS
  - "Britney Spears" — popülerlik 84, 19.771.008 takipçi — https://open.spotify.com/artist/26dSoYclwsYLMAKD3tpOr4
  - "Akon" — popülerlik 86, 6.929.286 takipçi — https://open.spotify.com/artist/0z4gvV4rjIZ9wHck67ucSV

### Demet Akbağ
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/c47eeeb1-6b99-49d4-92f5-d2d839c498e4
- Neden şüpheli: 2 AYNI isimli aday ve popülerlik farkı yetersiz (Δ=0, eşik=15)
- Spotify adayları:
  - "Demet Akbağ" — popülerlik 5, 12 takipçi — https://open.spotify.com/artist/6XgXumA5Ot9BOPLQmAptjP
  - "Ata Demirer" — popülerlik 43, 43.227 takipçi — https://open.spotify.com/artist/7nAno9XIXRqSsdS1YH0sop
  - "Demet Akbağ" — popülerlik 5, 225 takipçi — https://open.spotify.com/artist/0odLXZPbOaNKgP3xjZEq2d

### Deniz Tekin Akustik
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/aebcf88c-6d86-4acf-be09-0c1da882272c
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "Deniz Tekin" — popülerlik 49, 552.697 takipçi — https://open.spotify.com/artist/4TdvNk4wmn5DgBFiLDeCj0
  - "Deniz Seki" — popülerlik 55, 665.641 takipçi — https://open.spotify.com/artist/28bHkFlKKHHudmgvnfYpiJ
  - "Pinhani" — popülerlik 62, 2.429.211 takipçi — https://open.spotify.com/artist/4Bdqzh78prwuqwInMb555P

### Derdo Disco
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/e0c84c5c-4cd8-4b97-8fa5-a8278a780b9c
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "Hey! Douglas" — popülerlik 37, 74.982 takipçi — https://open.spotify.com/artist/72xb37kgUWGPVJqqBFhGKq
  - "Armageddon Turk" — popülerlik 28, 7.808 takipçi — https://open.spotify.com/artist/3Gycw1NhdzkMYeu61oOKEL
  - "Ipek Ipekcioglu" — popülerlik 27, 15.515 takipçi — https://open.spotify.com/artist/1um0J8hUc9J7YH240ZXh3p

### Discman 90'lar
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/8747b3a2-b63d-4eaa-9907-a494a4e9d42b
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "Duman" — popülerlik 65, 7.876.654 takipçi — https://open.spotify.com/artist/6RTC1abMgBC7Krg6qJQHJh
  - "Model" — popülerlik 65, 1.892.902 takipçi — https://open.spotify.com/artist/23xJQJM7peht77DF6YNEoq
  - "Ceza" — popülerlik 62, 5.417.781 takipçi — https://open.spotify.com/artist/28Qbi9jTj2eej21P2mImZI

### DJ Ali Taş
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/63327f2d-fa25-4116-a651-6d959746815d
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "ALIZADE" — popülerlik 62, 690.629 takipçi — https://open.spotify.com/artist/1EPZusBDP8yewhsaKtwktz
  - "Dj Alitas" — popülerlik 18, 2.553 takipçi — https://open.spotify.com/artist/4KZGkCDgENL8sv0B1eK0Yi
  - "Yalın" — popülerlik 72, 2.951.701 takipçi — https://open.spotify.com/artist/46zuW8tHxwahYn7VNMgYTa

### DJ Burak Yeter
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/3fe3a790-572e-4a03-9e18-b7de0dc37d17
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "Burak Yeter" — popülerlik 62, 189.963 takipçi — https://open.spotify.com/artist/4ON1ruy5ijE7ZPQthbrkgI
  - "AY YOLA" — popülerlik 40, 34.396 takipçi — https://open.spotify.com/artist/3OSykhRUqDpjUWLjnDz9Lz
  - "Uğur Işılak" — popülerlik 49, 61.942 takipçi — https://open.spotify.com/artist/65Yc24XPBKMWz6oOWOX7Xx

### DJ Faruk Koç
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/58e4c4fa-297f-4d40-90a8-d32f35eb79c5
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "Faruk Sabanci" — popülerlik 48, 24.134 takipçi — https://open.spotify.com/artist/7nPbrzSt1apQM9rY5DVqQZ
  - "Faruk Orakci" — popülerlik 18, 2.029 takipçi — https://open.spotify.com/artist/2jjH04yNhYlg9ELbQnzEGe
  - "Faruk Aydın" — popülerlik 32, 4.562 takipçi — https://open.spotify.com/artist/1U9ddnu5SUxHeBPFIsquil

### DJ Fırat Canpolat
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/73a3bea7-a12a-44ba-89d3-659623d373f2
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "Sagopa Kajmer" — popülerlik 68, 5.654.081 takipçi — https://open.spotify.com/artist/1KXTegXtnCPKXjRaX1llcD
  - "Ezhel" — popülerlik 72, 7.314.093 takipçi — https://open.spotify.com/artist/6LnJKrtFnTEGdbWQ2riWCL
  - "Fırat Tanış" — popülerlik 45, 24.529 takipçi — https://open.spotify.com/artist/1AMxbM8JPoryu2bTtRDHZJ

### Dj Mien
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/929d434d-919a-459d-b64b-c967e4194fb5
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "DJ MENOR DA ZN" — popülerlik 42, 25.970 takipçi — https://open.spotify.com/artist/7GwhJndjWpGB4APQOWpD22
  - "Dj Mehmet Tekin" — popülerlik 45, 60.298 takipçi — https://open.spotify.com/artist/2GglhrCoEtYgpItZzk6Y72
  - "DJ Menezes" — popülerlik 49, 22.579 takipçi — https://open.spotify.com/artist/12ayBbABWnctytOKqQwMyr

### DJ Pınar Alkan
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/cab35882-253b-4705-93b1-0510e426d1da
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "Pınar Soykan" — popülerlik 59, 15.318 takipçi — https://open.spotify.com/artist/7pTztLjOOA9VWk2E0rYQkJ
  - "Pinhani" — popülerlik 62, 2.429.211 takipçi — https://open.spotify.com/artist/4Bdqzh78prwuqwInMb555P
  - "Tarkan" — popülerlik 71, 4.380.115 takipçi — https://open.spotify.com/artist/2yMN0IP20GOaN6q0p0zL5k

### Doğan Tunçel
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/e76a4bdc-f2f5-48db-99ae-78b32db4bb38
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "TUANA" — popülerlik 57, 153.020 takipçi — https://open.spotify.com/artist/2FkaZzzDTwnz1l1mK9DoT6
  - "Doğan Duru" — popülerlik 39, 25.367 takipçi — https://open.spotify.com/artist/4CZGnes6EACvjaBM4kmzeb
  - "Doğan Canku" — popülerlik 36, 34.908 takipçi — https://open.spotify.com/artist/7lAMAZizRgc9vwXHQOULe4

### Doksanlar Diskosu
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/c50a7f84-f781-4fe9-89e4-1d74ca79b194
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "Model" — popülerlik 65, 1.892.902 takipçi — https://open.spotify.com/artist/23xJQJM7peht77DF6YNEoq
  - "Dolu Kadehi Ters Tut" — popülerlik 66, 3.310.041 takipçi — https://open.spotify.com/artist/0PhqM7UAxtvWYi5j4MwxSl
  - "Duman" — popülerlik 65, 7.876.654 takipçi — https://open.spotify.com/artist/6RTC1abMgBC7Krg6qJQHJh

### Dorian
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/d885a4e5-92d7-4721-a793-9a9ec324ddba
- Neden şüpheli: 2 AYNI isimli aday ve popülerlik farkı yetersiz (Δ=10, eşik=15)
- Spotify adayları:
  - "Dorian" — popülerlik 32, 4.864 takipçi — https://open.spotify.com/artist/2g8FkuePtQ6mFyubppvy4C
  - "DORIAN" — popülerlik 42, 25.488 takipçi — https://open.spotify.com/artist/5CSpDCJ82F842jVdnw2vWZ
  - "Dorian Concept" — popülerlik 54, 139.962 takipçi — https://open.spotify.com/artist/2sriRQRt36DnfHtD68zZlj

### Egemen Şimşek
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/b8481803-0432-4a7a-8933-a9f6a9827daa
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "EGE!" — popülerlik 65, 152.390 takipçi — https://open.spotify.com/artist/5chlGLYjNChbXjDbojObt5
  - "Egemen Akkol" — popülerlik 30, 8.987 takipçi — https://open.spotify.com/artist/0ElJABfA5B9H3gSqB6wf4l
  - "Ege" — popülerlik 45, 129.783 takipçi — https://open.spotify.com/artist/3nmYPDXqMqkNIujfm9wGDg

### Ekin Cengizkan
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/9c53cec0-1a20-447f-8cef-398c3b201f47
- Neden şüpheli: 2 AYNI isimli aday ve popülerlik farkı yetersiz (Δ=1, eşik=15)
- Spotify adayları:
  - "Ekin Cengizkan" — popülerlik 1, 143 takipçi — https://open.spotify.com/artist/7dgslZjXYFQPGKJbDWbnlm
  - "Ekin Cengizkan" — popülerlik 0, 1 takipçi — https://open.spotify.com/artist/7nl8JjnrshMQl1swB86Hy8
  - "Erkin Koray" — popülerlik 53, 836.370 takipçi — https://open.spotify.com/artist/4o3Nv2BAyoZkyGaRXv4rT3

### Ekin Su Paker
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/033bd622-4d56-49ec-a94d-a3f0052816c3
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "Ekin Uzunlar" — popülerlik 52, 406.476 takipçi — https://open.spotify.com/artist/35ngoeYRyOveM0rPvahkot
  - "Ekin Kayatekin" — popülerlik 12, 95 takipçi — https://open.spotify.com/artist/1KPGoF8Lbf3DTZK4aIk6iR
  - "Ekin" — popülerlik 8, 167 takipçi — https://open.spotify.com/artist/5dsNTJwPGzPJfV0CIQzMuW

### El Maria
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/b8da36c4-cc2a-4594-af82-e649370b9996
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "The Marías" — popülerlik 83, 5.254.009 takipçi — https://open.spotify.com/artist/2sSGPbdZJkaSE2AbcGOACx
  - "Maria Becerra" — popülerlik 78, 9.134.070 takipçi — https://open.spotify.com/artist/1DxLCyH42yaHKGK3cl5bvG
  - "Robert Rodriguez" — popülerlik 26, 8.446 takipçi — https://open.spotify.com/artist/49VlDIG7Dw8raSByeCKXF6

### Elena Pavla
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/13c39a17-f0ea-4dd5-a4d1-87c4cab924d2
- Neden şüpheli: 2 AYNI isimli aday ve popülerlik farkı yetersiz (Δ=3, eşik=15)
- Spotify adayları:
  - "Elena Pavla" — popülerlik 3, 2.076 takipçi — https://open.spotify.com/artist/1jiZIShzvbroGfPJe2ib0i
  - "Helena Paparizou" — popülerlik 50, 195.471 takipçi — https://open.spotify.com/artist/7D7k550IB6EszWmzVVCJSK
  - "ELENA PAVLA" — popülerlik 0, 1.014 takipçi — https://open.spotify.com/artist/6aCXCKKPKwuci2w69xayDt

### Emircan İğrek
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/649b73a0-5375-4007-80b6-37cece28947f
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "Emir Can İğrek" — popülerlik 67, 3.286.705 takipçi — https://open.spotify.com/artist/4XP7cGw4t8BqZ8Du5q3bHg
  - "Emir" — popülerlik 50, 249.750 takipçi — https://open.spotify.com/artist/052U3i0lM0CeCkJRrES8XK
  - "emir taha" — popülerlik 42, 64.155 takipçi — https://open.spotify.com/artist/1zofEGCCvRwAdhetK573gb

### Emrah
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/7308f99e-51e2-422a-9fd9-27c7cca553c4
- Neden şüpheli: 2 AYNI isimli aday ve popülerlik farkı yetersiz (Δ=4, eşik=15)
- Spotify adayları:
  - "Emrah" — popülerlik 45, 218.745 takipçi — https://open.spotify.com/artist/7fq3nZT2euZJrDRkV0u5Oe
  - "Emrah Karaduman" — popülerlik 58, 513.564 takipçi — https://open.spotify.com/artist/7FvMAbdiffitFmbuJN3Vsk
  - "Emrah" — popülerlik 41, 99.000 takipçi — https://open.spotify.com/artist/4aL5skAlrmagFwCx6OXKPr

### Engin Hepileri
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/b26d4394-ebfc-4c1a-aa9e-cf9e139f9860
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "ENGIN" — popülerlik 31, 23.979 takipçi — https://open.spotify.com/artist/2iINz7L7OFlJmxVndzlWEg
  - "Engin Can" — popülerlik 38, 32.071 takipçi — https://open.spotify.com/artist/6bROVpgpcRwM7FQqpiPak6
  - "Engin Nursani" — popülerlik 56, 220.674 takipçi — https://open.spotify.com/artist/77F1glwWTaaPwiK1QLzPMS

### Erdem Akakçe
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/6d5dff8f-b52f-4c1a-9eaf-7570edb32fb5
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "Erdem Akın" — popülerlik 35, 16.017 takipçi — https://open.spotify.com/artist/5tzsJRywNZVaUY0ucFxr0D
  - "Erdem Kınay" — popülerlik 57, 229.824 takipçi — https://open.spotify.com/artist/4aCS0WLLZ3070ZDBOFJlHB
  - "Ersin Gürler Akan" — popülerlik 44, 6.815 takipçi — https://open.spotify.com/artist/6LcAv1N1Lxglpz3DyMw3VJ

### Ezgi
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/a5946bc9-961d-4b70-bd48-66351e2347bd
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "Ezginin Günlügü" — popülerlik 49, 348.033 takipçi — https://open.spotify.com/artist/6WDnC2nx6hEPdtcU2LLGtE
  - "Ezgili Türküler" — popülerlik 34, 1.422 takipçi — https://open.spotify.com/artist/16WuwqaEhiTE26mwQ52kcT
  - "Ezgi Erdoğan" — popülerlik 48, 16.195 takipçi — https://open.spotify.com/artist/04E93fjneJyca3DegcGoTk

### Faruk Kalaycı
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/53011e13-73ab-4f90-866b-712f428d9a91
- Neden şüpheli: 2 AYNI isimli aday ve popülerlik farkı yetersiz (Δ=0, eşik=15)
- Spotify adayları:
  - "Faruk Kalaycı" — popülerlik 0, 33 takipçi — https://open.spotify.com/artist/1F402W8QtRc5tOk6fWrWEj
  - "Faruk Kalayci" — popülerlik 0, 19 takipçi — https://open.spotify.com/artist/4LJ28CeaWocm5Jo2l2jTnW
  - "Faruk Sabanci" — popülerlik 48, 24.134 takipçi — https://open.spotify.com/artist/7nPbrzSt1apQM9rY5DVqQZ

### Fatih Koyunoğlu
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/a6527620-f5e0-468c-b015-d09f06f9b1cd
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "Fatih Koca" — popülerlik 28, 17.602 takipçi — https://open.spotify.com/artist/7EACn5pmMjnpe4GyEFnR2e
  - "Fatih Bulut" — popülerlik 48, 84.291 takipçi — https://open.spotify.com/artist/4QYrSz56GbbWzazB3ykW7G
  - "Fatih Çollak" — popülerlik 48, 11.733 takipçi — https://open.spotify.com/artist/6crA758RAnSGSaWqpaDtmS

### Fatysh
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/9b607d56-c676-4623-bb35-2f485cd64b71
- Neden şüpheli: 2 AYNI isimli aday ve popülerlik farkı yetersiz (Δ=0, eşik=15)
- Spotify adayları:
  - "Fatysh" — popülerlik 0, 29 takipçi — https://open.spotify.com/artist/76PA9SD0otTaMniZmZZ38n
  - "Fatysh" — popülerlik 0, 5 takipçi — https://open.spotify.com/artist/4q4xMGVi2zfYZ4wdrAZM4D
  - "Fatma Turgut" — popülerlik 56, 781.542 takipçi — https://open.spotify.com/artist/1dsKaRPU3HFSdlNyMmH5QI

### Ferdi Akarnur
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/a4d803e5-5c67-40f7-8375-be9e722df8e4
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "Ferdi Tayfur" — popülerlik 60, 1.488.291 takipçi — https://open.spotify.com/artist/6WLkcqDXHgfe80TNMH1C5z
  - "Feride Hilal Akın" — popülerlik 52, 1.001.149 takipçi — https://open.spotify.com/artist/2dLBhX7dIdWL6Fsk9l0n1n
  - "Ferdi Özbeğen" — popülerlik 60, 360.764 takipçi — https://open.spotify.com/artist/2bZXmEbQuj9XcGwgyIGuit

### Flashback 90'lar Türkçe Pop Gecesi
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/6c4640c9-649e-403f-80ce-14e2c8ba8da4
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "BLOK3" — popülerlik 80, 8.116.375 takipçi — https://open.spotify.com/artist/1GMwSpFzrLd12jUX15bHB6
  - "Sezen Aksu" — popülerlik 73, 15.301.838 takipçi — https://open.spotify.com/artist/64d1rUxfizSAOE9UbMnUZd
  - "maNga" — popülerlik 59, 2.801.733 takipçi — https://open.spotify.com/artist/7rEIUw67hRTgievwuKQGSj

### Fosil
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/e3050d2f-8eb4-48ec-818e-bdbff39f3ba3
- Neden şüpheli: 3 AYNI isimli aday ve popülerlik farkı yetersiz (Δ=1, eşik=15)
- Spotify adayları:
  - "Fosil" — popülerlik 1, 543 takipçi — https://open.spotify.com/artist/6dSi17FKJ1SP3UfzQfDrpa
  - "Fosil" — popülerlik 0, 1 takipçi — https://open.spotify.com/artist/0cyvZw6zpUdimdA17SBLxz
  - "Fosil" — popülerlik 0, 168 takipçi — https://open.spotify.com/artist/1x4TRK4y8un8HHtslbJ8Bn

### GARAN GARAN
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/f8f0321f-b16c-4427-85fb-b0967467b84b
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "The Egyptian Lover" — popülerlik 47, 91.220 takipçi — https://open.spotify.com/artist/6GGVr7WgIWhsnJNdGyPklP
  - "Kara Karayev" — popülerlik 7, 1.717 takipçi — https://open.spotify.com/artist/4unl9L9omWLt5LlcyobLHw
  - "BLOK3" — popülerlik 80, 8.116.375 takipçi — https://open.spotify.com/artist/1GMwSpFzrLd12jUX15bHB6

### Gökhan Ünver
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/e3648755-590c-4981-9560-d97fcac3fc1a
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "Gökhan Türkmen" — popülerlik 66, 1.640.034 takipçi — https://open.spotify.com/artist/4uGB0nZ5d1iCXS3sHR3pzm
  - "Gökhan Özen" — popülerlik 57, 565.520 takipçi — https://open.spotify.com/artist/3QLMLmISoZnFxUdzSoT6JB
  - "Gökhan Kırdar" — popülerlik 45, 103.511 takipçi — https://open.spotify.com/artist/0iTcX6LMMIt0DeYJ3qBSQX

### Hakan Bilgin
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/fe371b03-0ad5-4a41-a790-ef24414a600f
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "Hakan Kılınç" — popülerlik 15, 559 takipçi — https://open.spotify.com/artist/5iq9EHglioaz4pVoNTZBey
  - "Hakan Altun" — popülerlik 54, 989.956 takipçi — https://open.spotify.com/artist/2AhmWHekrahJri4f5e08Tf
  - "Hakan Peker" — popülerlik 54, 220.881 takipçi — https://open.spotify.com/artist/7x1sEYcPJvLBwweGlIcapC

### İlker Gümüşoluk
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/12cecb27-f5fc-4a21-8363-cf0bd7200d63
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "İlker Gürsan" — popülerlik 42, 29.567 takipçi — https://open.spotify.com/artist/1jUVWSOulvVnSLCAUNlptV
  - "Toygar Işıklı" — popülerlik 61, 454.976 takipçi — https://open.spotify.com/artist/2l0Ol9ASKE7E196nHpblB7
  - "İkilem" — popülerlik 57, 380.089 takipçi — https://open.spotify.com/artist/4hjJDrv2KkIEW1AslTEtv3

### jtamul
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/1c931f4b-74dc-4330-bc16-804789d3a5af
- Neden şüpheli: 2 AYNI isimli aday ve popülerlik farkı yetersiz (Δ=5, eşik=15)
- Spotify adayları:
  - "Jtamul" — popülerlik 5, 672 takipçi — https://open.spotify.com/artist/7l5AhyqvVmhqtEwbmL90Uq
  - "jtamul" — popülerlik 0, 9 takipçi — https://open.spotify.com/artist/3PK4KRed2EaBnhoGjBBjIv
  - "Jamal Aliyev" — popülerlik 26, 8.987 takipçi — https://open.spotify.com/artist/57mVIxJ9t0acqvtLuG0TzU

### Kemal Başar
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/a8d1d038-8ed7-4d99-8982-9f61d3a6f4a7
- Neden şüpheli: 2 AYNI isimli aday ve popülerlik farkı yetersiz (Δ=0, eşik=15)
- Spotify adayları:
  - "Kemal Başar" — popülerlik 0, 111 takipçi — https://open.spotify.com/artist/7cYbqEM7UN0dcyo5Xn36su
  - "Kemal Başar" — popülerlik 0, 1 takipçi — https://open.spotify.com/artist/1JuwFXqkAT8uP56bWfg7VB
  - "Kemal Baş" — popülerlik 17, 79 takipçi — https://open.spotify.com/artist/3CjM3fK9cZba46EoxvkDLp

### Kıvanç Kasar
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/99d42484-54ca-4f8c-aece-31ff23d2f985
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "Kivanch K" — popülerlik 22, 709 takipçi — https://open.spotify.com/artist/1OouAtcKfAtWUce8iURaoq
  - "Kıraç" — popülerlik 58, 722.945 takipçi — https://open.spotify.com/artist/4XYD8wP6f1sfLtWfrY1luF
  - "Ciwan Haco" — popülerlik 53, 241.254 takipçi — https://open.spotify.com/artist/4o7TBxtRmKEAbKYFrjv3NG

### Lavin (1)
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/98b6b50e-8bf8-4305-ad06-438ba6a36d7d
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "Lavin Perinçek" — popülerlik 23, 3.315 takipçi — https://open.spotify.com/artist/3IBj7idtJHybaWlMR4EAk4
  - "Laçin" — popülerlik 51, 21.417 takipçi — https://open.spotify.com/artist/5eAntyjk6nCiWXJgd0CmXa
  - "LAVINA17" — popülerlik 0, 0 takipçi — https://open.spotify.com/artist/12rZgEaGSSTGNT26x4gcTl

### Luna Fosepthicc
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/a2e210b1-09f3-4954-a25a-1f75ae520811
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "Luna" — popülerlik 51, 160.624 takipçi — https://open.spotify.com/artist/4sTO5nmBIlTF35aTnt6U7n
  - "Luna Theia" — popülerlik 37, 970 takipçi — https://open.spotify.com/artist/2ez4zoAZdEJQkXyhbD9pfz
  - "LUNxdiE" — popülerlik 59, 6.361 takipçi — https://open.spotify.com/artist/1k23djrShJgm3XQTMuzY1X

### Luv X 90s 2000s Hiphop
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/f6afe876-c49f-4994-b0c7-2b66b34b752e
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "Lvbel C5" — popülerlik 76, 5.913.040 takipçi — https://open.spotify.com/artist/0V2oXYR7DtrZAEFeILRW2r
  - "UZI" — popülerlik 78, 7.926.503 takipçi — https://open.spotify.com/artist/51DevdOxIJin6DB1FXJpD1
  - "Ezhel" — popülerlik 72, 7.314.093 takipçi — https://open.spotify.com/artist/6LnJKrtFnTEGdbWQ2riWCL

### mani (UK)
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/29ffff89-ad93-4526-83d6-a09de286ea86
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "manifest" — popülerlik 80, 1.883.168 takipçi — https://open.spotify.com/artist/2WjzL05RyqIk5n53sZc9nf
  - "Mansur" — popülerlik 66, 327.835 takipçi — https://open.spotify.com/artist/1nXS8JvKsTNSGw75Axv6rm
  - "Måneskin" — popülerlik 79, 11.159.625 takipçi — https://open.spotify.com/artist/0lAWpj5szCSwM4rUMHYmrr

### Mary Jane
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/c8824805-30c9-4de7-b53e-9e14a435bcef
- Neden şüpheli: 2 AYNI isimli aday ve popülerlik farkı yetersiz (Δ=12, eşik=15)
- Spotify adayları:
  - "Mary Jane" — popülerlik 36, 88.789 takipçi — https://open.spotify.com/artist/6z7oJJfl0VPdH5sFgogqMq
  - "Burry Soprano" — popülerlik 50, 86.244 takipçi — https://open.spotify.com/artist/5SpHQasdZkIx2RFJzvBBsD
  - "Mary Jane" — popülerlik 24, 1.157 takipçi — https://open.spotify.com/artist/33JXsS1fs0UYg1W7LwSzHo

### Masty
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/a1830eaf-bb3d-48cc-ac89-ec8dbdf3d922
- Neden şüpheli: 2 AYNI isimli aday ve popülerlik farkı yetersiz (Δ=0, eşik=15)
- Spotify adayları:
  - "Hayedeh" — popülerlik 53, 766.209 takipçi — https://open.spotify.com/artist/5b1CDxqOGnXr5M1DUn2XQh
  - "Masty" — popülerlik 0, 24 takipçi — https://open.spotify.com/artist/2wEgQSDS1IIuy3ZSZX0aE3
  - "Mastodon" — popülerlik 62, 1.102.408 takipçi — https://open.spotify.com/artist/1Dvfqq39HxvCJ3GvfeIFuT

### Mehemmed Javadoff
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/bb518001-a9a9-42df-a519-1abaebdd0fdf
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "Mehemmed Cavadov" — popülerlik 41, 32.374 takipçi — https://open.spotify.com/artist/0IDJKadGl4ULmtE9fyEwbx
  - "Javad Maroufi" — popülerlik 25, 9.356 takipçi — https://open.spotify.com/artist/3zQdpHMTdJnV4aCzGqCBYK
  - "Farid Farjad" — popülerlik 42, 117.162 takipçi — https://open.spotify.com/artist/4OpgGR0sYIwrfYZgklLWnk

### Melek Baykal
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/0feb25fe-a95a-4e48-a405-c60531091e7b
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "Melek Mosso" — popülerlik 59, 1.651.468 takipçi — https://open.spotify.com/artist/5IAxUWLiTMsvc1oWPrczNj
  - "Melike Şahin" — popülerlik 63, 2.051.343 takipçi — https://open.spotify.com/artist/16GyR4WfCnIT2XST4ZLl2B
  - "Mela Bedel" — popülerlik 64, 147.534 takipçi — https://open.spotify.com/artist/55WpZ8ig2SFNvQpDHPUrgY

### Metin Zakoğlu
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/0f4e2a2f-9c96-4bd2-aade-f888e05b6616
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "Metin Önderoğlu" — popülerlik 16, 1.095 takipçi — https://open.spotify.com/artist/4EKez7z3NqUpp5HpZcJSDe
  - "Metin Özülkü" — popülerlik 37, 18.993 takipçi — https://open.spotify.com/artist/60KWc0tXssJkTZFWB2lia9
  - "Metin Işık" — popülerlik 50, 141.447 takipçi — https://open.spotify.com/artist/7KutQsUSxrYlTZACSGEN8L

### Mixtape
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/dc4da739-4f76-4b7b-b644-a11176e514c7
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "Stray Kids" — popülerlik 86, 24.083.645 takipçi — https://open.spotify.com/artist/2dIgFjalVxs4ThymZ67YCE
  - "Şam" — popülerlik 66, 615.458 takipçi — https://open.spotify.com/artist/1GyfNm3xj64IZR4rKnzNti
  - "Mixtape Madness" — popülerlik 57, 330.624 takipçi — https://open.spotify.com/artist/4ocdD0Bi1syVqLs1GiHqQ9

### MLisa
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/ec983c3d-a801-44d4-a117-501675bd4ba4
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "M Lisa" — popülerlik 62, 278.627 takipçi — https://open.spotify.com/artist/7CLojerj7StFcAX03tA8Pc
  - "Güneş" — popülerlik 61, 683.582 takipçi — https://open.spotify.com/artist/0L3wrFI3QcbXAvFL7IaPQX
  - "TUANA" — popülerlik 57, 153.020 takipçi — https://open.spotify.com/artist/2FkaZzzDTwnz1l1mK9DoT6

### Müjdat Gezen
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/cddbfcce-f841-46c1-b899-ec50ad101a4b
- Neden şüpheli: 2 AYNI isimli aday ve popülerlik farkı yetersiz (Δ=11, eşik=15)
- Spotify adayları:
  - "Müjdat Gezen" — popülerlik 12, 281 takipçi — https://open.spotify.com/artist/5qUaV5EPihBgxh4NxboSwS
  - "Müjdat Gezen" — popülerlik 1, 60 takipçi — https://open.spotify.com/artist/3eW90LtiSrLpgFby80zey3
  - "Müslüm Gürses" — popülerlik 68, 10.361.740 takipçi — https://open.spotify.com/artist/4cMwyqmHCwJjRZ3frIVHTr

### Murda
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/a64d71ae-1f11-40fd-944f-b8be6569bcdc
- Neden şüpheli: 2 AYNI isimli aday ve popülerlik farkı yetersiz (Δ=12, eşik=15)
- Spotify adayları:
  - "Murda" — popülerlik 67, 1.260.710 takipçi — https://open.spotify.com/artist/2y1VzMKAa5nmfXKtJL9jnj
  - "Murda" — popülerlik 55, 385.876 takipçi — https://open.spotify.com/artist/09WqkYnqWKUQAYSlEvaf6s
  - "Ezhel" — popülerlik 72, 7.314.093 takipçi — https://open.spotify.com/artist/6LnJKrtFnTEGdbWQ2riWCL

### Mustafa Sağır
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/7e2c1320-57fb-4164-9d92-db985b9fbe76
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "Mustafa Sırat" — popülerlik 11, 49 takipçi — https://open.spotify.com/artist/7pnw4WWig7OkfU7oi4VnV8
  - "Mustafa Sırtlı" — popülerlik 11, 1.107 takipçi — https://open.spotify.com/artist/6ipTEAujgr5KHm2oimn2uu
  - "Mustafa Sandal" — popülerlik 72, 1.205.411 takipçi — https://open.spotify.com/artist/0mkH5jj3goQ51JtPKVodTo

### Nicolas Bringuier
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/7958c061-25d7-424d-bb08-a5b08b92cc8d
- Neden şüpheli: 2 AYNI isimli aday ve popülerlik farkı yetersiz (Δ=0, eşik=15)
- Spotify adayları:
  - "Nicolas Bringuier" — popülerlik 0, 9 takipçi — https://open.spotify.com/artist/5APq9EcBfxKDnLMaj1uQ20
  - "Nicolas Bringuier" — popülerlik 0, 11 takipçi — https://open.spotify.com/artist/6Nk6ph4f9k6iYxauV3uANt
  - "Nicholas Britell" — popülerlik 62, 207.949 takipçi — https://open.spotify.com/artist/18oYqNtcLUHrqO7LfX7qni

### Nihat Sırdar
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/2eb4bdcb-9332-4047-b920-6112358c95f2
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "İbrahim Sarıpınar" — popülerlik 29, 8.737 takipçi — https://open.spotify.com/artist/36XOzpht2ZU5nXC77HodnG
  - "Pinhani" — popülerlik 62, 2.429.211 takipçi — https://open.spotify.com/artist/4Bdqzh78prwuqwInMb555P
  - "Nihat İlhan" — popülerlik 33, 10.604 takipçi — https://open.spotify.com/artist/6UatnK10k8Eo4OQYNN8RIS

### Okan Çabalar
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/9fe3bf4c-361f-455f-8aec-6043c046396b
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "Okan Babacan" — popülerlik 42, 17.787 takipçi — https://open.spotify.com/artist/2DKLemc11pgmIGWJfiuHOS
  - "Okan & Volkan" — popülerlik 51, 250.588 takipçi — https://open.spotify.com/artist/5U2qYuO4KclXaQTqiGzqUV
  - "Yüzyüzeyken Konuşuruz" — popülerlik 64, 3.019.174 takipçi — https://open.spotify.com/artist/7gobcoscOfsY0nOeqqFzvU

### OMAYO
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/75f33351-94dd-4b20-b8f3-a6291dd2568b
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "OMAO" — popülerlik 38, 1.635 takipçi — https://open.spotify.com/artist/1VHRSHGicYOgBxMHApEqCd
  - "OMAY" — popülerlik 51, 97.801 takipçi — https://open.spotify.com/artist/58A4Qwc7kr97PARjHizb8g
  - "Omagoqa" — popülerlik 30, 17.249 takipçi — https://open.spotify.com/artist/4caV3BYVSNygGiFFOvQgUy

### Onur Buldu
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/c89bbb9f-7700-45f3-8de7-ff5fdcbcb874
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "Onur GÜNDÜZER" — popülerlik 22, 305 takipçi — https://open.spotify.com/artist/2nxsbrOz4ahD6g0NMS39x9
  - "Onur Can Özcan" — popülerlik 58, 1.585.274 takipçi — https://open.spotify.com/artist/2QslFlDyZVpLYwfqyRDkNs
  - "Onurr" — popülerlik 57, 19.690 takipçi — https://open.spotify.com/artist/3I3kGrPbyHSER6DIxsbsac

### Onurr Methiyeler
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/5849a921-8352-40b7-b57c-62d73fc662e3
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "Onurr" — popülerlik 57, 19.690 takipçi — https://open.spotify.com/artist/3I3kGrPbyHSER6DIxsbsac
  - "Onur Mete" — popülerlik 35, 22.685 takipçi — https://open.spotify.com/artist/7uJvDwK3jWE215FYK6Fl6s
  - "Onur Can Özcan" — popülerlik 58, 1.585.274 takipçi — https://open.spotify.com/artist/2QslFlDyZVpLYwfqyRDkNs

### OX (2)
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/1c59952f-444e-4940-b153-62cb3e019f85
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "OXXED" — popülerlik 55, 11.125 takipçi — https://open.spotify.com/artist/4uuwY98I54DdbA453Lfy98
  - "OX2" — popülerlik 10, 173 takipçi — https://open.spotify.com/artist/6n2F71iSeckW1PrQaGdArh
  - "Ouz!" — popülerlik 32, 1.388 takipçi — https://open.spotify.com/artist/2l7dOvwuLlkAondrgdVBGW

### Özlem Kosif
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/6f3eb0e8-b088-4b9c-9554-686306e12168
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "Özlem Özdil" — popülerlik 54, 161.542 takipçi — https://open.spotify.com/artist/2WoyCDcgb0eQOqEMN3Pdmh
  - "Özlem Tekin" — popülerlik 52, 360.853 takipçi — https://open.spotify.com/artist/1Xwze1G0zfRnxqBDfmWVVf
  - "Yüzyüzeyken Konuşuruz" — popülerlik 64, 3.019.174 takipçi — https://open.spotify.com/artist/7gobcoscOfsY0nOeqqFzvU

### Payam Ghasemi Quintet
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/8273d495-f942-472f-b40e-161057433444
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "Mohsen Namjoo" — popülerlik 41, 197.191 takipçi — https://open.spotify.com/artist/4eVyI1yiHoRjVrxt5y7gGL
  - "Siavash Ghomayshi" — popülerlik 51, 528.334 takipçi — https://open.spotify.com/artist/4DKaZIByJZluOmixSYIjjk
  - "Ebi" — popülerlik 53, 714.065 takipçi — https://open.spotify.com/artist/3pI1XXzzKOYdYCLWurc2Ky

### Pe Dro
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/11d2f281-91ee-42ef-850d-6491562c173f
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "Pearly Drops" — popülerlik 49, 85.557 takipçi — https://open.spotify.com/artist/2eMb96S1ZJ1YQ7FhWAzWJL
  - "Pera" — popülerlik 52, 791.895 takipçi — https://open.spotify.com/artist/1bzmtVU7jf2rRZJALkZA3j
  - "Deeperise" — popülerlik 57, 336.476 takipçi — https://open.spotify.com/artist/0ZRQKFaYGEtbLc8NbyICoe

### Pentegram
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/3ae2690d-d6ce-4cd6-a6f7-0194bc71582e
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "Pentagram" — popülerlik 43, 162.772 takipçi — https://open.spotify.com/artist/1Xz8iP9Dvl5uI88iraOhs7
  - "Hayko Cepkin" — popülerlik 59, 908.513 takipçi — https://open.spotify.com/artist/3hzijSzD6IwOV4SY2SiWQp
  - "Pentagram" — popülerlik 43, 190.887 takipçi — https://open.spotify.com/artist/0xybuiDEYo3YuT3fLPaIyE

### Petch Mode
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/4cb69fb4-347b-4b3f-b961-ab318df2419a
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "Depeche Mode" — popülerlik 77, 7.981.485 takipçi — https://open.spotify.com/artist/762310PdDnwsDxAQxzQkfX
  - "Model" — popülerlik 65, 1.892.902 takipçi — https://open.spotify.com/artist/23xJQJM7peht77DF6YNEoq
  - "Petsch Moser" — popülerlik 0, 604 takipçi — https://open.spotify.com/artist/4LzLEqS34p3pJGhf3Pt1vo

### Radiohead Tribute
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/d901b289-ebbe-40f4-b9da-79f41c10d80c
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "Radiohead" — popülerlik 86, 16.741.947 takipçi — https://open.spotify.com/artist/4Z8W4fKeB5YxbusRsdQVPb
  - "Duman" — popülerlik 65, 7.876.654 takipçi — https://open.spotify.com/artist/6RTC1abMgBC7Krg6qJQHJh
  - "mor ve ötesi" — popülerlik 64, 2.766.521 takipçi — https://open.spotify.com/artist/5ixQSDvAMa5O758xG8MWXT

### RUK (2)
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/a1551135-cc27-43bc-a5fc-3bde4c98b350
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "Dolu Kadehi Ters Tut" — popülerlik 66, 3.310.041 takipçi — https://open.spotify.com/artist/0PhqM7UAxtvWYi5j4MwxSl
  - "2run" — popülerlik 53, 26.105 takipçi — https://open.spotify.com/artist/2ChTJTWndw0hFKEnn4ukYv
  - "West 22nd" — popülerlik 58, 67.416 takipçi — https://open.spotify.com/artist/2FKnkloMDcNrUeLDfQJf8i

### Sandar Sánchez
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/7cb0dfde-5b10-40cd-8ea9-456249178c6a
- Neden şüpheli: 2 AYNI isimli aday ve popülerlik farkı yetersiz (Δ=6, eşik=15)
- Spotify adayları:
  - "Sandar Sánchez" — popülerlik 6, 1.887 takipçi — https://open.spotify.com/artist/6KBTh7oeCtj6WJql0eWZDT
  - "Sander Sanchez" — popülerlik 12, 659 takipçi — https://open.spotify.com/artist/6pVYHSuDyZDlmaUtOhx9HF
  - "Sandar Sanchez" — popülerlik 0, 0 takipçi — https://open.spotify.com/artist/4NZcsFXk9542qpTmZ0k77G

### Sarathy Korwar Drum
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/b0b046fc-6159-4dba-acdd-a00a592671d1
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "Sarathy Korwar" — popülerlik 32, 21.408 takipçi — https://open.spotify.com/artist/5GzH8EsRPqgNjNo3oBfRvk
  - "Evgeny Grinko" — popülerlik 64, 403.771 takipçi — https://open.spotify.com/artist/69RwhKw37lY73bMGaSts7C
  - "Krobak" — popülerlik 50, 66.969 takipçi — https://open.spotify.com/artist/3NSPUQNQB8sZ4dUdHSGa0Z

### Script (GE)
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/b831f5e1-d421-4069-9a60-ee5744db584c
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "The Scripture" — popülerlik 39, 1.060 takipçi — https://open.spotify.com/artist/7nGeoIGnJVQTHcDIAqCStR
  - "Scripture MixTape" — popülerlik 36, 6.033 takipçi — https://open.spotify.com/artist/195FEt1uchReuF2SGXmHzO
  - "Scripture Lullabies" — popülerlik 57, 73.801 takipçi — https://open.spotify.com/artist/2bBRxQ6hEba2rm64HLgFTo

### Semi
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/32cc7260-8372-4eb8-a873-2302dc66dbb2
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "Semicenk" — popülerlik 72, 6.767.667 takipçi — https://open.spotify.com/artist/1CcZoULzFHa8Uhwo6OlQcp
  - "BLOK3" — popülerlik 80, 8.116.375 takipçi — https://open.spotify.com/artist/1GMwSpFzrLd12jUX15bHB6
  - "Semiramis Pekkan" — popülerlik 53, 184.020 takipçi — https://open.spotify.com/artist/5vuQpKX1QG7WlQ40C27HfD

### Serdar Doğan
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/e9a57d96-1e3c-4b89-85bd-247313c319f1
- Neden şüpheli: 2 AYNI isimli aday ve popülerlik farkı yetersiz (Δ=7, eşik=15)
- Spotify adayları:
  - "Serdar Doğan" — popülerlik 0, 68 takipçi — https://open.spotify.com/artist/4kOUXPD4dEUAYWQiTkfdv0
  - "Serdar Doğanay" — popülerlik 19, 870 takipçi — https://open.spotify.com/artist/11qIuFgx8TqHXFnrDVDEn2
  - "Serdar Dogan" — popülerlik 7, 84 takipçi — https://open.spotify.com/artist/2bK2P6MYOn5dJGZvajFG70

### Sermet Erkin
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/bdb0475b-f095-4ba5-972e-4f0c22bb319e
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "Erkin Koray" — popülerlik 53, 836.370 takipçi — https://open.spotify.com/artist/4o3Nv2BAyoZkyGaRXv4rT3
  - "Sertab Erener" — popülerlik 68, 2.501.239 takipçi — https://open.spotify.com/artist/4W31XN2JH8mC54NkHdh04s
  - "Demet Akalın" — popülerlik 67, 2.332.939 takipçi — https://open.spotify.com/artist/1U449OOb70EZlElNjLMwCM

### Silvio Venezia
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/86840307-adea-4354-bf46-be00ff89b8a5
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "Rondò Veneziano" — popülerlik 47, 144.520 takipçi — https://open.spotify.com/artist/6YH4dTGIZZvVO55Sb3095Q
  - "Evgeny Grinko" — popülerlik 64, 403.771 takipçi — https://open.spotify.com/artist/69RwhKw37lY73bMGaSts7C
  - "Neco" — popülerlik 41, 7.409 takipçi — https://open.spotify.com/artist/7zOtD8R69X5cikWdL1oWFW

### SOLTO
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/8612a7f2-e495-4663-9e91-adedd7439b45
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "SOLTO (FR)" — popülerlik 74, 11.829 takipçi — https://open.spotify.com/artist/0F3tUZeb9dLNEpxCpzEBQt
  - "HUGEL" — popülerlik 85, 993.315 takipçi — https://open.spotify.com/artist/5PlfkPxwCpRRWQJBxCa0By
  - "Solomun" — popülerlik 63, 1.169.152 takipçi — https://open.spotify.com/artist/5wJK4kQAkVGjqM9x46KQOC

### Soul Grinders
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/202ef4f7-671d-4691-bd28-703b234a519a
- Neden şüpheli: 2 AYNI isimli aday ve popülerlik farkı yetersiz (Δ=0, eşik=15)
- Spotify adayları:
  - "Soul Grinders" — popülerlik 0, 307 takipçi — https://open.spotify.com/artist/6OshA7d7mXjnv5W6Pjmplg
  - "Soul Grinders" — popülerlik 0, 15 takipçi — https://open.spotify.com/artist/0SgesABl5eVDKLFQSuRCi7
  - "Soul Grinder" — popülerlik 3, 1.497 takipçi — https://open.spotify.com/artist/3sJINKe7zm2O0sE4WVyHA2

### Sovak
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/e19e61a7-fc1b-41a2-9c7a-72074ae07a86
- Neden şüpheli: 2 AYNI isimli aday ve popülerlik farkı yetersiz (Δ=4, eşik=15)
- Spotify adayları:
  - "Sovak" — popülerlik 4, 990 takipçi — https://open.spotify.com/artist/1WtEdXduf1FgtOwElfsWAl
  - "Sovak" — popülerlik 0, 7 takipçi — https://open.spotify.com/artist/4WNkJMkC5nPtDi0GZ0O00K
  - "Kes" — popülerlik 4, 3.125 takipçi — https://open.spotify.com/artist/1hddLfPcdHZdlhIDISEQBS

### Stupid Crew
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/bc746966-a58d-40af-92ac-3ecde80fa570
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "Stupid Crew Studios" — popülerlik 0, 1 takipçi — https://open.spotify.com/artist/6nNeRrLoIMnR2temE47tOR
  - "The Stupid Crew" — popülerlik 0, 1 takipçi — https://open.spotify.com/artist/1f2UWwc03yZ77GdkdeDYH6
  - "Country Studio Crew" — popülerlik 20, 1.765 takipçi — https://open.spotify.com/artist/4bBHTAbtvS6eNiLhZ5on40

### The Five Horsemen Metallica Tribute
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/27509633-69bc-4f41-b310-ff4d34370708
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "Metallica" — popülerlik 85, 35.180.717 takipçi — https://open.spotify.com/artist/2ye2Wgw4gimLv2eAKyk1NB
  - "Duman" — popülerlik 65, 7.876.654 takipçi — https://open.spotify.com/artist/6RTC1abMgBC7Krg6qJQHJh
  - "Cem Karaca" — popülerlik 56, 2.075.128 takipçi — https://open.spotify.com/artist/1lIbZfJvMQRqzhtCQsg5EI

### The House Jack Built
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/6e7d70ac-8174-4730-9015-16be1d5ed8c9
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "The House That Jack Built" — popülerlik 0, 25 takipçi — https://open.spotify.com/artist/0P6y8yiOLrovuteubUTg7V
  - "Jakuzi" — popülerlik 47, 80.257 takipçi — https://open.spotify.com/artist/0xeyL5pfnTtx7LGpqLo4PG
  - "We Lost The Sea" — popülerlik 40, 87.700 takipçi — https://open.spotify.com/artist/7GVByFFfFJYCzK4d8ZyL6s

### The Sisters
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/17ef306c-60cb-4401-80c1-99a8c6a8ea02
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "Sisters of Mercy" — popülerlik 57, 775.287 takipçi — https://open.spotify.com/artist/4HxBVyHaUa60eCSsJWxwWR
  - "The Pointer Sisters" — popülerlik 63, 1.226.975 takipçi — https://open.spotify.com/artist/2kreKea2n96dXjcyAU9j5N
  - "Bauhaus" — popülerlik 54, 1.141.798 takipçi — https://open.spotify.com/artist/5N5tQ9Dx1h8Od7aRmGj7Fi

### The Sisters of Mercy
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/321a5021-2761-49ab-842f-b19c0118298d
- Neden şüpheli: 2 AYNI isimli aday ve popülerlik farkı yetersiz (Δ=13, eşik=15)
- Spotify adayları:
  - "Sisters of Mercy" — popülerlik 57, 775.287 takipçi — https://open.spotify.com/artist/4HxBVyHaUa60eCSsJWxwWR
  - "The Sisters Of Mercy" — popülerlik 17, 12.895 takipçi — https://open.spotify.com/artist/2CSWBwhuu4bearI8swf8Gj
  - "The Sisters Of Mercy" — popülerlik 4, 63 takipçi — https://open.spotify.com/artist/0IcJAjGXuVZKWZgrOS1svZ

### Thousand Fingers
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/bb102d53-45f1-4824-92a3-b9b0b2563a90
- Neden şüpheli: 2 AYNI isimli aday ve popülerlik farkı yetersiz (Δ=7, eşik=15)
- Spotify adayları:
  - "Thousand Fingers" — popülerlik 7, 760 takipçi — https://open.spotify.com/artist/6pDwIptiCrEeRzTfc7mLrn
  - "Thousand Fingers" — popülerlik 0, 18 takipçi — https://open.spotify.com/artist/4UapLCoXiZB6z1vVvHfWXh
  - "A Thousand Tiny Fingers" — popülerlik 0, 12 takipçi — https://open.spotify.com/artist/3s7cXWUeOiyu8wHiTDGBaZ

### Tuluğ Tırpan
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/d282fa75-e24a-4230-a44b-f660047942ae
- Neden şüpheli: 2 AYNI isimli aday ve popülerlik farkı yetersiz (Δ=14, eşik=15)
- Spotify adayları:
  - "Tuluğ Tırpan" — popülerlik 15, 1.052 takipçi — https://open.spotify.com/artist/660wGQyuKbmWuslzMfJHsd
  - "Tuluğ Tırpan" — popülerlik 1, 23 takipçi — https://open.spotify.com/artist/3Xf5yePWPZFudhbG0tqFVb
  - "Tuluğ Tırpan Trio" — popülerlik 0, 63 takipçi — https://open.spotify.com/artist/2M6sVoDOoMjPllVcV2oPjH

### Tutkum Boğuşmak
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/8e2b9b0b-c012-4b57-8c65-11ed128d507a
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "Dolu Kadehi Ters Tut" — popülerlik 66, 3.310.041 takipçi — https://open.spotify.com/artist/0PhqM7UAxtvWYi5j4MwxSl
  - "Yüzyüzeyken Konuşuruz" — popülerlik 64, 3.019.174 takipçi — https://open.spotify.com/artist/7gobcoscOfsY0nOeqqFzvU
  - "Yalın" — popülerlik 72, 2.951.701 takipçi — https://open.spotify.com/artist/46zuW8tHxwahYn7VNMgYTa

### Umutcan Arslan
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/63ee0d54-4fa9-4462-a281-3fb007950b17
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "Umut Arda" — popülerlik 32, 10.847 takipçi — https://open.spotify.com/artist/3zDsxPK6lUg7MonUP3NUk6
  - "Umut Kaya" — popülerlik 49, 146.508 takipçi — https://open.spotify.com/artist/0yXr7HHsbJlVaU8kBhRcny
  - "Ümit Besen" — popülerlik 53, 797.792 takipçi — https://open.spotify.com/artist/2Cusk8DpjH8r3BDvuN3ufo

### undrtow
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/83cd5e8a-e512-4e5c-a259-b77ae1548571
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "Orbit Culture" — popülerlik 56, 301.522 takipçi — https://open.spotify.com/artist/7k29FbDq69ju2fe6zTskxY
  - "Carrie Underwood" — popülerlik 71, 6.278.722 takipçi — https://open.spotify.com/artist/4xFUf1FHVy696Q1JQZMTRj
  - "Toby Fox" — popülerlik 80, 2.548.821 takipçi — https://open.spotify.com/artist/57DlMWmbVIf2ssJ8QBpBau

### Vagabund
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/72cf68d8-8fc4-453e-bfff-bec74e203eb0
- Neden şüpheli: 2 AYNI isimli aday ve popülerlik farkı yetersiz (Δ=1, eşik=15)
- Spotify adayları:
  - "Vagabundo" — popülerlik 15, 21 takipçi — https://open.spotify.com/artist/4pUYnCxGZinp0m7WZEXvxG
  - "Vagabund" — popülerlik 1, 288 takipçi — https://open.spotify.com/artist/4GMBrPK3I4TIX5ECdK478E
  - "Vagabund" — popülerlik 0, 7 takipçi — https://open.spotify.com/artist/01Fo3NVPj3fedNqu8cUC7O

### Volkan Gunduz
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/0decb7f4-0c4b-441e-8269-61522fb30eec
- Neden şüpheli: 2 AYNI isimli aday ve popülerlik farkı yetersiz (Δ=0, eşik=15)
- Spotify adayları:
  - "Volkan Gunduz" — popülerlik 0, 218 takipçi — https://open.spotify.com/artist/43aa1mq70HznHpeg6YafjQ
  - "Volkan Gündüz" — popülerlik 0, 6 takipçi — https://open.spotify.com/artist/3SLCTwiUs4aeCQe0asVZBm
  - "Volkan Ateş Gündüz" — popülerlik 0, 11 takipçi — https://open.spotify.com/artist/1H5ZJjKAWgnmrJnHPXc3oz

### Walkman 90'lar Türkçe Pop Gecesi
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/49612e43-4220-469c-bd05-7c9410b0e14e
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "Duman" — popülerlik 65, 7.876.654 takipçi — https://open.spotify.com/artist/6RTC1abMgBC7Krg6qJQHJh
  - "Sezen Aksu" — popülerlik 73, 15.301.838 takipçi — https://open.spotify.com/artist/64d1rUxfizSAOE9UbMnUZd
  - "Yalın" — popülerlik 72, 2.951.701 takipçi — https://open.spotify.com/artist/46zuW8tHxwahYn7VNMgYTa

### Yonca Evcimik
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/35369440-34b2-4498-a3e5-ebe2d1f5336d
- Neden şüpheli: 2 AYNI isimli aday ve popülerlik farkı yetersiz (Δ=14, eşik=15)
- Spotify adayları:
  - "Yonca Evcimik" — popülerlik 47, 130.162 takipçi — https://open.spotify.com/artist/7uViwGf6m3VatgaIx4It0s
  - "Bendeniz" — popülerlik 48, 268.917 takipçi — https://open.spotify.com/artist/39b2aS3568sYAC6CG5hsJw
  - "Yonca Evcimik" — popülerlik 33, 4.876 takipçi — https://open.spotify.com/artist/4hmurMvMnpzZuuea5r1ZwV

### Yosi Mizrahi
- Panel: https://panel.noqt.social/panel/admin/sanatcilar/a62622f2-acd7-4bf8-a42d-805e1ab03191
- Neden şüpheli: Hiçbir adayın adı DB'deki adla birebir eşleşmiyor
- Spotify adayları:
  - "Yossi Azulay" — popülerlik 39, 28.376 takipçi — https://open.spotify.com/artist/0ervBY5UeqTk1YOatn1Re7
  - "Joseph E-Shine" — popülerlik 20, 851 takipçi — https://open.spotify.com/artist/7wKNVbqW4UXVDCeAqTyUU4
  - "Yosef shimoni" — popülerlik 22, 1.022 takipçi — https://open.spotify.com/artist/4abgYgiOBLG6FBT9IxhDXb

## Sonuç bulunamayan (1)

- 7PF2P — https://panel.noqt.social/panel/admin/sanatcilar/836c409c-9077-4ca8-ac50-e0c9c83ef5de
