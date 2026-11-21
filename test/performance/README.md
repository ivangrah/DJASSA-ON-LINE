# Tests de performance (k6)

Seuils proposés (à ajuster après mesure) :

- `GET /api/v1/catalog/articles` : p95 < 300 ms, erreurs < 1 %.
- `POST /api/v1/auth/login` : p95 < 400 ms sous 50 VU (et throttle actif).
- `GET /api/v1/messages/conversations` : p95 < 400 ms.

## Smoke test d'exemple

```js
// tests/performance/smoke.js
import http from 'k6/http';
import { check, sleep } from 'k6';
export const options = { vus: 20, duration: '30s', thresholds: { http_req_duration: ['p(95)<500'] } };
export default function () {
  const r = http.get('http://127.0.0.1:8080/api/v1/catalog/articles');
  check(r, { 'status 200': (x) => x.status === 200 });
  sleep(1);
}
```
