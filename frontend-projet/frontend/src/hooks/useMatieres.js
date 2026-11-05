import { useState, useEffect } from 'react';

/**
 * Hook qui récupère les matières ET les promotions associées au prof connecté.
 * Retourne { matieres: string[], promos: string[], loading: bool }
 */
export default function useMatieres() {
  const [matieres, setMatieres] = useState([]);
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('exocraft_token');
    if (!token) { setLoading(false); return; }

    fetch('/api/auth/me/matieres', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        setMatieres(data.matieres ?? []);
        setPromos(data.promos ?? []);
      })
      .catch(() => { setMatieres([]); setPromos([]); })
      .finally(() => setLoading(false));
  }, []);

  return { matieres, promos, loading };
}
