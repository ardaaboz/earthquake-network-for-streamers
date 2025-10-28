Deprem Ağı → OBS Canlı Yayın Erken Uyarı Sistemi (0 TL)

Bu proje, Deprem Ağı uygulamasından telefona gelen erken uyarı bildirimlerini otomatik olarak canlı yayınlara (OBS Browser Source) yansıtan ücretsiz bir sistem sağlar.

Özet mimari:
- Android telefonda MacroDroid (ücretsiz) ile Deprem Ağı bildirimleri yakalanır.
- MacroDroid, bu sunucuya bir HTTP POST (webhook) gönderir.
- Sunucu, bağlı yayıncıların tarayıcı kaynağına SSE (Server‑Sent Events) ile anında uyarı iletir.
- Yayıncılar OBS’e tek bir link ekler; gerisi otomatik çalışır.

Kurulum herkes için kolay olacak şekilde yazılmıştır. Teknik bilgi gerektirmez.

1) Ücretsiz barındırma (Render önerilir)
- https://render.com adresine ücretsiz hesap açın.
- Bu projeyi kendi GitHub hesabınıza “Fork” edin veya ZIP olarak indirip yeni repo açın.
- Render’da New → Web Service → GitHub reponuzu seçin.
- Build/Start komutlarını değiştirmeyin (Render otomatik `npm install` ve `npm start` çalıştırır).
- Environment → Add Environment Variable:
  - `GLOBAL_SECRET` = güçlü bir gizli anahtar (ör. `my-super-secret-123`)
- Deploy edin. Size `https://<servis-adiniz>.onrender.com` gibi bir URL verilecektir.

Alternatif ücretsizler: Railway, Fly.io. (Ücretsiz planlar uykuya geçebilir; bu normaldir.)

2) Yayıncı linki (OBS Browser Source)
- OBS’de Kaynak Ekle → Browser (Tarayıcı) seçin.
- URL alanına şunu yazın:
  `https://<servis-adiniz>.onrender.com/overlay?channel=BENIM_KANALIM`
- Genişlik: 1920, Yükseklik: 1080 (veya yayın çözünürlüğünüz). Arka plan transparandır.
- `channel` değeri her yayıncı için farklı, tahmin edilmesi zor bir yazı olsun (ör. `kanal-kerem-3c9jv7`).

3) Telefonda MacroDroid ile bildirimleri web’e yolla (0 TL)
- Android telefonda Play Store’dan MacroDroid (ücretsiz) kurun.
- MacroDroid’i açın → + (Yeni Macro) → Tetikleyici seçin: Bildirim → Bildirim Alındı.
  - Uygulama: Deprem Ağı (erken uyarı uygulaması).
  - Gerekirse, metin filtrelerini “Erken Uyarı”, “Ön Uyarı”, “Deprem” gibi kelimelerle sınırlandırın.
- Eylem ekleyin: HTTP İsteği → Method: POST → URL:
  `https://<servis-adiniz>.onrender.com/hook`
- Başlık: `Content-Type: application/json`
- Gövde (JSON) alanına aynen şunu yapıştırın (köşeli parantezli alanlar MacroDroid değişkenleridir):
```
{
  "secret": "GLOBAL_SECRET_DEGERINIZ",
  "channel": "BENIM_KANALIM",
  "title": "[notif_title]",
  "message": "[notif_text]",
  "timestamp": "[formatted_time]",
  "source": "deprem-agi"
}
```
- Kaydedin. Gerekirse MacroDroid’e “Bildirim erişimi” izni verin.

Hepsi bu. Deprem Ağı’ndan uyarı gelince, yayın ekranında üstte animasyonlu bir uyarı bandı görünür ve ~12 saniye sonra kaybolur.

Test etme (telefonsuz):
- OBS’de overlay açıkken tarayıcıda şu linki ziyaret edin:
  `https://<servis-adiniz>.onrender.com/send?channel=BENIM_KANALIM&msg=Test&loc=Istanbul&secret=GLOBAL_SECRET_DEGERINIZ`
- Bant görünüyor ise sistem hazırdır.

Çoklu yayıncı (tek sistem):
- Her yayıncı kendi benzersiz `channel` değeri ile OBS linkini kullanır.
- Aynı telefondan birden fazla kanala göndermek isterseniz MacroDroid’te birden fazla HTTP isteği eylemi ekleyebilirsiniz (farklı `channel` değerleri ile).

Güvenlik notları:
- `GLOBAL_SECRET` zorunlu değil ama mutlaka kullanın; MacroDroid gönderirken aynı değeri body içine koyar.
- Kanal adını tahmin edilmesi zor yapın. Overlay URL’nizi paylaşmayın.

Önemli: Uygulama uyku/uyandırma
- Ücretsiz barındırıcılar (Render vb.) bir süre ziyaret olmazsa servisi uyutabilir.
- OBS overlay açıkken bağlantı kurulur ve uyarılar anında gelir.
- Servo uykudan uyanırken ilk çağrı 1‑2 sn gecikebilir; bu yayını etkilemez.

Geliştirici Notları
- Sunucu: Node.js (Express) + SSE.
- Webhook: `POST /hook` body örneği:
```
{
  "secret": "...",
  "channel": "kanal-adi",
  "title": "Erken Uyarı",
  "message": "...",
  "location": "...",
  "timestamp": "2025-01-01T12:34:56.000Z",
  "source": "deprem-agi"
}
```
- İzleyici akışı (OBS): `GET /overlay?channel=...` → içerden `GET /events?channel=...` açar.
- Yayıncılara gönderim: SSE ile `event: alert` payload.

Yerel çalıştırma
```
npm install
npm start
# http://localhost:8080/overlay?channel=deneme
# Test: http://localhost:8080/send?channel=deneme&msg=Test&loc=Istanbul
```

Sık Sorulanlar
- Deprem Ağı dışında bir sistem? Hayır; sadece Deprem Ağı bildirimleri hedeflenmiştir.
- Ücret? Barındırma ücretsiz planlarla 0 TL; MacroDroid ücretsizdir.
- iPhone? Bu kurulum Android içindir (bildirim yakalama nedeniyle). iOS için farklı yol gerekir.

