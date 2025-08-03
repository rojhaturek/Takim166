# EduAI Fullstack Projesi

Bu depo, **EduAI** projesinin hem backend (FastAPI) hem de frontend (React + Vite + Tailwind CSS) kodlarını içerir. Eğitim hedeflerine göre kişiselleştirilmiş çalışma planları ve mini testler sunan yapay zeka destekli bir kişisel eğitim platformudur.

## Dizim

- `eduai_backend/`: FastAPI tabanlı REST API. Kullanıcı kayıt/giriş, sınav seçimi, anket, mini test, haftalık plan, ilerleme ve AI etkileşimlerini yönetir. Veriler SQLite veritabanında saklanır ve JWT ile kimlik doğrulaması yapılır.
  Ayrıca Google Gemini API ile entegre olup kişiselleştirilmiş mini testler, haftalık planlar ve sohbet desteği sağlar.
- `eduai_frontend/`: React ile yazılmış SPA. Kayıt ve giriş formları, sınav seçimi sayfası, kullanıcı anketi, panel, mini test, haftalık plan ve profil sayfalarını içerir. Axios ile backend API'sine istek gönderir ve Tailwind CSS ile stillendirilmiştir.

## Kurulum

### Backend

1. Python 3.10 veya üzeri bir ortam oluşturun ve bağımlılıkları kurun:

   ```bash
   pip install -r eduai_backend/requirements.txt
   ```

2. Sunucuyu çalıştırın (kök dizinden):

   ```bash
   PYTHONPATH=. uvicorn eduai_backend.main:app --reload
   ```

   Bu komut `http://127.0.0.1:8000` adresinde API'yı başlatır. `--reload` geliştirme aşamasında kod değişikliklerini otomatik olarak yükler.

3. API dökümantasyonuna `http://127.0.0.1:8000/docs` adresinden erişebilirsiniz.

### Frontend

1. Node.js (v18+) ve npm kurulu olduğundan emin olun.
2. Frontend dizinine geçin ve bağımlılıkları yükleyin:

   ```bash
   cd eduai_frontend
   npm install
   ```

3. API taban adresini belirlemek için bir `.env` dosyası oluşturun. Örnek:

   ```env
   VITE_API_BASE_URL=http://127.0.0.1:8000
   ```

4. Geliştirme sunucusunu başlatın:

   ```bash
   npm run dev
   ```

5. Uygulamaya tarayıcıdan `http://127.0.0.1:5173` adresinden erişebilirsiniz.

## Test

Backend API uç noktalarını otomatik olarak test eden bir betik `eduai_backend/test.sh` içerisinde yer almaktadır. Testleri çalıştırmak için:

```bash
cd eduai_backend
bash test.sh
```

Bu betik, sunucuyu başlatır, örnek bir kullanıcıyla kayıt/giriş işlemleri yapar, tüm temel uç noktaları çağırır ve çıkışta sunucuyu durdurur.

### Yapay Zeka

`eduai_backend/ai_service.py` dosyası, Google Gemini API 2.0 Flash modeli ile entegrasyon içerir. AI anahtarınızı `GEMINI_API_KEY` ortam değişkeni olarak tanımlayabilir veya dosya içerisindeki varsayılan anahtarı güncelleyebilirsiniz. AI servisleri şunları sağlar:

- **Mini test üretimi:** Kullanıcının sınav tercihleri ve zorlandığı konular dikkate alınarak çoktan seçmeli sorular oluşturulur.
- **Haftalık plan:** Öğrencinin hedef sınavları ve eksik konularına göre kişiselleştirilmiş bir haftalık çalışma programı hazırlanır.
- **Sohbet:** Kullanıcı, AI destekli bir eğitim asistanı ile yazışabilir; sorular sorup açıklamalar alabilir.

Frontend’de “Sohbet” menüsü üzerinden bu özelliği kullanabilirsiniz.

## Notlar

- Frontend ve backend ayrı dizinlerde tutulmakla birlikte, proje kök dizininden çalıştırıldığında backend'in `eduai_backend` Python paketini bulabilmesi için `PYTHONPATH` değişkeninin ayarlanması gerekebilir (örneğin `PYTHONPATH=. uvicorn eduai_backend.main:app`).
- Veritabanı varsayılan olarak `eduai_backend/eduai.db` dosyasında SQLite kullanır. İsteğe bağlı olarak dosyayı silebilir veya farklı bir veritabanı motoru ile değiştirebilirsiniz.