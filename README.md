Deprem Ağı → OBS Canlı Yayın Erken Uyarı Sistemi (0 TL)

Bu proje, Deprem Ağı uygulamasından telefona gelen erken uyarı bildirimlerini otomatik olarak canlı yayınlara (OBS Browser Source) yansıtan ücretsiz bir sistem sağlar.

Özet mimari:
- Android telefonda MacroDroid (ücretsiz) ile Deprem Ağı bildirimleri yakalanır.
- MacroDroid, bu sunucuya bir HTTP POST (webhook) gönderir.
- Sunucu, bağlı yayıncıların tarayıcı kaynağına SSE (Server‑Sent Events) ile anında uyarı iletir.
- Yayıncılar OBS’e tek bir link ekler; gerisi otomatik çalışır.

Kurulum herkes için kolay olacak şekilde yazılmıştır. Teknik bilgi gerektirmez.

1) Tamamen ücretsiz barındırma (Vercel + Upstash)
- Vercel (Hobby) ücretsizdir ve kredi kartı istemez. Sunucusuz fonksiyonlar uzun süre açık bağlantıları sınırladığı için, overlay SSE yerine hızlı polling kullanır (1–1.2 sn’de bir). Erken uyarı için yeterince hızlıdır.
- Ücretsiz kalıcı hafıza için Upstash Redis (ücretsiz plan) kullanıyoruz; kredi kartı istemez.

Adımlar (teknik olmayan):
- GitHub: Bu projeyi Fork edin (veya yeni repo oluşturup içeriği yükleyin).
- Upstash: https://upstash.com → Sign Up → Create Redis Database (free plan)
  - Dashboard’da `REST URL` ve `REST TOKEN` değerlerini not alın.
- Vercel: https://vercel.com → Sign Up → Add New Project → GitHub reponuzu seçin → Deploy.
  - Settings → Environment Variables ekleyin:
    - `GLOBAL_SECRET` = güçlü gizli anahtar (örn. `my-super-secret-123`)
    - `UPSTASH_REDIS_REST_URL` = Upstash’tan kopyaladığınız URL
    - `UPSTASH_REDIS_REST_TOKEN` = Upstash’tan kopyaladığınız Token
  - “Redeploy” yapın. Uygulama URL’si: `https://<proje-adiniz>.vercel.app`

2) Yayıncı linki (OBS Browser Source)
- OBS’de Kaynak Ekle → Browser (Tarayıcı) seçin.
- URL alanına şunu yazın:
  `https://<proje-adiniz>.vercel.app/overlay?channel=BENIM_KANALIM`
- Genişlik: 1920, Yükseklik: 1080 (veya yayın çözünürlüğünüz). Arka plan transparandır.
- `channel` değeri her yayıncı için farklı, tahmin edilmesi zor bir yazı olsun (ör. `kanal-kerem-3c9jv7`).

3) Telefonda MacroDroid ile bildirimleri web’e yolla (0 TL)
- Android telefonda Play Store’dan MacroDroid (ücretsiz) kurun.
- MacroDroid’i açın → + (Yeni Macro) → Tetikleyici seçin: Bildirim → Bildirim Alındı.
  - Uygulama: Deprem Ağı (erken uyarı uygulaması).
  - Gerekirse, metin filtrelerini “Erken Uyarı”, “Ön Uyarı”, “Deprem” gibi kelimelerle sınırlandırın.
- Eylem ekleyin: HTTP İsteği → Method: POST → URL:
  `https://<proje-adiniz>.vercel.app/api/hook`
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
  `https://<proje-adiniz>.vercel.app/api/send?channel=BENIM_KANALIM&msg=Test&loc=Istanbul&secret=GLOBAL_SECRET_DEGERINIZ`
- Alternatif: Android’de MacroDroid’de `hook` çağırın (veya Postman ile `POST /api/hook`).
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
- Yerel sunucu: Node.js (Express) + SSE (`/events`).
- Vercel sürümü: Serverless + Upstash; overlay `/api/poll` ile hızlı polling yapar.
- Webhook: `POST /hook` (yerelde `/hook`, Vercel’de `/api/hook`) body örneği:
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
- İzleyici akışı (OBS):
  - Yerel: `GET /overlay?channel=...` → içerden `GET /events?channel=...` (SSE)
  - Vercel: `GET /overlay?channel=...` → içerden `GET /api/poll?channel=...` (Polling)

Yerel çalıştırma (isteğe bağlı)
```
npm install
npm start
# http://localhost:8080/overlay?channel=deneme (yerel Express sürümü SSE kullanır)
# Vercel sürümünü yerelde denemek için `vercel dev` kullanabilirsiniz (opsiyonel).
```

Alternatif tamamen ücretsiz yol (Cloudflare)
- Cloudflare Workers + KV ile de ücretsiz ve kredi kartsız çalışır.
- İsterseniz Workers tabanlı sürümü de ekleyebilirim; mantık polling aynıdır (`/hook` yazar, overlay `/poll` ister).

Sık Sorulanlar
- Deprem Ağı dışında bir sistem? Hayır; sadece Deprem Ağı bildirimleri hedeflenmiştir.
- Ücret? Barındırma ücretsiz planlarla 0 TL; MacroDroid ücretsizdir.
- iPhone? Bu kurulum Android içindir (bildirim yakalama nedeniyle). iOS için farklı yol gerekir.
