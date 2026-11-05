import { Link } from '../router.jsx';

export default function NotFoundPage() {
  return (
    <div className="state">
      <h1>Сторінку не знайдено</h1>
      <p className="muted">Перевірте адресу або поверніться на головну.</p>
      <Link to="/" className="btn btn-primary">
        На головну
      </Link>
    </div>
  );
}
