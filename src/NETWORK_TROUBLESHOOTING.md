# Fix "Network Error" / ERR_NETWORK (Android Emulator)

The app calls `http://10.0.2.2:8000/api/v1/employee/...`. **ERR_NETWORK** means the emulator cannot reach that URL.

## 1. Use Laravel with `php artisan serve`

From your **Laravel API project** folder (not this app):

```bash
php artisan serve --host=0.0.0.0
```

- Must use **`--host=0.0.0.0`** so the Android emulator (via `10.0.2.2`) can connect.
- Default port is **8000**. If you use another port, update `src/config/api.ts` (e.g. `10.0.2.2:8080`).

## 2. If you use XAMPP (Apache)

- Apache usually runs on port **80** (no port in URL).
- In `src/config/api.ts`, set a dev override so the app uses port 80:

  - Change the Android URL to: `http://10.0.2.2/api/v1/employee` (no `:8000`),
  - or set `API_BASE_URL_OVERRIDE = 'http://10.0.2.2/api/v1/employee'` and use it for both platforms if you want.

- Ensure your Laravel app is the one served by XAMPP at `http://localhost/api/v1/employee/...`.

## 3. Test from your machine first

In a browser or terminal on your **Mac**:

```bash
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8000/api/v1/employee/documents
```

- If you get **401** (Unauthorized) or **200**, the API is reachable on your machine.
- If connection is refused, start the API (e.g. `php artisan serve --host=0.0.0.0`).

## 4. Use production API while developing

To avoid local network issues, point the app to your live API:

In **`src/config/api.ts`**, set:

```ts
const API_BASE_URL_OVERRIDE = 'https://hr.elitementors.org.uk/api/v1/employee';
```

Then the app will use the production backend and the emulator does not need to reach your Mac.

## 5. Physical Android device

Use your computer’s local IP instead of `10.0.2.2`:

```ts
const API_BASE_URL_OVERRIDE = 'http://192.168.1.XXX:8000/api/v1/employee';
```

Replace `192.168.1.XXX` with your Mac’s IP (System Preferences → Network). The API must be started with `--host=0.0.0.0`.
